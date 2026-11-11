// import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { loadEnvConfig} from "@next/env";

loadEnvConfig(process.cwd(), true);

export default defineConfig({
  schema: ["auth-schema.ts", "database/schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});