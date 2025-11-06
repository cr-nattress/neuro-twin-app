/**
 * @module netlify/functions/lib/env
 *
 * Environment variable validation for Netlify Functions.
 *
 * @context
 * - Used by all Netlify Functions to ensure required configuration is present at runtime
 * - Provides type-safe access to environment variables
 * - Fails fast on missing configuration to prevent silent errors
 *
 * @dependencies
 * - process.env (Node.js runtime)
 *
 * @exports
 * - EnvironmentConfig: Type definition for validated environment configuration
 * - validateEnv: Validates and returns environment configuration
 * - getEnv: Cached accessor for environment configuration
 */

/**
 * Type-safe environment configuration object.
 *
 * @interface EnvironmentConfig
 * @property {string} OPENAI_API_KEY - API key for OpenAI GPT models (persona extraction)
 * @property {string} SUPABASE_URL - Supabase project URL for blob storage
 * @property {string} SUPABASE_SERVICE_ROLE_KEY - Service role key with admin access (bypasses RLS)
 * @property {"development" | "production"} NODE_ENV - Runtime environment
 * @property {"debug" | "info" | "error"} [LOG_LEVEL] - Optional logging level filter
 */
export interface EnvironmentConfig {
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NODE_ENV: "development" | "production";
  LOG_LEVEL?: "debug" | "info" | "error";
}

/**
 * Validates that all required environment variables are present.
 *
 * @returns {EnvironmentConfig} Validated environment configuration
 * @throws {Error} If any required environment variables are missing
 *
 * @decision Fails immediately rather than defaulting to empty strings to prevent
 * cryptic runtime errors from missing configuration
 */
export function validateEnv(): EnvironmentConfig {
  const required = ["OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      `Please add these to your .env.local file or Netlify environment variables.`
    );
  }

  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    NODE_ENV: (process.env.NODE_ENV as "development" | "production") || "development",
    LOG_LEVEL: (process.env.LOG_LEVEL as "debug" | "info" | "error") || "info",
  };
}

/**
 * Singleton cache for environment configuration.
 * Prevents re-validation on every function invocation.
 */
let cachedConfig: EnvironmentConfig | null = null;

/**
 * Gets the validated environment configuration (cached after first call).
 *
 * @returns {EnvironmentConfig} Validated environment configuration
 * @throws {Error} If any required environment variables are missing (only on first call)
 *
 * @decision Caches configuration to avoid re-parsing process.env on every function invocation,
 * since environment variables don't change during the Lambda container's lifetime
 *
 * @example
 * ```typescript
 * const env = getEnv();
 * const openaiKey = env.OPENAI_API_KEY;
 * ```
 */
export function getEnv(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv();
  }
  return cachedConfig;
}
