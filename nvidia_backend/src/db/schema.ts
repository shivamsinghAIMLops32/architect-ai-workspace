import { pgTable, text, timestamp, real, jsonb, serial, boolean } from 'drizzle-orm/pg-core';

// ─────────────────────────────────────────────────────────────────────────────
// Projects — top-level canvas boards
// ─────────────────────────────────────────────────────────────────────────────
export const projects = pgTable('projects', {
  id: text('id').primaryKey(), // nanoid / uuid supplied by the app layer
  name: text('name').notNull(),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' }),  // nullable for backwards compat with existing rows
  shareToken: text('share_token'),  // nullable — generated on demand for sharing
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Nodes — individual infrastructure blocks on the canvas
// ─────────────────────────────────────────────────────────────────────────────
export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // e.g. "load_balancer", "api_server", "database"
  label: text('label').notNull(),
  positionX: real('position_x').notNull().default(0),
  positionY: real('position_y').notNull().default(0),
  dataJson: jsonb('data_json').default({}), // arbitrary metadata (config, icon, etc.)
});

// ─────────────────────────────────────────────────────────────────────────────
// Edges — directed connections between nodes
// ─────────────────────────────────────────────────────────────────────────────
export const edges = pgTable('edges', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  sourceNodeId: text('source_node_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  targetNodeId: text('target_node_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  dataJson: jsonb('data_json').default({}), // edge metadata: label, protocol, animated
});

// ─────────────────────────────────────────────────────────────────────────────
// Chat History — per-project conversation log with the AI agents
// ─────────────────────────────────────────────────────────────────────────────
export const chatHistory = pgTable('chat_history', {
  id: serial('id').primaryKey(), // auto-increment; useful for ordered retrieval
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Type Inference Helpers (used throughout the service layer)
// ─────────────────────────────────────────────────────────────────────────────
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;

export type Edge = typeof edges.$inferSelect;
export type NewEdge = typeof edges.$inferInsert;

export type ChatMessage = typeof chatHistory.$inferSelect;
export type NewChatMessage = typeof chatHistory.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Better Auth — Required Tables
// Column names must match Better Auth's internal contract EXACTLY.
// Ref: https://www.better-auth.com/docs/installation#database
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `user` is a reserved keyword in PostgreSQL, so the physical table is named
 * `ba_user` while Better Auth references it via the JS key `user`.
 * The drizzleAdapter accepts a `usePlural` option but column names are fixed.
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Better Auth Type Helpers
// ─────────────────────────────────────────────────────────────────────────────
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
