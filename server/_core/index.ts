import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { verifyAndFixDatabase } from "../verify-and-fix-db";
import { storageGetData } from "../storage";
import { runStartupMigrations } from "../startup-migrations.js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Initialize database tables if they don't exist
  try {
    await verifyAndFixDatabase();
    console.log('[Server] Database verification completed');
  } catch (error) {
    console.error('[Server] Database initialization failed:', error);
    // Continue anyway - the app might work in read-only mode or with existing tables
  }

  // Run startup migrations
  try {
    await runStartupMigrations();
    console.log('[Server] Startup migrations completed');
  } catch (error) {
    console.error('[Server] Startup migrations failed:', error);
  }

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // File serving endpoint - handle full paths with subdirectories
  app.get("/api/files/*", async (req, res) => {
    try {
      // Get the full path after /api/files/
      const key = req.params[0];
      const file = await storageGetData(key);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.send(file.data);
    } catch (error) {
      console.error("[File Serving] Error:", error);
      res.status(500).json({ error: "Failed to retrieve file" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ path, error }) => {
        console.error(`[tRPC Error] Path: ${path}`);
        console.error(`[tRPC Error] Code: ${error.code}`);
        console.error(`[tRPC Error] Message: ${error.message}`);
        console.error(`[tRPC Error] Stack:`, error.stack);
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // In production (Railway), use the PORT environment variable directly
  // In development, find an available port
  const preferredPort = parseInt(process.env.PORT || "3000");
  let port = preferredPort;
  
  if (process.env.NODE_ENV === "development") {
    port = await findAvailablePort(preferredPort);
    if (port !== preferredPort) {
      console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
