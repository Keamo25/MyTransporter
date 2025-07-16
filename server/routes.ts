import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransportRequestSchema, insertBidSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Transport request routes
  app.post('/api/transport-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'client') {
        return res.status(403).json({ message: "Only clients can create transport requests" });
      }

      const validatedData = insertTransportRequestSchema.parse(req.body);
      const request = await storage.createTransportRequest({
        ...validatedData,
        clientId: userId,
      });
      
      res.json(request);
    } catch (error) {
      console.error("Error creating transport request:", error);
      res.status(500).json({ message: "Failed to create transport request" });
    }
  });

  app.get('/api/transport-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      let requests;
      if (user.role === 'client') {
        requests = await storage.getTransportRequestsForClient(userId);
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const requestId = parseInt(req.params.id);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const request = await storage.getTransportRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Check permissions
      if (user.role === 'client' && request.clientId !== userId) {
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const requestId = parseInt(req.params.id);
      const { driverId } = req.body;
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can assign drivers" });
      }

      const request = await storage.updateTransportRequestStatus(requestId, 'assigned', driverId);
      
      // Update bid status
      const bids = await storage.getBidsForRequest(requestId);
      for (const bid of bids) {
        if (bid.driverId === driverId) {
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: "Only drivers can create bids" });
      }

      const validatedData = insertBidSchema.parse(req.body);
      const bid = await storage.createBid({
        ...validatedData,
        driverId: userId,
      });
      
      res.json(bid);
    } catch (error) {
      console.error("Error creating bid:", error);
      res.status(500).json({ message: "Failed to create bid" });
    }
  });

  app.get('/api/bids/request/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const requestId = parseInt(req.params.requestId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const request = await storage.getTransportRequestById(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Check permissions
      if (user.role === 'client' && request.clientId !== userId) {
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'driver') {
        return res.status(403).json({ message: "Only drivers can view their bids" });
      }

      const bids = await storage.getBidsForDriver(userId);
      res.json(bids);
    } catch (error) {
      console.error("Error fetching driver bids:", error);
      res.status(500).json({ message: "Failed to fetch driver bids" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
