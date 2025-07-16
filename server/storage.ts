import {
  users,
  transportRequests,
  bids,
  type User,
  type UpsertUser,
  type InsertTransportRequest,
  type TransportRequest,
  type InsertBid,
  type Bid,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Transport request operations
  createTransportRequest(request: InsertTransportRequest & { clientId: string }): Promise<TransportRequest>;
  getTransportRequests(): Promise<TransportRequest[]>;
  getTransportRequestsForClient(clientId: string): Promise<TransportRequest[]>;
  getTransportRequestById(id: number): Promise<TransportRequest | undefined>;
  updateTransportRequestStatus(id: number, status: string, assignedDriverId?: string): Promise<TransportRequest>;
  
  // Bid operations
  createBid(bid: InsertBid & { driverId: string }): Promise<Bid>;
  getBidsForRequest(requestId: number): Promise<Bid[]>;
  getBidsForDriver(driverId: string): Promise<Bid[]>;
  updateBidStatus(id: number, status: string): Promise<Bid>;
  
  // Dashboard stats
  getAdminStats(): Promise<{
    totalRequests: number;
    activeDrivers: number;
    pendingApproval: number;
    completedToday: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Transport request operations
  async createTransportRequest(request: InsertTransportRequest & { clientId: string }): Promise<TransportRequest> {
    const [transportRequest] = await db
      .insert(transportRequests)
      .values(request)
      .returning();
    return transportRequest;
  }

  async getTransportRequests(): Promise<TransportRequest[]> {
    return await db
      .select()
      .from(transportRequests)
      .orderBy(desc(transportRequests.createdAt));
  }

  async getTransportRequestsForClient(clientId: string): Promise<TransportRequest[]> {
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

  async updateTransportRequestStatus(id: number, status: string, assignedDriverId?: string): Promise<TransportRequest> {
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
  async createBid(bid: InsertBid & { driverId: string }): Promise<Bid> {
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

  async getBidsForDriver(driverId: string): Promise<Bid[]> {
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
    const totalRequests = await db
      .select({ count: transportRequests.id })
      .from(transportRequests);

    const activeDrivers = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.role, "driver"));

    const pendingApproval = await db
      .select({ count: transportRequests.id })
      .from(transportRequests)
      .where(eq(transportRequests.status, "pending"));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = await db
      .select({ count: transportRequests.id })
      .from(transportRequests)
      .where(and(
        eq(transportRequests.status, "completed"),
        eq(transportRequests.updatedAt, today)
      ));

    return {
      totalRequests: totalRequests.length,
      activeDrivers: activeDrivers.length,
      pendingApproval: pendingApproval.length,
      completedToday: completedToday.length,
    };
  }
}

export const storage = new DatabaseStorage();
