/**
 * OpenAI Client Wrapper
 * Handles API calls to OpenAI with error handling and retry logic
 */

import { OpenAI } from "openai";
import { getEnv } from "./env";
import { OpenAIError } from "./errors";
import { logger } from "./logger";

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client
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
 * System prompt for persona extraction
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

export interface PersonaExtractionInput {
  textBlocks: string[];
  links: string[];
}

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
 * Extract persona from text blocks and links using OpenAI
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
 * Validate persona structure
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
