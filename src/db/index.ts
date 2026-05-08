import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { env } from '../env';
import * as schema from './schema';

// Create the Neon HTTP client (no persistent TCP connection — ideal for serverless)
const sql = neon(env.DATABASE_URL);

// Attach Drizzle with the full schema so we get type-safe `db.query.*` access
export const db = drizzle(sql, { schema });

export type DB = typeof db;
