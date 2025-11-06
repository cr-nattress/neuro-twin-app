/**
 * @module netlify/functions/lib/base-handler
 *
 * Base handler wrapper for all Netlify Functions with unified error handling, CORS, and logging.
 *
 * @context
 * - All Netlify Function endpoints use createHandler() wrapper
 * - Converts Netlify HandlerEvent to standard Web API Request for consistency
 * - Automatically handles CORS preflight (OPTIONS requests)
 * - Catches and formats all errors into consistent JSON responses
 *
 * @dependencies
 * - @netlify/functions (Handler, HandlerEvent)
 * - ./errors (AppError, toAppError): Error handling utilities
 * - ./logger (logger): Structured logging
 *
 * @exports
 * - HandlerContext: Metadata about function invocation
 * - createHandler: Wraps handler functions with error handling and CORS
 * - jsonResponse: Helper to create JSON responses
 * - errorResponse: Helper to create error responses
 * - handleOptions: CORS preflight handler
 * - parseJsonBody: Parse request body as JSON
 * - getQueryParam: Extract single query parameter
 * - getQueryParams: Extract all query parameters
 *
 * @pattern Adapter - Converts Netlify-specific types to Web API standards
 * @pattern Template Method - Provides common request/response handling flow
 */

import { Handler, HandlerEvent, HandlerContext as NetlifyHandlerContext } from "@netlify/functions";
import { AppError, toAppError } from "./errors";
import { logger } from "./logger";

/**
 * Metadata about the current function invocation.
 *
 * @interface HandlerContext
 * @property {string} functionName - Name of the Netlify Function being executed
 * @property {number} startTime - Timestamp when the request started (milliseconds)
 */
export interface HandlerContext {
  functionName: string;
  startTime: number;
}

/**
 * Converts a Netlify HandlerEvent to a standard Web API Request object.
 *
 * @param {HandlerEvent} event - Netlify function event object
 * @returns {Request} Web API Request object
 *
 * @decision Uses Web API Request for consistency with modern frameworks and better
 * type safety compared to Netlify's event structure
 */
function eventToRequest(event: HandlerEvent): Request {
  const method = event.httpMethod || "GET";
  const path = event.path || "/";
  const queryString = event.rawQuery ? `?${event.rawQuery}` : "";
  const url = new URL(`https://example.com${path}${queryString}`);

  const headerObject: Record<string, string> = {};
  if (event.headers) {
    for (const [key, value] of Object.entries(event.headers)) {
      if (typeof value === "string") {
        headerObject[key] = value;
      }
    }
  }

  const headers = new Headers(headerObject);

  return new Request(url.toString(), {
    method,
    headers,
    body: event.body ? event.body : undefined,
  });
}

/**
 * Returns standard CORS headers for all responses.
 *
 * @returns {Record<string, string>} CORS headers allowing all origins
 *
 * @decision Allows all origins (*) for public API access. In production,
 * consider restricting to specific domains via allowlist
 */
function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

/**
 * Handles CORS preflight OPTIONS requests.
 *
 * @returns {Response} 204 No Content response with CORS headers
 *
 * @example
 * ```typescript
 * if (request.method === "OPTIONS") {
 *   return handleOptions();
 * }
 * ```
 */
export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

/**
 * Creates a JSON response with CORS headers.
 *
 * @param {any} data - Response data (will be JSON.stringify'd)
 * @param {number} [statusCode=200] - HTTP status code
 * @param {Record<string, string>} [headers] - Optional additional headers
 * @returns {Response} Web API Response object
 *
 * @example
 * ```typescript
 * return jsonResponse({ success: true, persona: data }, 200);
 * ```
 */
export function jsonResponse(data: any, statusCode = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      ...getCorsHeaders(),
      ...headers,
    },
  });
}

