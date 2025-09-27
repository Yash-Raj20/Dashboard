import { createServer } from "./index";
import http from "http";

async function start() {
  try {
    const app = await createServer();

    const PORT = process.env.PORT || 3000;
    http.createServer(app).listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();