import { pgTable, text, timestamp, real, jsonb, serial } from 'drizzle-orm/pg-core';

// ─────────────────────────────────────────────────────────────────────────────
// Projects — top-level canvas boards
// ─────────────────────────────────────────────────────────────────────────────
export const projects = pgTable('projects', {
  id: text('id').primaryKey(), // nanoid / uuid supplied by the app layer
  name: text('name').notNull(),
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