/**
 * Creates an error response from an AppError.
 *
 * @param {AppError} error - Application error with statusCode and message
 * @returns {Response} JSON error response with appropriate status code
 *
 * @example
 * ```typescript
 * catch (error) {
 *   const appError = toAppError(error);
 *   return errorResponse(appError);
 * }
 * ```
 */
export function errorResponse(error: AppError) {
  return jsonResponse(error.toResponse(), error.statusCode);
}

/**
 * Converts a Web API Response back to Netlify's expected format.
 *
 * @param {Response} response - Web API Response object
 * @returns {Promise<HandlerResponse>} Netlify-compatible response object
 */
async function responseToHandlerResponse(response: Response) {
  const body = await response.text();
  const headers: Record<string, string> = {};

  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    statusCode: response.status,
    body,
    headers,
  };
}

/**
 * Wraps a handler function with error handling, CORS, and logging.
 *
 * @param {Function} handlerFn - Handler function that takes Request and returns Response
 * @returns {Handler} Netlify Function handler with error handling and logging
 *
 * @sideeffects
 * - Logs all requests (method, path, function name)
 * - Logs all responses (status, duration)
 * - Logs all errors with stack traces
 *
 * @decision Wraps all functions for consistency rather than requiring manual
 * error handling in each endpoint
 *
 * @example
 * ```typescript
 * export const handler = createHandler(async (request) => {
 *   const data = await someOperation();
 *   return jsonResponse({ success: true, data });
 * });
 * ```
 */
export function createHandler(
  handlerFn: (
    request: Request,
    context?: any
  ) => Promise<Response> | Response
): Handler {
  return async (event, context) => {
    // Convert Netlify HandlerEvent to Request
    const request = eventToRequest(event);

    const functionName = context?.functionName || "unknown";
    const startTime = Date.now();

    // Log request
    logger.info(`${request.method} ${new URL(request.url).pathname}`, {
      function: functionName,
      method: request.method,
    });

    try {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        const response = handleOptions();
        return responseToHandlerResponse(response);
      }

      // Call handler function
      const response = await handlerFn(request, context);

      // Log response
      const duration = Date.now() - startTime;
      logger.debug(`Handler completed successfully`, {
        function: functionName,
        status: response.status,
        duration: `${duration}ms`,
      });

      return responseToHandlerResponse(response);
    } catch (error: unknown) {
      // Convert to AppError
      const appError = toAppError(error);

      // Log error
      const duration = Date.now() - startTime;
      logger.error(`Handler error: ${appError.message}`, appError, {
        function: functionName,
        status: appError.statusCode,
        duration: `${duration}ms`,
      });

      // Return error response
      const response = errorResponse(appError);
      return responseToHandlerResponse(response);
    }
  };
}

/**
 * Parses the request body as JSON.
 *
 * @param {Request} request - Web API Request object
 * @returns {Promise<any>} Parsed JSON object (or empty object if no body)
 * @throws {AppError} If body contains invalid JSON (400 BAD_REQUEST)
 *
 * @example
 * ```typescript
 * const body = await parseJsonBody(request);
 * const { persona } = body;
 * ```
 */
export async function parseJsonBody(request: Request): Promise<any> {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    throw new AppError("Invalid JSON in request body", 400, "BAD_REQUEST");
  }
}

/**
 * Extracts a single query parameter from the request URL.
 *
 * @param {Request} request - Web API Request object
 * @param {string} paramName - Name of the query parameter
 * @returns {string | null} Parameter value or null if not present
 *
 * @example
 * ```typescript
 * const personaId = getQueryParam(request, "persona_id");
 * ```
 */
export function getQueryParam(request: Request, paramName: string): string | null {
  const url = new URL(request.url);
  return url.searchParams.get(paramName);
}

/**
 * Extracts all query parameters from the request URL.
 *
 * @param {Request} request - Web API Request object
 * @returns {Record<string, string>} Object mapping parameter names to values
 *
 * @example
 * ```typescript
 * const params = getQueryParams(request);
 * const { limit, offset } = params;
 * ```
 */
export function getQueryParams(request: Request): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
