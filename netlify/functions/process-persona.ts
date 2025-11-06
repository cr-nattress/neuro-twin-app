/**
 * Process Persona Function
 * Processes raw text blocks and links into a structured persona using OpenAI
 *
 * POST /.netlify/functions/process-persona
 *
 * Request body:
 * {
 *   "textBlocks": ["text 1", "text 2"],
 *   "links": ["https://...", "https://..."]
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "persona": { ...structured persona object... }
 * }
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

interface ProcessPersonaResponse {
  success: boolean;
  persona?: any;
  error?: string;
}

/**
 * Handle process-persona requests
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
