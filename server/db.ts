import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import * as schema from "@shared/schema";

const { Pool } = pg;

function loadEnvFromFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  try {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
      if (!match) return;
      const [, key, rawValue] = match;
      if (process.env[key]) return;
      const value = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      process.env[key] = value;
    });
  } catch (error) {
    console.warn("Failed to load .env file", error);
  }
}

loadEnvFromFile();

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================
// Supabase PostgreSQL is the ONLY active database for this application.
// The backend connects via DATABASE_URL environment variable.
// No fallback databases, no conditional connections.
//
// Connection String (from Supabase Dashboard → Settings → Database):

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. For Supabase, copy the connection string from your Supabase Dashboard → Settings → Database → Connection String (URI format).",
  );
}

// Configure SSL for Supabase connections (required for external connections)
// Supabase URLs contain 'supabase' or use port 6543
const isSupabase =
  databaseUrl.includes("supabase") || databaseUrl.includes(":6543");
const poolConfig: pg.PoolConfig = {
  connectionString: databaseUrl,
  ...(isSupabase && {
    ssl: {
      rejectUnauthorized: false, // Required for Supabase pooler connections
    },
  }),
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

// Health check function to verify database connectivity
// Used by /api/health endpoint to confirm Supabase/PostgreSQL is reachable
export async function checkDatabaseHealth(): Promise<{ connected: boolean; error?: string }> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { connected: true };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
}
