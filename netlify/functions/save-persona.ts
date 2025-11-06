/**
 * Save Persona Function
 * Saves a persona to Supabase blob storage
 *
 * POST /.netlify/functions/save-persona
 *
 * Request body:
 * {
 *   "persona": { ...persona object... }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "persona_id": "persona_abc123...",
 *   "storage_path": "persona_abc123....json"
 * }
 */

import { Handler } from "@netlify/functions";
import {
  createHandler,
  parseJsonBody,
  jsonResponse,
} from "./lib/base-handler";
import { generatePersonaId, savePersonaToStorage } from "./lib/supabase";
import { validateInput, SavePersonaPayloadSchema } from "./lib/validation";
import { logger } from "./lib/logger";

interface SavePersonaResponse {
  success: boolean;
  persona_id?: string;
  storage_path?: string;
  error?: string;
}

/**
 * Handle save-persona requests
 */
async function handleSavePersona(request: Request): Promise<Response> {
  logger.info("save-persona function called");

  // Only accept POST requests
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    return jsonResponse(
      {
        success: false,
        error: "Method not allowed. Use POST.",
      },
      405
    );
  }

  // Parse request body
  const body = await parseJsonBody(request);
  logger.debug("Request body received", { hasPersona: !!body.persona });

  // Validate input
  const input = validateInput(SavePersonaPayloadSchema, body);
  logger.info("Input validated successfully");

  // Generate persona ID
  const personaId = generatePersonaId();
  logger.info("Persona ID generated", { personaId });

  // Save to Supabase
  logger.info("Saving persona to Supabase storage", { personaId });
  const { path: storagePath } = await savePersonaToStorage(personaId, input.persona);

  logger.info("Persona saved successfully", { personaId, storagePath });

  const response: SavePersonaResponse = {
    success: true,
    persona_id: personaId,
    storage_path: storagePath,
  };

  return jsonResponse(response, 200);
}

/**
 * Export handler
 */
export const handler: Handler = createHandler(handleSavePersona);
