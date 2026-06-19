import { Injectable } from 'injection-js';

export abstract class AbstractLogger {
  abstract info(message: string, meta?: Record<string, unknown>): void;
  abstract error(message: string, meta?: Record<string, unknown>): void;
  abstract warn(message: string, meta?: Record<string, unknown>): void;
  abstract debug(message: string, meta?: Record<string, unknown>): void;
}

@Injectable()
export class Logger extends AbstractLogger {
  info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
  }
}
