/**
 * @module netlify/functions/get-persona
 *
 * Netlify Function endpoint that retrieves a saved persona from Supabase blob storage.
 *
 * @context
 * - Called by frontend when loading a previously saved persona for chat or review
 * - Validates persona ID format, retrieves JSON from storage, returns structured data
 * - Used by chat function to load persona context for responses
 *
 * @endpoint GET /.netlify/functions/get-persona?persona_id=persona_abc123...
 *
 * @dependencies
 * - ./lib/base-handler: Request/response utilities
 * - ./lib/supabase: Persona storage retrieval
 * - ./lib/validation: Persona ID format validation
 * - ./lib/errors: Custom error classes
 * - ./lib/logger: Structured logging
 *
 * @sideeffects
 * - Downloads persona JSON blob from Supabase Storage
 * - Logs retrieval operation
 *
 * @example Request
 * ```
 * GET /.netlify/functions/get-persona?persona_id=persona_abc123def456gh
 * ```
 *
 * @example Response (success)
 * ```json
 * {
 *   "success": true,
 *   "persona": {
 *     "name": "John Doe",
 *     "occupation": "Software Engineer",
 *     "traits": ["analytical", "detail-oriented"],
 *     "metadata": {"created_at": "2024-01-01T00:00:00Z"}
 *   }
 * }
 * ```
 *
 * @example Response (not found)
 * ```json
 * {
 *   "success": false,
 *   "error": "Persona not found: persona_abc123def456gh"
 * }
 * ```
 */

import { Handler } from "@netlify/functions";
import {
  createHandler,
  jsonResponse,
  getQueryParam,
} from "./lib/base-handler";
import { getPersonaFromStorage } from "./lib/supabase";
import {
  validateInput,
  GetPersonaQuerySchema,
  GetPersonaResponseSchema,
  GetPersonaResponse,
} from "./lib/validation";
import { logger } from "./lib/logger";
import { NotFoundError, ValidationError } from "./lib/errors";

/**
 * Handles persona retrieval requests.
 *
 * @param {Request} request - Web API Request object with persona_id query parameter
 * @returns {Promise<Response>} JSON response with persona object or error
 * @throws {ValidationError} If persona_id is missing or invalid format
 * @throws {NotFoundError} If persona doesn't exist in storage
 * @throws {SupabaseError} If storage download fails (caught by createHandler)
 */
async function handleGetPersona(request: Request): Promise<Response> {
  logger.info("get-persona function called");

  // Get persona ID from query params and validate
  const personaId = getQueryParam(request, "persona_id");
  const queryParams = { persona_id: personaId };

  // Validate query parameters using schema
  const validatedQuery = validateInput(GetPersonaQuerySchema, queryParams);
  logger.debug("Query parameters validated against GetPersonaQuerySchema");

  logger.info("Retrieving persona from storage", { personaId: validatedQuery.persona_id });

  // Retrieve from Supabase
  const persona = await getPersonaFromStorage(validatedQuery.persona_id);

  logger.info("Persona retrieved successfully", {
    personaId: validatedQuery.persona_id,
    name: persona.name,
  });

  const response: GetPersonaResponse = {
    success: true,
    persona,
  };

  // Validate response matches schema
  const validatedResponse = GetPersonaResponseSchema.parse(response);
  logger.debug("Response validated against GetPersonaResponseSchema");

  return jsonResponse(validatedResponse, 200);
}

/**
 * Export handler
 */
export const handler: Handler = createHandler(handleGetPersona);
