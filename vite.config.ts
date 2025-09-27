import { defineConfig, Plugin, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
      fs: {
        strict: false,
      },
      open: true,
      // fallback for SPA
      historyApiFallback: true,
      allowedHosts: [
        "janseva-portal-dashboard.onrender.com",
      ],
    },
    build: {
      outDir: "dist/spa",
    },
    plugins: [react(), expressPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV || "development"),
      "process.env.VITE_USERS_DATA_API": JSON.stringify(
        env.VITE_USERS_DATA_API,
      ),
    },
  };
});

function expressPlugin(): Plugin {
  let expressApp: any = null;

  return {
    name: "express-plugin",
    apply: "serve",
    async buildStart() {
      try {
        await import("dotenv/config");
        const { createServer } = await import("./server/index.js");
        expressApp = await createServer(); // Await server with DB
        console.log("✅ Express app fully initialized with DB");
      } catch (error) {
        console.error("❌ Failed to initialize Express server:", error);
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/api/") && expressApp) {
          expressApp(req, res, next);
        } else {
          next();
        }
      });
    },
  };
}
