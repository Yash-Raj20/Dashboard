import { createServer } from "./index.js";
import http from "http";

const PORT = process.env.PORT || 8080;

async function start() {
  const app = await createServer();
  http.createServer(app).listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});