/**
 * @module lib/api-logger
 *
 * Structured logging utilities for API requests and responses.
 *
 * @context
 * - Used by all service implementations (apiPersonaService, apiAuthService)
 * - Used by React hooks when making API calls
 * - Provides detailed request/response tracking for debugging 502 errors
 *
 * @dependencies
 * - console (browser APIs)
 * - Date (for timing)
 *
 * @exports
 * - ApiLogger: Class for structured API logging
 * - createApiLogger: Factory function to create logger instances
 */

export interface ApiLogContext {
  functionName: string;
  endpoint: string;
  method: string;
  startTime: number;
  requestId: string;
}

export interface ApiLogRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  timestamp: string;
}

export interface ApiLogResponse {
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  body?: unknown;
  duration: number;
  timestamp: string;
}

export interface ApiLogError {
  message: string;
  code?: string;
  status?: number;
  stack?: string;
  duration: number;
  timestamp: string;
}

/**
 * Structured API logger for tracking requests, responses, and errors.
 *
 * @class ApiLogger
 * @purpose Provides detailed logging of API interactions for debugging
 * @pattern Singleton per function name
 *
 * @example
 * ```typescript
 * const logger = createApiLogger('processPersona', '/.netlify/functions/process-persona');
 * logger.logRequest({ url, method, body });
 * logger.logResponse(response);
 * logger.logError(error);
 * ```
 */
export class ApiLogger {
  private functionName: string;
  private endpoint: string;
  private requestId: string;
  private startTime: number = 0;

