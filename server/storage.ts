import { type User, type InsertUser, type LeaderboardEntry, type InsertLeaderboardEntry } from "@shared/schema";
import { users, leaderboard } from "@shared/schema";
import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = ws;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  addLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      (await import("drizzle-orm")).eq(users.id, id)
    );
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      (await import("drizzle-orm")).eq(users.username, username)
    );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    return db.select().from(leaderboard).orderBy(desc(leaderboard.score)).limit(limit);
  }

  async addLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const [row] = await db.insert(leaderboard).values(entry).returning();
    return row;
  }
}

export const storage = new DatabaseStorage();
