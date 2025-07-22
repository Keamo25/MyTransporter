import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertTransportRequestSchema, insertBidSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Transport request routes
  app.post('/api/transport-requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'client') {
        return res.status(403).json({ message: "Only clients can create transport requests" });
      }

      // Create a schema that converts client data to proper database format
      const serverRequestSchema = z.object({
        pickupLocation: z.string(),
        deliveryLocation: z.string(),
        pickupDate: z.string(),
        pickupTime: z.string(),
        deliveryDate: z.string(),
        deliveryTime: z.string(),
        itemDescription: z.string(),
        weight: z.number(),
        dimensions: z.string(),
        budget: z.number(),
      });
      
      const clientData = serverRequestSchema.parse(req.body);
      
      // Convert separate date/time fields to Date objects
      const pickupDateTime = new Date(`${clientData.pickupDate}T${clientData.pickupTime}`);
      const deliveryDateTime = new Date(`${clientData.deliveryDate}T${clientData.deliveryTime}`);
      
      const request = await storage.createTransportRequest({
        pickupLocation: clientData.pickupLocation,
        deliveryLocation: clientData.deliveryLocation,
        pickupDate: pickupDateTime,
        deliveryDate: deliveryDateTime,
        itemDescription: clientData.itemDescription,
        weight: clientData.weight.toString(),
        dimensions: clientData.dimensions,
        budget: clientData.budget.toString(),
        clientId: user.id,
      });
      
      res.json(request);
    } catch (error) {
      console.error("Error creating transport request:", error);
      res.status(500).json({ message: "Failed to create transport request" });
    }
  });

  app.get('/api/transport-requests', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      let requests;
      if (user.role === 'client') {
        requests = await storage.getTransportRequestsForClient(user.id);
      } else if (user.role === 'driver') {
        // Drivers see all pending requests but without budget info
        requests = await storage.getTransportRequests();
        requests = requests
          .filter(req => req.status === 'pending')
          .map(req => ({ ...req, budget: undefined }));
      } else if (user.role === 'admin') {
        requests = await storage.getTransportRequests();
      } else {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching transport requests:", error);
      res.status(500).json({ message: "Failed to fetch transport requests" });
    }
  });

  app.get('/api/transport-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const requestId = parseInt(req.params.id);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const request = await storage.getTransportRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Check permissions
      if (user.role === 'client' && request.clientId !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (user.role === 'driver') {
        // Hide budget from drivers
        res.json({ ...request, budget: undefined });
      } else {
        res.json(request);
      }
    } catch (error) {
      console.error("Error fetching transport request:", error);
      res.status(500).json({ message: "Failed to fetch transport request" });
    }
  });

  app.patch('/api/transport-requests/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const requestId = parseInt(req.params.id);
      const { driverId } = req.body;
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can assign drivers" });
      }

      const request = await storage.updateTransportRequestStatus(requestId, 'assigned', parseInt(driverId));
      
      // Update bid status
      const bids = await storage.getBidsForRequest(requestId);
      for (const bid of bids) {
        if (bid.driverId === parseInt(driverId)) {
          await storage.updateBidStatus(bid.id, 'accepted');
        } else {
          await storage.updateBidStatus(bid.id, 'rejected');
        }
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error assigning driver:", error);
      res.status(500).json({ message: "Failed to assign driver" });
    }
  });

  // Bid routes
  app.post('/api/bids', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: "Only drivers can create bids" });
      }

      // Convert client data to database format
      const { requestId, amount, message, estimatedDelivery } = req.body;
      
      const bidToCreate = {
        requestId,
        amount: amount.toString(), // Convert number to string for decimal
        message,
        estimatedDelivery: new Date(estimatedDelivery), // Convert string to Date
        driverId: user.id,
      };
      
      const bid = await storage.createBid(bidToCreate);
      
      res.json(bid);
    } catch (error) {
      console.error("Error creating bid:", error);
      res.status(500).json({ message: "Failed to create bid" });
    }
  });

  app.get('/api/bids/request/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const requestId = parseInt(req.params.requestId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const request = await storage.getTransportRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Check permissions
      if (user.role === 'client' && request.clientId !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      if (user.role === 'driver') {
        return res.status(403).json({ message: "Drivers cannot view bids" });
      }

      const bids = await storage.getBidsForRequest(requestId);
      res.json(bids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.get('/api/bids/driver', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: "Only drivers can view their bids" });
      }

      const bids = await storage.getBidsForDriver(user.id);
      res.json(bids);
    } catch (error) {
      console.error("Error fetching driver bids:", error);
      res.status(500).json({ message: "Failed to fetch driver bids" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can view stats" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Reassign request (admin only)
  app.patch('/api/transport-requests/:id/reassign', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const requestId = parseInt(req.params.id);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can reassign requests" });
      }

      const request = await storage.getTransportRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (request.status !== 'assigned' && request.status !== 'in_progress') {
        return res.status(400).json({ message: "Only assigned or in-progress requests can be reassigned" });
      }

      const updatedRequest = await storage.reassignTransportRequest(requestId);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error reassigning request:", error);
      res.status(500).json({ message: "Failed to reassign request" });
    }
  });

  // Update request status (admin only)
  app.patch('/api/transport-requests/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const requestId = parseInt(req.params.id);
      const { status } = req.body;

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update request status" });
      }

      const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const request = await storage.getTransportRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      const updatedRequest = await storage.updateTransportRequestStatus(requestId, status);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating request status:", error);
      res.status(500).json({ message: "Failed to update request status" });
    }
  });

  // Get driver profile information
  app.get('/api/drivers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const driverId = parseInt(req.params.id);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Only admins and clients can view driver profiles
      if (user.role !== 'admin' && user.role !== 'client') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const driver = await storage.getUserById(driverId);
      
      if (!driver || driver.role !== 'driver') {
        return res.status(404).json({ message: "Driver not found" });
      }

      // Return basic driver information (no sensitive data like password)
      res.json({
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        role: driver.role,
        createdAt: driver.createdAt,
      });
    } catch (error) {
      console.error("Error fetching driver profile:", error);
      res.status(500).json({ message: "Failed to fetch driver profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
