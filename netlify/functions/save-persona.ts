/**
 * @module netlify/functions/save-persona
 *
 * Netlify Function endpoint that saves a structured persona to Supabase blob storage.
 *
 * @context
 * - Called by frontend after user reviews and approves extracted persona
 * - Generates unique persona ID and uploads JSON to Supabase
 * - Returns persona_id for referencing in chat and retrieval operations
 *
 * @endpoint POST /.netlify/functions/save-persona
 *
 * @dependencies
 * - ./lib/base-handler: Request/response utilities
 * - ./lib/supabase: Persona storage operations
 * - ./lib/validation: Input validation schemas
 * - ./lib/logger: Structured logging
 *
 * @sideeffects
 * - Uploads persona JSON blob to Supabase Storage
 * - Generates unique persona ID (persona_[nanoid])
 * - Logs save operation
 *
 * @example Request
 * ```json
 * {
 *   "persona": {
 *     "name": "John Doe",
 *     "occupation": "Software Engineer",
 *     "traits": ["analytical", "detail-oriented"],
 *     "metadata": {"created_at": "2024-01-01T00:00:00Z"}
 *   }
 * }
 * ```
 *
 * @example Response (success)
 * ```json
 * {
 *   "success": true,
 *   "persona_id": "persona_abc123def456gh",
 *   "storage_path": "persona_abc123def456gh.json"
 * }
 * ```
 */

import { Handler } from "@netlify/functions";
import {
  createHandler,
  parseJsonBody,
  jsonResponse,
} from "./lib/base-handler";
import { generatePersonaId, savePersonaToStorage } from "./lib/supabase";
import {
  validateInput,
  SavePersonaPayloadSchema,
  SavePersonaResponseSchema,
  SavePersonaResponse,
} from "./lib/validation";
import { logger } from "./lib/logger";

/**
 * Handles persona save requests.
 *
 * @param {Request} request - Web API Request object
 * @returns {Promise<Response>} JSON response with persona_id or error
 * @throws {ValidationError} If input validation fails (caught by createHandler)
 * @throws {SupabaseError} If storage upload fails (caught by createHandler)
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

  // Validate response matches schema
  const validatedResponse = SavePersonaResponseSchema.parse(response);
  logger.debug("Response validated against SavePersonaResponseSchema");

  return jsonResponse(validatedResponse, 200);
}

/**
 * Export handler
 */
export const handler: Handler = createHandler(handleSavePersona);
