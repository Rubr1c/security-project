import { Logger, LoggerParams } from '.';
import { LogLevel } from '../db/types';
import { BaseLogger } from './base-logger';
import { AuditLogger } from './audit-logger';

export class CompositeLogger extends BaseLogger {
  /**
   * The loggers to use.
   */
  private loggers: Logger[];

  constructor(loggers: Logger[], level?: LogLevel) {
    super({ level });
    this.loggers = loggers;
  }

  getAuditLogger(): AuditLogger | undefined {
    return this.loggers.find((l) => l instanceof AuditLogger) as
      | AuditLogger
      | undefined;
  }

  debug(params: LoggerParams) {
    this.loggers.forEach((l) => l.debug(params));
  }

  info(params: LoggerParams) {
    this.loggers.forEach((l) => l.info(params));
  }

  warn(params: LoggerParams) {
    this.loggers.forEach((l) => l.warn(params));
  }

  error(params: LoggerParams) {
    this.loggers.forEach((l) => l.error(params));
  }
}
