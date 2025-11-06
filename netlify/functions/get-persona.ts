/**
 * Get Persona Function
 * Retrieves a persona from Supabase blob storage by ID
 *
 * GET /.netlify/functions/get-persona?persona_id=persona_abc123...
 *
 * Response:
 * {
 *   "success": true,
 *   "persona": { ...persona object... }
 * }
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
 * Handle get-persona requests
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
