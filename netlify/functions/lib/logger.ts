/**
 * @module netlify/functions/lib/logger
 *
 * Structured logging utility for Netlify Functions with configurable log levels.
 *
 * @context
 * - Used by all Netlify Functions for consistent, filterable logging
 * - Outputs structured JSON logs that can be parsed by log aggregation tools
 * - Respects LOG_LEVEL environment variable (debug, info, error)
 *
 * @dependencies
 * - ./env (getEnv): Reads LOG_LEVEL configuration
 *
 * @exports
 * - LogLevel: Type for log level values
 * - logger: Singleton Logger instance for application-wide logging
 *
 * @pattern Singleton - Single shared logger instance across all functions
 */

import { getEnv } from "./env";

/**
 * Available log severity levels.
 * @typedef {"debug" | "info" | "error"} LogLevel
 */
export type LogLevel = "debug" | "info" | "error";

/**
 * Structured log entry format.
 *
 * @interface LogEntry
 * @property {string} timestamp - ISO 8601 timestamp of the log event
 * @property {LogLevel} level - Severity level of the log
 * @property {string} message - Human-readable log message
 * @property {Record<string, any>} [context] - Optional structured metadata
 * @property {object} [error] - Optional error details
 * @property {string} error.message - Error message
 * @property {string} [error.stack] - Optional stack trace
 */
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

/**
 * Structured logger with configurable log levels.
 *
 * @class Logger
 * @pattern Singleton - Only one instance created and exported
 *
 * @assumes Environment variables are validated before logger is instantiated
 *
 * @sideeffects
 * - Writes to console.log (info/debug)
 * - Writes to console.error (error level)
 */
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

  /**
   * Determines if a log at the given level should be output.
   *
   * @param {LogLevel} level - Log level to check
   * @returns {boolean} True if log should be output based on configured threshold
   *
   * @decision Uses numeric comparison (debug=0, info=1, error=2) for efficient filtering
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      error: 2,
    };
    return levels[level] >= levels[this.logLevel];
  }

  /**
   * Formats a structured log entry as a human-readable string.
   *
   * @param {LogEntry} entry - Log entry to format
   * @returns {string} Formatted log string with timestamp, level, message, and optional context
   */
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

  /**
   * Logs a debug-level message with optional context.
   *
   * @param {string} message - Human-readable log message
   * @param {Record<string, any>} [context] - Optional structured metadata
   *
   * @sideeffects Writes to console.log if LOG_LEVEL is "debug"
   *
   * @example
   * ```typescript
   * logger.debug("Processing request", { userId: "123", endpoint: "/chat" });
   * ```
   */
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

  /**
   * Logs an info-level message with optional context.
   *
   * @param {string} message - Human-readable log message
   * @param {Record<string, any>} [context] - Optional structured metadata
   *
   * @sideeffects Writes to console.log if LOG_LEVEL is "debug" or "info"
   *
   * @example
   * ```typescript
   * logger.info("Persona saved", { personaId: "persona_abc123", size: 2048 });
   * ```
   */
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

  /**
   * Logs an error-level message with optional error object and context.
   *
   * @param {string} message - Human-readable error description
   * @param {Error | unknown} [error] - Optional error object (extracts message and stack)
   * @param {Record<string, any>} [context] - Optional structured metadata
   *
   * @sideeffects Always writes to console.error (not filtered by LOG_LEVEL)
   *
   * @example
   * ```typescript
   * logger.error("Failed to save persona", error, { personaId: "persona_abc123" });
   * ```
   */
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

/**
 * Singleton logger instance for application-wide logging.
 *
 * @example
 * ```typescript
 * import { logger } from "./logger";
 * logger.info("Operation completed", { duration: 150 });
 * ```
 */
export const logger = new Logger();
