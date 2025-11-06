/**
 * Environment Variable Validation
 * Ensures all required env vars are present at startup
 */

export interface EnvironmentConfig {
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NODE_ENV: "development" | "production";
  LOG_LEVEL?: "debug" | "info" | "error";
}

/**
 * Validate all required environment variables
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
 * Get environment config (with caching)
 */
let cachedConfig: EnvironmentConfig | null = null;

export function getEnv(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv();
  }
  return cachedConfig;
}
