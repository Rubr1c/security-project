import { LoggerParams } from '.';
import { db } from '../db/client';
import { logs } from '../db/schema';
import { LogLevel } from '../db/types';
import { HttpError } from '../http/http-error';
import { BaseLogger } from './base-logger';

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

    if (params.error instanceof HttpError) {
      db.insert(logs)
        .values({
          timestamp: this.formatTimestamp(),
          message: params.message,
          level: 'error',
          meta: params.meta ? this.safeStringify(params.meta) : null,
          error: `[${params.error.getCode()}] ${params.error.message}`,
        })
        .run();
    } else {
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
  }
}
