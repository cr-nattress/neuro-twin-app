/**
 * @module netlify/functions/lib/validation
 *
 * Zod-based validation schemas for all API request/response payloads.
 *
 * @context
 * - All Netlify Functions validate inputs using these schemas before processing
 * - Provides type safety and runtime validation in a single source of truth
 * - Automatically generates TypeScript types from schemas via z.infer
 *
 * @dependencies
 * - zod (z): Schema validation library
 * - ./errors (ValidationError): Custom error for validation failures
 *
 * @exports
 * - PersonaInputSchema: Validates persona creation input (textBlocks, links)
 * - PersonaSchema: Validates persona data structure
 * - SavePersonaPayloadSchema: Validates save persona request
 * - ChatMessageSchema: Validates chat request
 * - PaginationSchema: Validates pagination parameters (limit, offset)
 * - validateInput: Helper to safely validate data against a schema
 * - sanitizeString: Removes control characters from string input
 * - sanitizeUrl: Validates and normalizes URLs
 * - validatePersonaId: Checks persona ID format
 */

import { z } from "zod";
import { ValidationError } from "./errors";

/**
 * Schema for persona extraction input from client to process-persona endpoint.
 *
 * @decision Limits text blocks and links to 50 each to prevent abuse and excessive
 * OpenAI API costs. Requires at least one non-empty text block.
 */
export const PersonaInputSchema = z.object({
  textBlocks: z
    .array(z.string().min(1, "Text block cannot be empty").max(5000, "Text block exceeds 5000 characters"))
    .max(50, "Maximum 50 text blocks allowed")
    .refine((blocks) => blocks.some((b) => b.trim().length > 0), "At least one non-empty text block required"),
  links: z
    .array(z.string().url("Invalid URL format").max(2048, "URL exceeds 2048 characters"))
    .max(50, "Maximum 50 links allowed")
    .optional()
    .default([]),
});

/**
 * Inferred TypeScript type for validated persona input.
 */
export type PersonaInput = z.infer<typeof PersonaInputSchema>;

/**
 * Schema for process-persona endpoint response.
 *
 * @decision Always returns structured response with success boolean, even on error.
 * Client can differentiate success/error by checking response.success flag.
 */
export const ProcessPersonaResponseSchema = z.object({
  success: z.boolean(),
  persona: PersonaSchema.optional(),
  error: z.string().optional(),
});

/**
 * Inferred TypeScript type for process-persona response.
 */
export type ProcessPersonaResponse = z.infer<typeof ProcessPersonaResponseSchema>;

/**
 * Schema for persona data structure (OpenAI output and storage format).
 *
 * @decision All array fields default to empty arrays rather than null for easier
 * iteration in UI components. Optional fields use nullable() for explicit null values.
 */
export const PersonaSchema = z.object({
  name: z.string().nullable().optional(),
  age: z.number().nullable().optional(),
  occupation: z.string().nullable().optional(),
  background: z.string().default(""),
  traits: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  values: z.array(z.string()).default([]),
  communication_style: z.string().nullable().optional(),
  personality_type: z.string().nullable().optional(),
  goals: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  relationships: z.array(z.string()).default([]),
  metadata: z
    .object({
      created_at: z.string().optional(),
      source_text_blocks: z.number().optional(),
      source_links: z.number().optional(),
    })
    .optional(),
  raw_data: z
    .object({
      textBlocks: z.array(z.string()),
      links: z.array(z.string()),
    })
    .optional(),
});

/**
 * Inferred TypeScript type for validated persona data.
 */
export type Persona = z.infer<typeof PersonaSchema>;

/**
 * Schema for save-persona endpoint request payload.
 *
 * @decision Requires fully validated persona object to ensure data quality before storage.
 */
export const SavePersonaPayloadSchema = z.object({
  persona: PersonaSchema,
});

/**
 * Inferred TypeScript type for save persona payload.
 */
export type SavePersonaPayload = z.infer<typeof SavePersonaPayloadSchema>;

/**
 * Schema for save-persona endpoint response.
 *
 * @decision Returns persona_id and storage_path for client reference.
 */
export const SavePersonaResponseSchema = z.object({
  success: z.boolean(),
  persona_id: z.string().regex(/^persona_/, "Persona ID must start with persona_").optional(),
  storage_path: z.string().optional(),
  error: z.string().optional(),
});

/**
 * Inferred TypeScript type for save-persona response.
 */
export type SavePersonaResponse = z.infer<typeof SavePersonaResponseSchema>;

/**
 * Schema for get-persona endpoint query parameter.
 *
 * @decision Validates persona_id format (persona_[12 alphanumeric chars]).
 */
