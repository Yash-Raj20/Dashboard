import dotenv from "dotenv";
import { join } from "path";

// Load .env from root
dotenv.config({ path: join(process.cwd(), ".env") });

import("./dist/server/node-build.mjs");