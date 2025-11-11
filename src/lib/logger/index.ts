import { LogLevel } from '../db/types';
import { AuditLogger } from './audit-logger';
import { CompositeLogger } from './composite-logger';
import { ConsoleLogger } from './console-logger';

export const LOG_LEVEL_ORDER = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
} as const;

export interface LoggerParams {
  message: string;
  meta?: unknown;
  error?: Error;
}

export interface Logger {
  level: LogLevel;

  shouldLog(level: LogLevel): boolean;

  debug(params: LoggerParams): void;
  info(params: LoggerParams): void;
  warn(params: LoggerParams): void;
  error(params: LoggerParams): void;
}

export const logger = new CompositeLogger(
  [new ConsoleLogger({ level: 'debug' }), new AuditLogger({ level: 'debug' })],
  'debug'
);