  constructor(functionName: string, endpoint: string) {
    this.functionName = functionName;
    this.endpoint = endpoint;
    // Generate unique request ID for tracking across logs
    this.requestId = `${functionName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log the start of an API request.
   *
   * @param {ApiLogRequest} request - Request details
   * @sideeffects Logs to console, resets start time
   *
   * @decision Log at INFO level for all requests (even 500s are logged here)
   */
  public logRequest(request: ApiLogRequest): void {
    this.startTime = Date.now();

    const logData = {
      level: "INFO",
      requestId: this.requestId,
      function: this.functionName,
      endpoint: this.endpoint,
      type: "API_REQUEST",
      request: {
        url: request.url,
        method: request.method,
        headers: this.sanitizeHeaders(request.headers || {}),
        body: this.sanitizeBody(request.body),
        timestamp: request.timestamp,
      },
    };

    console.log(`[${this.functionName}] API Request`, logData);
    console.debug(
      `[${this.functionName}] Full request body:`,
      JSON.stringify(request.body, null, 2)
    );
  }

  /**
   * Log a successful API response.
   *
   * @param {ApiLogResponse} response - Response details
   * @sideeffects Logs to console
   *
   * @decision Log response time, status, and first 500 chars of body
   * for debugging 502s and timeouts
   */
  public logResponse(response: ApiLogResponse): void {
    const duration = Date.now() - this.startTime;

    // Warn if response is slow (>3 seconds)
    const isSlowResponse = duration > 3000;
    const logLevel = isSlowResponse ? "WARN" : "INFO";

    const logData = {
      level: logLevel,
      requestId: this.requestId,
      function: this.functionName,
      endpoint: this.endpoint,
      type: "API_RESPONSE",
      response: {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        bodyPreview: this.previewBody(response.body),
        timestamp: response.timestamp,
      },
    };

    console.log(`[${this.functionName}] API Response (${duration}ms)`, logData);

    // Log full response body for debugging
    if (response.body) {
      console.debug(`[${this.functionName}] Full response body:`, response.body);
    }

    // Special warning for slow responses
    if (isSlowResponse) {
      console.warn(
        `[${this.functionName}] ⚠️ Slow response detected: ${duration}ms (>3s threshold)`
      );
    }
  }

  /**
   * Log an API error (network, 502, timeout, etc).
   *
   * @param {unknown} error - Error object (Error, Response, or custom)
   * @sideeffects Logs to console at ERROR level, includes stack trace
   *
   * @decision Always log full error with stack trace for troubleshooting
   */
  public logError(error: unknown): void {
    const duration = Date.now() - this.startTime;
    let errorMessage = "Unknown error";
    let errorCode: string | undefined;
    let status: number | undefined;
    let stack: string | undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      stack = error.stack;
    } else if (error instanceof Response) {
      errorMessage = `HTTP ${error.status} ${error.statusText}`;
      status = error.status;
      errorCode = `HTTP_${error.status}`;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      errorMessage = JSON.stringify(error);
    }

    const logData = {
      level: "ERROR",
      requestId: this.requestId,
      function: this.functionName,
      endpoint: this.endpoint,
      type: "API_ERROR",
      error: {
        message: errorMessage,
        code: errorCode,
        status: status,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      stack: stack,
    };

    console.error(`[${this.functionName}] API Error`, logData);
    if (stack) {
      console.error(`[${this.functionName}] Stack trace:`, stack);
    }

    // Special handling for 502 errors
    if (status === 502) {
      console.error(
        `[${this.functionName}] 🔴 502 BAD GATEWAY - Netlify function may have crashed`
      );
      console.error(`[${this.functionName}] Check Netlify function logs for details`);
      console.error(`[${this.functionName}] Request ID for logs: ${this.requestId}`);
    }

    // Special handling for timeout-like errors
    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("timed out") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      console.error(
        `[${this.functionName}] ⏱️ Connection/timeout error - check function availability`
      );
    }
  }

  /**
   * Log intermediate step or state during API operation.
   *
   * @param {string} step - Description of the step
   * @param {unknown} data - Associated data
   * @sideeffects Logs to console at DEBUG level
   */
  public logStep(step: string, data?: unknown): void {
    const logData = {
      level: "DEBUG",
      requestId: this.requestId,
      function: this.functionName,
      type: "API_STEP",
      step: step,
      data: data,
    };

    console.debug(`[${this.functionName}] ${step}`, logData);
  }

  /**
   * Get request ID for this logger instance.
   *
   * @returns {string} Unique request ID
   *
   * @example
   * ```typescript
   * logger.logError(error);
   * console.log(`Check logs with request ID: ${logger.getRequestId()}`);
   * ```
   */
  public getRequestId(): string {
    return this.requestId;
  }

  /**
   * Sanitize sensitive headers before logging.
   *
   * @param {Record<string, string>} headers - Original headers
   * @returns {Record<string, string>} Sanitized headers
   *
   * @decision Redact Authorization, X-API-Key, and similar sensitive headers
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveKeys = [
      "authorization",
      "x-api-key",
      "cookie",
      "x-auth-token",
      "x-access-token",
    ];

    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request body (remove sensitive fields).
   *
   * @param {unknown} body - Original body
   * @returns {unknown} Sanitized body
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body) return undefined;

    if (typeof body === "string") {
      // For string bodies, try to sanitize if JSON
      try {
        const parsed = JSON.parse(body);
        return this.sanitizeObject(parsed);
      } catch {
        return "[Cannot parse body]";
      }
    }

    return this.sanitizeObject(body);
  }

  /**
   * Recursively sanitize object fields.
   *
   * @param {unknown} obj - Object to sanitize
   * @returns {unknown} Sanitized object
   */
  private sanitizeObject(obj: unknown): unknown {
    const sensitiveFields = ["password", "token", "secret", "api_key", "apiKey"];

    if (!obj || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object") {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Create a preview of response body for logs (first 500 chars).
   *
   * @param {unknown} body - Response body
   * @returns {string} Preview string
   */
  private previewBody(body: unknown): string {
    if (!body) return "[empty]";

    let preview: string;

    if (typeof body === "string") {
      preview = body;
    } else if (typeof body === "object") {
      preview = JSON.stringify(body);
    } else {
      preview = String(body);
    }

    return preview.length > 500 ? preview.substring(0, 500) + "..." : preview;
  }
}

/**
 * Factory function to create API logger instances.
 *
 * @param {string} functionName - Name of the function calling the API
 * @param {string} endpoint - API endpoint path
 * @returns {ApiLogger} Configured logger instance
 *
 * @example
 * ```typescript
 * const logger = createApiLogger('processPersona', '/.netlify/functions/process-persona');
 * ```
 */
export function createApiLogger(functionName: string, endpoint: string): ApiLogger {
  return new ApiLogger(functionName, endpoint);
}
