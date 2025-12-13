import {
  sqliteTable,
  text,
  integer,
  foreignKey,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    emailHash: text('email_hash').notNull().unique(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),

    role: text('role', { enum: ['nurse', 'patient', 'admin', 'doctor'] })
      .notNull()
      .default('patient'),

    doctorId: integer('doctor_id').default(sql`NULL`),

    emailVerifiedAt: text('email_verified_at').default(sql`NULL`),

    otpHash: text('otp_hash').default(sql`NULL`),
    otpExpiresAt: text('otp_expires_at').default(sql`NULL`),
    otpLastSentAt: text('otp_last_sent_at').default(sql`NULL`),
    otpAttempts: integer('otp_attempts').notNull().default(0),

    loginAttempts: integer('login_attempts').notNull().default(0),
    loginLockedUntil: text('login_locked_until').default(sql`NULL`),

    pendingPasswordHash: text('pending_password_hash').default(sql`NULL`),
    pendingPasswordExpiresAt: text('pending_password_expires_at').default(
      sql`NULL`
    ),

    passwordResetToken: text('password_reset_token')
      .unique()
      .default(sql`NULL`),
    passwordResetTokenExpiresAt: text(
      'password_reset_token_expires_at'
    ).default(sql`NULL`),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),

    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.doctorId],
      foreignColumns: [table.id],
      name: 'users_doctor_id_fkey',
    }),
  ]
);

export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(),
  message: text('message').notNull(),
  meta: text('meta'),
  error: text('error'),
  level: text('level', { enum: ['debug', 'info', 'warn', 'error'] }).notNull(),
});

export const appointments = sqliteTable(
  'appointments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    patientId: integer('patient_id').notNull(),
    doctorId: integer('doctor_id').notNull(),
    date: text('date').notNull(),
    status: text('status', {
      enum: ['pending', 'confirmed', 'denied', 'completed'],
    })
      .notNull()
      .default('pending'),
    diagnosis: text('diagnosis'),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.patientId],
      foreignColumns: [users.id],
      name: 'appointments_patient_id_fkey',
    }),
    foreignKey({
      columns: [table.doctorId],
      foreignColumns: [users.id],
      name: 'appointments_doctor_id_fkey',
    }),
  ]
);

export const medications = sqliteTable(
  'medications',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    appointmentId: integer('appointment_id').notNull(),
    name: text('name').notNull(),
    dosage: text('dosage').notNull(),
    instructions: text('instructions').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.appointmentId],
      foreignColumns: [appointments.id],
      name: 'medications_appointment_id_fkey',
    }),
  ]
);
