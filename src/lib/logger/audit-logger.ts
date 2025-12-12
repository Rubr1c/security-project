import { LoggerParams } from '.';
import { db } from '../db/client';
import { logs } from '../db/schema';
import { LogLevel } from '../db/types';
import { BaseLogger } from './base-logger';

export type AuditEventType =
  | 'PHI_ACCESS'
  | 'DATA_EXPORT'
  | 'ACCOUNT_DELETION'
  | 'SECURITY_ALERT';

export interface AuditLogMeta {
  event: AuditEventType;
  actorId: number | string;
  [key: string]: unknown;
}

export class AuditLogger extends BaseLogger {
  /**
   * Creates a console logger.
   * @param level - The level of the logger. @default 'info'
   */
  constructor({ level }: { level?: LogLevel } = {}) {
    super({ level });
  }

  /**
   * Safely stringifies an object, handling circular references
   */
  private safeStringify(obj: unknown): string {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    });
  }

  debug(params: LoggerParams) {
    if (!this.shouldLog('debug')) return;

    db.insert(logs)
      .values({
        timestamp: this.formatTimestamp(),
        message: params.message,
        level: 'debug',
        meta: params.meta ? this.safeStringify(params.meta) : null,
      })
      .run();
  }

  info(params: LoggerParams) {
    if (!this.shouldLog('info')) return;

    db.insert(logs)
      .values({
        timestamp: this.formatTimestamp(),
        message: params.message,
        level: 'info',
        meta: params.meta ? this.safeStringify(params.meta) : null,
      })
      .run();
  }

  warn(params: LoggerParams) {
    if (!this.shouldLog('warn')) return;

    db.insert(logs)
      .values({
        timestamp: this.formatTimestamp(),
        message: params.message,
        level: 'warn',
        meta: params.meta ? this.safeStringify(params.meta) : null,
      })
      .run();
  }

  error(params: LoggerParams) {
    if (!this.shouldLog('error')) return;

    db.insert(logs)
      .values({
        timestamp: this.formatTimestamp(),
        message: params.message,
        level: 'error',
        meta: params.meta ? this.safeStringify(params.meta) : null,
        error: params.error?.message,
      })
      .run();
  }

  /**
   * Logs PHI access by a doctor/staff.
   */
  logPhiAccess(
    actorId: number | string,
    patientId: number | string,
    resource: string,
    resourceId: number | string
  ) {
    const meta: AuditLogMeta = {
      event: 'PHI_ACCESS',
      actorId,
      patientId,
      resource,
      resourceId,
    };

    this.info({
      message: `Doctor ${actorId} viewed ${resource} ${resourceId} for Patient ${patientId}`,
      meta,
    });
  }

  /**
   * Logs a user exporting their data.
   */
  logDataExport(userId: number | string, targetUserId: number | string) {
    const meta: AuditLogMeta = {
      event: 'DATA_EXPORT',
      actorId: userId,
      targetUserId,
    };

    this.info({
      message: `User ${userId} exported data for User ${targetUserId}`,
      meta,
    });
  }

  /**
   * Logs account deletion.
   */
  logAccountDeletion(userId: number | string, reason?: string) {
    const meta: AuditLogMeta = {
      event: 'ACCOUNT_DELETION',
      actorId: userId,
      reason,
      finalStateTimestamp: new Date().toISOString(),
    };

    this.info({
      message: `Account deletion for User ${userId}`,
      meta,
    });
  }
}
