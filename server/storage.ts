import {
  users,
  transportRequests,
  bids,
  gpsTracking,
  type User,
  type InsertUser,
  type InsertTransportRequest,
  type TransportRequest,
  type InsertBid,
  type Bid,
  type GpsTracking,
  type InsertGpsTracking,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transport request operations
  createTransportRequest(request: InsertTransportRequest & { 
    clientId: number; 
    isMultipleStops?: boolean; 
    stopLocations?: string[]; 
  }): Promise<TransportRequest>;
  getTransportRequests(): Promise<TransportRequest[]>;
  getTransportRequestsForClient(clientId: number): Promise<TransportRequest[]>;
  getTransportRequestById(id: number): Promise<TransportRequest | undefined>;
  updateTransportRequestStatus(id: number, status: string, assignedDriverId?: number): Promise<TransportRequest>;
  
  // Bid operations
  createBid(bid: InsertBid & { driverId: number }): Promise<Bid>;
  getBidsForRequest(requestId: number): Promise<Bid[]>;
  getBidsForDriver(driverId: number): Promise<Bid[]>;
  updateBidStatus(id: number, status: string): Promise<Bid>;
  
  // Dashboard stats
  getAdminStats(): Promise<{
    totalRequests: number;
    activeDrivers: number;
    pendingApproval: number;
    completedToday: number;
  }>;
  
  // GPS Tracking operations
  createGpsTracking(tracking: InsertGpsTracking): Promise<GpsTracking>;
  getGpsTrackingForRequest(requestId: number): Promise<GpsTracking[]>;
  getGpsTrackingForDriver(driverId: number): Promise<GpsTracking[]>;
  getLatestGpsTrackingForRequest(requestId: number): Promise<GpsTracking | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Transport request operations
  async createTransportRequest(request: InsertTransportRequest & { 
    clientId: number; 
    isMultipleStops?: boolean; 
    stopLocations?: string[]; 
  }): Promise<TransportRequest> {
    const [transportRequest] = await db
      .insert(transportRequests)
      .values({
        ...request,
        isMultipleStops: request.isMultipleStops || false,
        stopLocations: request.stopLocations || [],
      })
      .returning();
    return transportRequest;
  }

  async getTransportRequests(): Promise<TransportRequest[]> {
    return await db
      .select()
      .from(transportRequests)
      .orderBy(desc(transportRequests.createdAt));
  }

  async getTransportRequestsForClient(clientId: number): Promise<TransportRequest[]> {
    return await db
      .select()
      .from(transportRequests)
      .where(eq(transportRequests.clientId, clientId))
      .orderBy(desc(transportRequests.createdAt));
  }

  async getTransportRequestById(id: number): Promise<TransportRequest | undefined> {
    const [request] = await db
      .select()
      .from(transportRequests)
      .where(eq(transportRequests.id, id));
    return request;
  }

  async updateTransportRequestStatus(id: number, status: string, assignedDriverId?: number): Promise<TransportRequest> {
    const updateData: any = { status, updatedAt: new Date() };
    if (assignedDriverId) {
      updateData.assignedDriverId = assignedDriverId;
    }
    
    const [request] = await db
      .update(transportRequests)
      .set(updateData)
      .where(eq(transportRequests.id, id))
      .returning();
    return request;
  }

  // Bid operations
  async createBid(bid: InsertBid & { driverId: number }): Promise<Bid> {
    const [newBid] = await db
      .insert(bids)
      .values(bid)
      .returning();
    return newBid;
  }

  async getBidsForRequest(requestId: number): Promise<Bid[]> {
    return await db
      .select()
      .from(bids)
      .where(eq(bids.requestId, requestId))
      .orderBy(desc(bids.createdAt));
  }

  async getBidsForDriver(driverId: number): Promise<Bid[]> {
    return await db
      .select()
      .from(bids)
      .where(eq(bids.driverId, driverId))
      .orderBy(desc(bids.createdAt));
  }

  async updateBidStatus(id: number, status: string): Promise<Bid> {
    const [bid] = await db
      .update(bids)
      .set({ status, updatedAt: new Date() })
      .where(eq(bids.id, id))
      .returning();
    return bid;
  }

  // Dashboard stats
  async getAdminStats(): Promise<{
    totalRequests: number;
    activeDrivers: number;
    pendingApproval: number;
    completedToday: number;
  }> {
    const [totalRequests] = await db
      .select({ count: count() })
      .from(transportRequests);

    const [activeDrivers] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "driver"));

    const [pendingApproval] = await db
      .select({ count: count() })
      .from(transportRequests)
      .where(eq(transportRequests.status, "pending"));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [completedToday] = await db
      .select({ count: count() })
      .from(transportRequests)
      .where(and(
        eq(transportRequests.status, "completed"),
        eq(transportRequests.updatedAt, today)
      ));

    return {
      totalRequests: totalRequests.count,
      activeDrivers: activeDrivers.count,
      pendingApproval: pendingApproval.count,
      completedToday: completedToday.count,
    };
  }

  async reassignTransportRequest(requestId: number): Promise<TransportRequest> {
    // Reset the request to pending status and remove assigned driver
    const [updatedRequest] = await db
      .update(transportRequests)
      .set({
        status: "pending",
        assignedDriverId: null,
        updatedAt: new Date(),
      })
      .where(eq(transportRequests.id, requestId))
      .returning();
    
    // Also reject all existing bids for this request to allow new bidding
    await db
      .update(bids)
      .set({
        status: "rejected",
        updatedAt: new Date(),
      })
      .where(eq(bids.requestId, requestId));

    return updatedRequest;
  }

  async updateTransportRequestStatusOnly(requestId: number, status: string): Promise<TransportRequest> {
    const [updatedRequest] = await db
      .update(transportRequests)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(transportRequests.id, requestId))
      .returning();

    return updatedRequest;
  }

  // GPS Tracking operations
  async createGpsTracking(tracking: InsertGpsTracking): Promise<GpsTracking> {
    const [gpsTrack] = await db
      .insert(gpsTracking)
      .values(tracking)
      .returning();
    return gpsTrack;
  }

  async getGpsTrackingForRequest(requestId: number): Promise<GpsTracking[]> {
    return await db
      .select()
      .from(gpsTracking)
      .where(eq(gpsTracking.requestId, requestId))
      .orderBy(desc(gpsTracking.timestamp));
  }

  async getGpsTrackingForDriver(driverId: number): Promise<GpsTracking[]> {
    return await db
      .select()
      .from(gpsTracking)
      .where(eq(gpsTracking.driverId, driverId))
      .orderBy(desc(gpsTracking.timestamp));
  }

  async getLatestGpsTrackingForRequest(requestId: number): Promise<GpsTracking | undefined> {
    const [latest] = await db
      .select()
      .from(gpsTracking)
      .where(eq(gpsTracking.requestId, requestId))
      .orderBy(desc(gpsTracking.timestamp))
      .limit(1);
    return latest;
  }
}

export const storage = new DatabaseStorage();