export const GetPersonaQuerySchema = z.object({
  persona_id: z
    .string()
    .min(1, "Persona ID required")
    .regex(/^persona_[a-zA-Z0-9_-]{12}$/, "Invalid persona ID format"),
});

/**
 * Inferred TypeScript type for get-persona query.
 */
export type GetPersonaQuery = z.infer<typeof GetPersonaQuerySchema>;

/**
 * Schema for get-persona endpoint response.
 *
 * @decision Returns full persona object if found, error message if not.
 */
export const GetPersonaResponseSchema = z.object({
  success: z.boolean(),
  persona: PersonaSchema.optional(),
  error: z.string().optional(),
});

/**
 * Inferred TypeScript type for get-persona response.
 */
export type GetPersonaResponse = z.infer<typeof GetPersonaResponseSchema>;

/**
 * Schema for list-personas endpoint response.
 *
 * @decision Returns array of persona metadata (not full objects) for performance.
 * Total count allows frontend pagination logic.
 */
export const ListPersonasResponseSchema = z.object({
  success: z.boolean(),
  personas: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        created_at: z.string(),
      })
    )
    .optional(),
  total: z.number().int().min(0).optional(),
  error: z.string().optional(),
});

/**
 * Inferred TypeScript type for list-personas response.
 */
export type ListPersonasResponse = z.infer<typeof ListPersonasResponseSchema>;

/**
 * Schema for chat request from client.
 *
 * @decision Limits message to 4000 characters to prevent token overflow and excessive
 * costs. History is optional for stateless requests. Persona ID must be valid format.
 */
export const ChatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message cannot exceed 4000 characters"),
  persona_id: z
    .string()
    .min(1, "Persona ID required")
    .regex(/^persona_[a-zA-Z0-9_-]{12}$/, "Invalid persona ID format"),
  conversation_id: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "agent"]),
        content: z.string(),
        id: z.string().optional(),
        timestamp: z.string().optional(),
      })
    )
    .max(10, "Maximum 10 messages in history")
    .optional(),
});

/**
 * Inferred TypeScript type for chat request.
 */
export type ChatRequest = z.infer<typeof ChatMessageSchema>;

/**
 * Schema for chat endpoint response.
 *
 * @decision Returns agent response with conversation/message IDs and metadata.
 * Metadata includes token count and processing time for analytics.
 */
export const ChatResponseSchema = z.object({
  success: z.boolean(),
  response: z.string().optional(),
  conversation_id: z.string().optional(),
  message_id: z.string().optional(),
  error: z.string().optional(),
  metadata: z
    .object({
      tokens_used: z.number().int().min(0).optional(),
      processing_time_ms: z.number().int().min(0).optional(),
      agents_involved: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Inferred TypeScript type for chat response.
 */
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

/**
 * Schema for pagination parameters.
 *
 * @decision Uses z.coerce to automatically convert string query params to numbers.
 * Limits max to 100 to prevent expensive queries.
 */
export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Inferred TypeScript type for pagination parameters.
 */
export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Validates data against a Zod schema and throws ValidationError on failure.
 *
 * @template T - Expected type after validation
 * @param {z.ZodSchema<T>} schema - Zod schema to validate against
 * @param {unknown} data - Data to validate
 * @returns {T} Validated and typed data
 * @throws {ValidationError} If validation fails with detailed error messages
 *
 * @example
 * ```typescript
 * const input = validateInput(PersonaInputSchema, requestBody);
 * ```
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
      throw new ValidationError(messages.join("; "));
    }
    throw new ValidationError("Invalid input");
  }
}

/**
 * Removes control characters from string input.
 *
 * @param {string} input - String to sanitize
 * @returns {string} Trimmed string with control characters removed
 *
 * @decision Strips ASCII control characters (0x00-0x1F, 0x7F) to prevent injection
 * attacks and formatting issues in logs/storage
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Validates and normalizes a URL string.
 *
 * @param {string} url - URL string to validate
 * @returns {string} Normalized URL string
 * @throws {ValidationError} If URL is malformed
 *
 * @decision Uses URL constructor for validation to ensure only valid URLs are processed
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    throw new ValidationError(`Invalid URL: ${url}`);
  }
}

/**
 * Validates persona ID format (persona_[12 alphanumeric chars]).
 *
 * @param {string} id - Persona ID to validate
 * @returns {boolean} True if ID matches expected format
 *
 * @decision Uses nanoid(12) format for collision resistance and URL safety
 */
export function validatePersonaId(id: string): boolean {
  return /^persona_[a-zA-Z0-9_-]{12}$/.test(id);
}
