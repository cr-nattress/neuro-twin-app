/**
 * Error Handling & Custom Error Classes
 * Standardized error responses for all functions
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "OPENAI_ERROR"
  | "SUPABASE_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "SERVER_ERROR"
  | "BAD_REQUEST"
  | "RATE_LIMIT";

export interface ErrorResponse {
  success: false;
  error: string;
  code?: ErrorCode;
  statusCode: number;
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: ErrorCode = "SERVER_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }

  toResponse(): ErrorResponse {
    return {
      success: false,
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class OpenAIError extends AppError {
  constructor(message: string, statusCode = 500) {
    super(message, statusCode, "OPENAI_ERROR");
    this.name = "OpenAIError";
  }
}

export class SupabaseError extends AppError {
  constructor(message: string, statusCode = 500) {
    super(message, statusCode, "SUPABASE_ERROR");
    this.name = "SupabaseError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super(message, 429, "RATE_LIMIT");
    this.name = "RateLimitError";
  }
}

/**
 * Safely parse error messages from various sources
 */
export function parseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as any).message);
  }
  return "An unexpected error occurred";
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: unknown, defaultCode: ErrorCode = "SERVER_ERROR"): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const message = parseError(error);

  // Check for specific error patterns
  if (message.includes("401") || message.includes("unauthorized")) {
    return new UnauthorizedError(message);
  }
  if (message.includes("404") || message.includes("not found")) {
    return new NotFoundError(message);
  }
  if (message.includes("429") || message.includes("rate limit")) {
    return new RateLimitError(message);
  }
  if (message.includes("OPENAI") || message.includes("OpenAI")) {
    return new OpenAIError(message);
  }
  if (message.includes("SUPABASE") || message.includes("Supabase")) {
    return new SupabaseError(message);
  }

  return new AppError(message, 500, defaultCode);
}
