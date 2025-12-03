import { appointments, logs, medications, users } from './schema';

export type UserRole = (typeof users.role.enumValues)[number];
export type User = typeof users.$inferSelect;

export type LogLevel = (typeof logs.level.enumValues)[number];

export type AppointmentStatus = (typeof appointments.status.enumValues)[number];
export type Appointment = typeof appointments.$inferSelect;
export type Medication = typeof medications.$inferSelect;
