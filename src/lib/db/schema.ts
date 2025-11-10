import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),

  role: text('role', { enum: ['nurse', 'patient', 'admin', 'doctor'] })
    .notNull()
    .default('patient'),

  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),

  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(),
  message: text('message').notNull(),
  meta: text('meta'),
  error: text('error'),
  level: text('level', { enum: ['debug', 'info', 'warn', 'error'] }).notNull(),
});
