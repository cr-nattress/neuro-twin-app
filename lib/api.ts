/**
 * @module lib/api
 *
 * API utilities for handling base URL resolution in development vs. production.
 *
 * @context
 * - Used by services to call Netlify Functions
 * - Handles port resolution for local development (Next.js on 3000, Netlify Dev on 8889)
 * - Uses relative URLs in production for same-origin requests
 *
 * @dependencies
 * - window.location (browser API): Used to detect environment
 *
 * @exports
 * - getApiBaseUrl: Returns correct base URL for current environment
 * - apiCall: Wrapper around fetch with automatic base URL resolution
 *
 * @decision Separates UI dev server (3000+) from Netlify Dev (8889) to allow
 * hot module reloading in Next.js while testing real Netlify Functions locally.
 */

/**
 * Gets the base URL for API calls based on current environment.
 *
 * @returns {string} Base URL for API calls (empty string in production)
 *
 * @decision
 * - Development (localhost:3000-3999): Returns "http://localhost:8889" to route to Netlify Dev
 * - Development (localhost:8889): Returns "" (already on correct port)
 * - Production: Returns "" (same-origin, uses relative URLs)
 *
 * @example
 * ```typescript
 * const baseUrl = getApiBaseUrl();
 * fetch(`${baseUrl}/.netlify/functions/process-persona`, { ... });
 * ```
 */
export function getApiBaseUrl(): string {
  // Check if we're in development by looking for localhost
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    // In development, Netlify Dev serves both the framework and functions
    // If we're on the UI port (3000-3999), redirect to the Netlify Dev port (8889)
    const currentPort = window.location.port;
    if (currentPort && parseInt(currentPort) >= 3000 && parseInt(currentPort) <= 3999) {
      // This is the Next.js dev server, API calls must go to Netlify Dev on 8889
      return "http://localhost:8889";
    }
  }

  // In production or when already on Netlify Dev port, use relative URLs
  return "";
}

/**
 * Makes a fetch request with automatic base URL handling.
 *
 * @param {string} endpoint - API endpoint path (e.g., "/.netlify/functions/process-persona")
 * @param {RequestInit} [options={}] - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} Fetch Response object
 *
 * @sideeffects Makes network request
 *
 * @example
 * ```typescript
 * const response = await apiCall("/.netlify/functions/process-persona", {
 *   method: "POST",
 *   body: JSON.stringify({ textBlocks: [...] }),
 *   headers: { "Content-Type": "application/json" }
 * });
 * ```
 */
export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  return fetch(url, options);
}
