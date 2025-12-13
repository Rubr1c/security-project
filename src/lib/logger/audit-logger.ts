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

const SENSITIVE_KEYS = new Set([
  'email',
  'emailhash',
  'passwordhash',
  'otphash',
  'pendingpasswordhash',
  'passwordresettoken',

  'diagnosis',
  'dosage',
  'instructions',
]);

const REDACTED_VALUE = '[REDACTED]';

export class AuditLogger extends BaseLogger {
  /**
   * Creates a console logger.
   * @param level - The level of the logger. @default 'info'
   */
  constructor({ level }: { level?: LogLevel } = {}) {
    super({ level });
  }

  /**
   * Recursively sanitizes an object by redacting sensitive keys.
   * Handles nested objects and arrays.
   */
  private sanitizeMeta(obj: unknown, seen = new WeakSet()): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    // Handle circular references
    if (seen.has(obj as object)) {
      return '[Circular]';
    }
    seen.add(obj as object);

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeMeta(item, seen));
    }

    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle plain objects
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase().replace(/[-_\s]/g, '');

      if (SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[key] = REDACTED_VALUE;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMeta(value, seen);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Safely stringifies an object, handling circular references and sanitizing PII.
   */
  private safeStringify(obj: unknown): string {
    const sanitized = this.sanitizeMeta(obj);
    return JSON.stringify(sanitized);
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
