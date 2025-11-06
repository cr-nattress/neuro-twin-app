/**
 * @module netlify/functions/process-persona
 *
 * Netlify Function endpoint that processes raw text/links into structured persona using OpenAI.
 *
 * @context
 * - Called by frontend after user inputs text blocks and links
 * - Validates input, calls OpenAI GPT-3.5, adds metadata, returns structured persona
 * - Does not persist persona (that's save-persona's job)
 *
 * @endpoint POST /.netlify/functions/process-persona
 *
 * @dependencies
 * - ./lib/base-handler: Request/response utilities
 * - ./lib/openai: GPT persona extraction
 * - ./lib/validation: Input validation schemas
 * - ./lib/logger: Structured logging
 *
 * @sideeffects
 * - Makes OpenAI API call (costs tokens)
 * - Logs processing steps
 *
 * @example Request
 * ```json
 * {
 *   "textBlocks": ["John is a software engineer with 10 years experience..."],
 *   "links": ["https://linkedin.com/in/johndoe"]
 * }
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
 *     "metadata": { "created_at": "2024-01-01T00:00:00Z" },
 *     "raw_data": { "textBlocks": [...], "links": [...] }
 *   }
 * }
 * ```
 */

import { Handler } from "@netlify/functions";
import {
  createHandler,
  parseJsonBody,
  jsonResponse,
} from "./lib/base-handler";
import { extractPersona, validatePersonaStructure } from "./lib/openai";
import { validateInput, PersonaInputSchema } from "./lib/validation";
import { logger } from "./lib/logger";

/**
 * Response format for process-persona endpoint.
 *
 * @interface ProcessPersonaResponse
 * @property {boolean} success - Whether processing succeeded
 * @property {any} [persona] - Structured persona object (if success=true)
 * @property {string} [error] - Error message (if success=false)
 */
interface ProcessPersonaResponse {
  success: boolean;
  persona?: any;
  error?: string;
}

/**
 * Handles persona processing requests.
 *
 * @param {Request} request - Web API Request object
 * @returns {Promise<Response>} JSON response with structured persona or error
 * @throws {ValidationError} If input validation fails (caught by createHandler)
 * @throws {OpenAIError} If GPT extraction fails (caught by createHandler)
 */
async function handleProcessPersona(request: Request): Promise<Response> {
  logger.info("process-persona function called");

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
  logger.debug("Request body received", { hasTextBlocks: !!body.textBlocks, hasLinks: !!body.links });

  // Validate input
  const input = validateInput(PersonaInputSchema, body);
  logger.info("Input validated successfully", {
    textBlockCount: input.textBlocks.length,
    linkCount: input.links.length,
  });

  // Extract persona using OpenAI
  logger.info("Starting OpenAI persona extraction");
  const extractedPersona = await extractPersona(input);

  // Validate persona structure
  if (!validatePersonaStructure(extractedPersona)) {
    logger.error("Extracted persona failed validation");
    return jsonResponse(
      {
        success: false,
        error: "Failed to extract valid persona data",
      },
      400
    );
  }

  // Add metadata
  const persona = {
    ...extractedPersona,
    metadata: {
      created_at: new Date().toISOString(),
      source_text_blocks: input.textBlocks.length,
      source_links: input.links.length,
    },
    raw_data: {
      textBlocks: input.textBlocks,
      links: input.links,
    },
  };

  logger.info("Persona extracted and structured successfully", {
    name: persona.name,
    traits: persona.traits.length,
    interests: persona.interests.length,
  });

  const response: ProcessPersonaResponse = {
    success: true,
    persona,
  };

  return jsonResponse(response, 200);
}

/**
 * Export handler
 */
export const handler: Handler = createHandler(handleProcessPersona);
