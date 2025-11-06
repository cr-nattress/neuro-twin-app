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
 * Persona Extraction Prompt Template (Two-Part System)
 *
 * This implements a strict two-part prompting strategy to maximize OpenAI output consistency:
 *
 * PART 1 - System Message: Defines the extraction task, field definitions, and output schema
 * PART 2 - User Message: Wraps the textBlocks and links in a structured template
 *
 * Why two-part?
 * - System prompt sets the behavioral constraints (JSON-only, strict schema, field rules)
 * - User prompt provides the actual data to extract from
 * - Together they reduce hallucination and enforce format compliance
 *
 * Key Constraints:
 * - Explicit schema definition prevents hallucinated keys
 * - "Return ONLY valid JSON" enforces no markdown/explanations
 * - CRITICAL note prevents wrapping in success/persona keys (backend adds those)
 * - Clear null vs [] rules: nullable fields get null, arrays get []
 * - Field counts and types strictly specified
 *
 * Response Handling:
 * - Backend expects: { name, age, occupation, background, traits, interests, ... }
 * - Backend ADDS: metadata (created_at, source counts) and raw_data (original inputs)
 * - System prompt explicitly says "The backend will handle metadata and raw_data"
 *
 * See extractPersona() for how the user message is constructed from textBlocks/links.
 */
const PERSONA_SYSTEM_PROMPT = `You are an expert at analyzing text and links about a person to create a detailed digital persona.

Your task:
1) Extract key information from the provided text blocks and links.
2) Structure the information into the exact JSON format specified below.
3) Follow these field definitions:
   - name: Full name if available, else null
   - age: Age or age range as a number if mentioned, else null
   - occupation: Primary job/role if available, else null
   - background: Concise summary (string; may be empty)
   - traits: 5–7 personality traits (array of strings)
   - interests: 5–10 interests/hobbies (array of strings)
   - skills: 5–10 professional/technical skills (array of strings)
   - values: 3–5 core values (array of strings)
   - communication_style: How they communicate if known, else null
   - personality_type: If mentioned (MBTI, Big Five, etc.), else null
   - goals: Current/future goals if mentioned (array of strings)
   - challenges: Known challenges/concerns (array of strings)
   - relationships: Key relationships/connections (array of strings)

Output requirements:
- Return ONLY valid JSON. No markdown, no explanations, no preamble.
- If a field is unknown, use null (for nullable fields) or [] (for arrays).
- Conform EXACTLY to this top-level shape (DO NOT wrap in "success" or "persona" keys):

{
  "name": string|null,
  "age": number|null,
  "occupation": string|null,
  "background": string,
  "traits": string[],
  "interests": string[],
  "skills": string[],
  "values": string[],
  "communication_style": string|null,
  "personality_type": string|null,
  "goals": string[],
  "challenges": string[],
  "relationships": string[]
}

CRITICAL: Return only the persona object above. The backend will handle metadata and raw_data.`;

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

  // Prepare the user message using structured template
  const textBlocksSection =
    input.textBlocks.length > 0
      ? `Text blocks about the person:\n${input.textBlocks.map((b, i) => `${i + 1}. ${b}`).join("\n\n")}\n\n`
      : "";

  const linksSection =
    input.links.length > 0
      ? `Links provided:\n${input.links.join("\n")}`
      : "";

  const userMessage = (textBlocksSection + linksSection).trim() || "No information provided.";

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

    // Parse JSON response (system prompt enforces strict JSON-only output)
    let result: PersonaExtractionResult;
    try {
      // Extract JSON from response (robust parsing in case of extra whitespace)
      // System prompt requires "Return ONLY valid JSON" so this should be a clean object
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      logger.error("Failed to parse OpenAI response as JSON", parseError, {
        responsePreview: content.substring(0, 500),
      });
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
