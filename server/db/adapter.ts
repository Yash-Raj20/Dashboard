import { dbConnection } from "./connection.js";

// Database mode: 'mongodb' or 'memory'
let dbMode: "mongodb" | "memory" = "memory";

export function setDatabaseMode(mode: "mongodb" | "memory") {
  dbMode = mode;
  console.log(`📊 Database mode set to: ${mode}`);
}

export function getDatabaseMode(): "mongodb" | "memory" {
  return dbMode;
}

export function isMongoDBAvailable(): boolean {
  return dbMode === "mongodb" && dbConnection.getConnectionStatus();
}

// Wrapper function to handle both database modes
export async function withDatabase<T>(
  mongoFunction: () => Promise<T>,
  memoryFunction: () => T | Promise<T>,
): Promise<T> {
  if (dbMode === "mongodb" && dbConnection.getConnectionStatus()) {
    try {
      return await mongoFunction();
    } catch (error) {
      console.warn("MongoDB operation failed, falling back to memory:", error);
      return await memoryFunction();
    }
  }
  return await memoryFunction();
}
