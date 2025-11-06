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
import { validatePersonaId } from "./lib/validation";
import { logger } from "./lib/logger";
import { NotFoundError, ValidationError } from "./lib/errors";

interface GetPersonaResponse {
  success: boolean;
  persona?: any;
  error?: string;
}

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

  // Get persona ID from query params
  const personaId = getQueryParam(request, "persona_id");
  if (!personaId) {
    logger.error("Persona ID not provided");
    throw new ValidationError("Persona ID is required (query parameter: persona_id)");
  }

  // Validate persona ID format
  if (!validatePersonaId(personaId)) {
    logger.error("Invalid persona ID format", { personaId });
    throw new ValidationError(`Invalid persona ID format: ${personaId}`);
  }

  logger.info("Retrieving persona from storage", { personaId });

  // Retrieve from Supabase
  const persona = await getPersonaFromStorage(personaId);

  logger.info("Persona retrieved successfully", {
    personaId,
    name: persona.name,
  });

  const response: GetPersonaResponse = {
    success: true,
    persona,
  };

  return jsonResponse(response, 200);
}

/**
 * Export handler
 */
export const handler: Handler = createHandler(handleGetPersona);
