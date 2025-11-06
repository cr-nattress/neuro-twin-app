/**
 * @module netlify/functions/lib/openai
 *
 * OpenAI GPT client for persona extraction from text and links.
 *
 * @context
 * - Used by process-persona function to analyze user input and generate structured personas
 * - Wraps OpenAI SDK with error handling specific to persona extraction use case
 * - Uses gpt-3.5-turbo with low temperature (0.3) for consistent, factual extraction
 *
 * @dependencies
 * - openai (OpenAI): Official OpenAI SDK
 * - ./env (getEnv): Environment configuration
 * - ./errors (OpenAIError): Custom error class for OpenAI failures
 * - ./logger (logger): Structured logging
 *
 * @exports
 * - PersonaExtractionInput: Input type (textBlocks, links)
 * - PersonaExtractionResult: Structured persona output from GPT
 * - extractPersona: Main function to extract persona from text/links
 * - validatePersonaStructure: Validates GPT output structure
 *
 * @pattern Singleton - Single shared OpenAI client instance
 * @sideeffects
 * - Network requests to OpenAI API (costs money per token)
 * - Logs all extraction requests and responses
 */

import { OpenAI } from "openai";
import { getEnv } from "./env";
import { OpenAIError } from "./errors";
import { logger } from "./logger";

/**
 * Singleton OpenAI client instance (lazy-initialized).
 */
let openaiClient: OpenAI | null = null;

/**
 * Gets or creates the OpenAI client instance.
 *
 * @returns {OpenAI} Configured OpenAI client
 * @sideeffects Creates OpenAI client on first call (reads OPENAI_API_KEY from env)
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const env = getEnv();
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * System prompt that instructs GPT on persona extraction task.
 *
 * @decision Uses structured instructions with specific field definitions to ensure
 * consistent JSON output format across all requests
 */
const PERSONA_SYSTEM_PROMPT = `You are an expert at analyzing text and links about a person to create a detailed digital persona.

Your task is to:
1. Extract key information about the person from the provided text blocks and links
2. Structure the information into a standardized persona format
3. Fill in the following fields based on available information:
   - name: Full name if available
   - age: Age or age range if mentioned
   - occupation: Primary job or role
   - background: Summary of relevant background
   - traits: List of personality traits (5-7 key traits)
   - interests: List of interests and hobbies (5-10 items)
   - skills: Professional or technical skills (5-10 items)
   - values: Core values and principles (3-5 items)
   - communication_style: How they typically communicate
   - personality_type: Any personality types if mentioned (MBTI, Big Five, etc.)
   - goals: Current or future goals if mentioned
   - challenges: Known challenges or concerns
   - relationships: Key relationships or professional connections

Return the response as valid JSON only, with no additional text or markdown.

If information is not available for a field, use null or an empty array as appropriate.`;

/**
 * Input payload for persona extraction.
 *
 * @interface PersonaExtractionInput
 * @property {string[]} textBlocks - Array of text blocks about the person
 * @property {string[]} links - Array of URLs to analyze (LinkedIn, Twitter, etc.)
 */
export interface PersonaExtractionInput {
  textBlocks: string[];
  links: string[];
}

/**
 * Structured persona result from GPT extraction.
 *
 * @interface PersonaExtractionResult
 */
export interface PersonaExtractionResult {
  name: string | null;
  age: number | null;
  occupation: string | null;
  background: string;
  traits: string[];
  interests: string[];
  skills: string[];
  values: string[];
  communication_style: string | null;
  personality_type: string | null;
  goals: string[];
  challenges: string[];
  relationships: string[];
}

/**
 * Extracts a structured persona from text blocks and links using GPT-3.5.
 *
 * @param {PersonaExtractionInput} input - Text blocks and links to analyze
 * @returns {Promise<PersonaExtractionResult>} Structured persona data
 * @throws {OpenAIError} If API call fails or response is invalid
 *
 * @sideeffects
 * - Makes network request to OpenAI API (costs tokens)
 * - Logs extraction start and completion
 *
 * @decision Uses temperature=0.3 for consistency while allowing some creativity.
 * Max tokens=2000 is sufficient for persona structure without excessive cost.
 *
 * @example
 * ```typescript
 * const persona = await extractPersona({
 *   textBlocks: ["John is a software engineer..."],
 *   links: ["https://linkedin.com/in/johndoe"]
 * });
 * ```
 */
export async function extractPersona(input: PersonaExtractionInput): Promise<PersonaExtractionResult> {
  const client = getOpenAIClient();

  // Prepare the user message
  const userMessage = `${
    input.textBlocks.length > 0
      ? `Text blocks about the person:\n${input.textBlocks.map((b, i) => `${i + 1}. ${b}`).join("\n\n")}\n\n`
      : ""
  }${input.links.length > 0 ? `Links provided:\n${input.links.join("\n")}` : ""}`;

  logger.info("OpenAI persona extraction started", {
    textBlockCount: input.textBlocks.length,
    linkCount: input.links.length,
  });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: PERSONA_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.3, // Low temperature for consistent, factual extraction
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new OpenAIError("No response content from OpenAI");
    }

    // Parse JSON response
    let result: PersonaExtractionResult;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      logger.error("Failed to parse OpenAI response as JSON", { content });
      throw new OpenAIError("Failed to parse persona data from OpenAI response");
    }

    logger.info("OpenAI persona extraction completed", {
      name: result.name,
      traits: result.traits?.length,
      interests: result.interests?.length,
    });

    return result;
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);

    // Handle specific OpenAI errors
    if (message.includes("401")) {
      throw new OpenAIError("OpenAI API key is invalid or expired", 401);
    }
    if (message.includes("429")) {
      throw new OpenAIError("OpenAI rate limit exceeded. Please try again later.", 429);
    }
    if (message.includes("503")) {
      throw new OpenAIError("OpenAI service is temporarily unavailable. Please try again later.", 503);
    }

    throw new OpenAIError(`OpenAI API error: ${message}`);
  }
}

/**
 * Validates that the persona structure has minimum required fields.
 *
 * @param {PersonaExtractionResult} persona - Persona to validate
 * @returns {boolean} True if persona has name or background and all required arrays
 *
 * @decision Requires at minimum name OR background to be useful. All array fields
 * must be present (even if empty) for consistent iteration in UI.
 */
export function validatePersonaStructure(persona: PersonaExtractionResult): boolean {
  // At minimum, we need either a name or background
  if (!persona.name && !persona.background) {
    return false;
  }

  // Check that arrays are present (even if empty)
  if (
    !Array.isArray(persona.traits) ||
    !Array.isArray(persona.interests) ||
    !Array.isArray(persona.skills) ||
    !Array.isArray(persona.values)
  ) {
    return false;
  }

  return true;
}
