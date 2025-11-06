/**
 * @module netlify/functions/list-personas
 *
 * Netlify Function endpoint that lists all saved personas with pagination.
 *
 * @context
 * - Called by frontend to display persona library or history
 * - Returns file metadata only (not full persona objects) for performance
 * - Supports limit/offset pagination for browsing large collections
 *
 * @endpoint GET /.netlify/functions/list-personas?limit=20&offset=0
 *
 * @dependencies
 * - ./lib/base-handler: Request/response utilities
 * - ./lib/supabase: Persona storage listing
 * - ./lib/validation: Pagination parameter validation
 * - ./lib/logger: Structured logging
 *
 * @sideeffects
 * - Lists files in Supabase Storage bucket
 * - Logs list operation
 *
 * @example Request
 * ```
 * GET /.netlify/functions/list-personas?limit=20&offset=0
 * ```
 *
 * @example Response (success)
 * ```json
 * {
 *   "success": true,
 *   "personas": [
 *     {
 *       "id": "persona_abc123def456gh",
 *       "name": "persona_abc123def456gh",
 *       "created_at": "2024-01-01T00:00:00Z"
 *     }
 *   ],
 *   "total": 1
 * }
 * ```
 */

import { Handler } from "@netlify/functions";
import {
  createHandler,
  jsonResponse,
  getQueryParams,
} from "./lib/base-handler";
import { listPersonasFromStorage } from "./lib/supabase";
import { validateInput, PaginationSchema } from "./lib/validation";
import { logger } from "./lib/logger";

interface ListPersonasResponse {
  success: boolean;
  personas?: Array<{ id: string; name: string; created_at: string }>;
  total?: number;
  error?: string;
}

/**
 * Handles persona list requests with pagination.
 *
 * @param {Request} request - Web API Request object with optional limit/offset query parameters
 * @returns {Promise<Response>} JSON response with personas array and total count
 * @throws {ValidationError} If pagination parameters are invalid (caught by createHandler)
 * @throws {SupabaseError} If storage list operation fails (caught by createHandler)
 */
async function handleListPersonas(request: Request): Promise<Response> {
  logger.info("list-personas function called");

  // Get pagination params from query
  const params = getQueryParams(request);
  logger.debug("Query parameters received", params);

  // Validate pagination
  const pagination = validateInput(PaginationSchema, params);
  logger.info("Pagination parameters validated", pagination);

  // List from Supabase
  const result = await listPersonasFromStorage(pagination.limit, pagination.offset);

  logger.info("Personas listed successfully", {
    count: result.personas.length,
    total: result.total,
  });

  const response: ListPersonasResponse = {
    success: true,
    personas: result.personas,
    total: result.total,
  };

  return jsonResponse(response, 200);
}

/**
 * Export handler
 */
export const handler: Handler = createHandler(handleListPersonas);
