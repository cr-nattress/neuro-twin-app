/**
 * Structured Logger
 * Provides consistent logging across all Netlify Functions
 */

import { getEnv } from "./env";

export type LogLevel = "debug" | "info" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    try {
      const env = getEnv();
      this.logLevel = (env.LOG_LEVEL || "info") as LogLevel;
    } catch {
      this.logLevel = "info";
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      error: 2,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    const baseLog = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (context && Object.keys(context).length > 0) {
      return `${baseLog} ${JSON.stringify(context)}`;
    }

    if (error) {
      return `${baseLog} Error: ${error.message}${error.stack ? `\n${error.stack}` : ""}`;
    }

    return baseLog;
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.shouldLog("debug")) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "debug",
        message,
        context,
      };
      console.log(this.formatLog(entry));
    }
  }

  info(message: string, context?: Record<string, any>) {
    if (this.shouldLog("info")) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "info",
        message,
        context,
      };
      console.log(this.formatLog(entry));
    }
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error && typeof error === "object" && "message" in error ? {
        message: String((error as any).message),
      } : {
        message: String(error),
      },
    };
    console.error(this.formatLog(entry));
  }
}

// Export singleton
export const logger = new Logger();
