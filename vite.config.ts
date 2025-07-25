import { defineConfig, Plugin, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 8080,
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
      // Make env variables available to the server-side code
      'process.env': env
    },
  };
});

function expressPlugin(): Plugin {
  let expressApp: any = null;

  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async buildStart() {
      // Initialize Express app once during build start
      try {
        const { createServer } = await import("./server/index.js");
        expressApp = createServer();
        console.log("Express server initialized");
      } catch (error) {
        console.error("Failed to initialize Express server:", error);
      }
    },
    configureServer(server) {
      // Add Express app as middleware to Vite dev server
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
