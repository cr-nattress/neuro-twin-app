/**
 * List Personas Function
 * Lists all personas from Supabase blob storage with pagination
 *
 * GET /.netlify/functions/list-personas?limit=20&offset=0
 *
 * Response:
 * {
 *   "success": true,
 *   "personas": [
 *     { "id": "persona_...", "name": "...", "created_at": "..." },
 *     ...
 *   ],
 *   "total": 42
 * }
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
 * Handle list-personas requests
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
