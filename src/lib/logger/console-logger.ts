import { LoggerParams } from '.';
import { LogLevel } from '../db/types';
import { HttpError } from '../http/http-error';
import { BaseLogger } from './base-logger';

export class ConsoleLogger extends BaseLogger {
  /**
   * Creates a console logger.
   * @param level - The level of the logger. @default 'info'
   */
  constructor({ level }: { level?: LogLevel } = {}) {
    super({ level });
  }

  debug(params: LoggerParams) {
    if (!this.shouldLog('debug')) return;
    console.debug(
      `[${this.formatTimestamp()}] [DEBUG] ${params.message}`,
      params.meta ?? ''
    );
  }

  info(params: LoggerParams) {
    if (!this.shouldLog('info')) return;
    console.info(
      `[${this.formatTimestamp()}] [INFO] ${params.message}`,
      params.meta ?? ''
    );
  }

  warn(params: LoggerParams) {
    if (!this.shouldLog('warn')) return;
    console.warn(
      `[${this.formatTimestamp()}] [WARN] ${params.message}`,
      params.meta ?? ''
    );
  }

  error(params: LoggerParams) {
    if (!this.shouldLog('error')) return;
    if (params.error instanceof HttpError) {
      console.error(
        `[${this.formatTimestamp()}] [${params.error.getCode()}] ${params.error.message}`,
        {
          stack: params.error.stack,
          meta: params.meta,
        }
      );
    } else {
      console.error(
        `[${this.formatTimestamp()}] [ERROR] ${params.message}`,
        params.meta ?? ''
      );
    }
  }
}
