import { LoggerParams, LogLevel } from '.';
import { db } from '../db/client';
import { logs } from '../db/schema';
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

  debug(params: LoggerParams) {
    if (!this.shouldLog('debug')) return;

    db.insert(logs).values({
      timestamp: this.formatTimestamp(),
      message: params.message,
      level: 'debug',
      meta: params.meta ? JSON.stringify(params.meta) : null,
    });
  }

  info(params: LoggerParams) {
    if (!this.shouldLog('info')) return;

    db.insert(logs).values({
      timestamp: this.formatTimestamp(),
      message: params.message,
      level: 'info',
      meta: params.meta ? JSON.stringify(params.meta) : null,
    });
  }

  warn(params: LoggerParams) {
    if (!this.shouldLog('warn')) return;

    db.insert(logs).values({
      timestamp: this.formatTimestamp(),
      message: params.message,
      level: 'warn',
      meta: params.meta ? JSON.stringify(params.meta) : null,
    });
  }

  error(params: LoggerParams) {
    if (!this.shouldLog('error')) return;

    if (params.error instanceof HttpError) {
      db.insert(logs).values({
        timestamp: this.formatTimestamp(),
        message: params.message,
        level: 'error',
        meta: params.meta ? JSON.stringify(params.meta) : null,
        error: `[${params.error.getCode()}] ${params.error.message}`,
      });
    } else {
      db.insert(logs).values({
        timestamp: this.formatTimestamp(),
        message: params.message,
        level: 'error',
        meta: params.meta ? JSON.stringify(params.meta) : null,
        error: params.error?.message,
      });
    }
  }
}
