// Builds prisma/postgres/schema.prisma from the main schema for the hosted (Postgres/Supabase) database.
// Local development keeps SQLite; the hosting build (npm run vercel-build) uses this Postgres copy.
import fs from "node:fs";
const src = fs.readFileSync("prisma/schema.prisma", "utf8");
const datasource = `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // Supabase pooled connection (port 6543, ?pgbouncer=true)
  directUrl = env("DIRECT_URL")   // Supabase direct connection (port 5432), used for schema changes
}`;
const out = src.replace(/datasource db \{[\s\S]*?\n\}/, datasource);
if (out === src) throw new Error("datasource block not found");
fs.mkdirSync("prisma/postgres", { recursive: true });
fs.writeFileSync("prisma/postgres/schema.prisma", "// GENERATED from prisma/schema.prisma by scripts/postgres-schema.mjs — do not edit by hand.\n" + out);
console.log("Wrote prisma/postgres/schema.prisma");
