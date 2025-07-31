import mongoose, { ConnectOptions } from "mongoose";

interface ConnectionOptions {
  mongoUri: string;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(options: ConnectionOptions): Promise<void> {
    try {
      if (this.isConnected || mongoose.connection.readyState === 1) {
        console.log("✅ Database already connected");
        return;
      }

      const mongooseOptions: ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      await mongoose.connect(options.mongoUri, mongooseOptions);

      this.isConnected = true;
      console.log("✅ Connected to MongoDB successfully");

      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.log("📡 MongoDB disconnected");
        this.isConnected = false;
      });
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log("📡 Disconnected from MongoDB");
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// ✅ Export ready-to-use instance
export const dbConnection = DatabaseConnection.getInstance();