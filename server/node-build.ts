import { createServer } from "./index.js"; // server/index.ts compiled
import http from "http";

const PORT = process.env.PORT;

async function start() {
  const app = await createServer();
  http.createServer(app).listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});