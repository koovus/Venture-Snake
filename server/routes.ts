import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeaderboardSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/leaderboard", async (_req, res) => {
    const entries = await storage.getLeaderboard(20);
    res.json(entries);
  });

  app.post("/api/leaderboard", async (req, res) => {
    const parsed = insertLeaderboardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const entry = await storage.addLeaderboardEntry(parsed.data);
    res.json(entry);
  });

  return httpServer;
}
