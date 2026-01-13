import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "../_core/env";
import * as schema from "../../drizzle/schema";
import mysql from "mysql2/promise";

// Cache the connection pool
let poolConnection: mysql.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      if (!poolConnection) {
        poolConnection = mysql.createPool(process.env.DATABASE_URL);
      }
      _db = drizzle(poolConnection, { mode: "default", schema });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
