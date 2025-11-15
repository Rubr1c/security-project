import { logs, users } from './schema';

export type UserRole = (typeof users.role.enumValues)[number];
export type User = typeof users.$inferSelect;

export type LogLevel = (typeof logs.level.enumValues)[number];
