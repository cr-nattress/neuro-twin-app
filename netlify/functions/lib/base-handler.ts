/**
 * Base Handler
 * Abstract base class for all Netlify Functions
 * Provides request/response handling, error catching, CORS, and logging
 */

import { Handler, HandlerEvent, HandlerContext as NetlifyHandlerContext } from "@netlify/functions";
import { AppError, toAppError } from "./errors";
import { logger } from "./logger";

export interface HandlerContext {
  functionName: string;
  startTime: number;
}

/**
 * Convert Netlify HandlerEvent to Web API Request
 */
function eventToRequest(event: HandlerEvent): Request {
  const method = event.httpMethod || "GET";
  const path = event.path || "/";
  const queryString = event.rawQuery ? `?${event.rawQuery}` : "";
  const url = new URL(`https://example.com${path}${queryString}`);

  const headers = new Headers(event.headers || {});

  return new Request(url.toString(), {
    method,
    headers,
    body: event.body ? event.body : undefined,
  });
}

/**
 * Response headers with CORS
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
 * Handle OPTIONS requests for CORS preflight
 */
export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

/**
 * Create JSON response
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
 * Create error response
 */
export function errorResponse(error: AppError) {
  return jsonResponse(error.toResponse(), error.statusCode);
}

/**
 * Convert Response to Netlify HandlerResponse format
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
 * Base handler wrapper
 * Catches errors, handles CORS, logs requests
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
 * Parse JSON request body
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
 * Get query parameter
 */
export function getQueryParam(request: Request, paramName: string): string | null {
  const url = new URL(request.url);
  return url.searchParams.get(paramName);
}

/**
 * Get multiple query parameters
 */
export function getQueryParams(request: Request): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
