/**
 * Input Validation with Zod
 * Validates all incoming requests
 */

import { z } from "zod";
import { ValidationError } from "./errors";

/**
 * Persona Input Validation
 */
export const PersonaInputSchema = z.object({
  textBlocks: z
    .array(z.string())
    .max(50, "Maximum 50 text blocks allowed")
    .refine((blocks) => blocks.some((b) => b.trim().length > 0), "At least one non-empty text block required"),
  links: z
    .array(z.string().url("Invalid URL format").max(2048))
    .max(50, "Maximum 50 links allowed")
    .optional()
    .default([]),
});

export type PersonaInput = z.infer<typeof PersonaInputSchema>;

/**
 * Persona Output Validation
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

export type Persona = z.infer<typeof PersonaSchema>;

/**
 * Save Persona Validation
 */
export const SavePersonaPayloadSchema = z.object({
  persona: PersonaSchema,
});

export type SavePersonaPayload = z.infer<typeof SavePersonaPayloadSchema>;

/**
 * Chat Message Validation
 */
export const ChatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message cannot exceed 4000 characters"),
  persona_id: z.string().min(1, "Persona ID required"),
  conversation_id: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "agent"]),
        content: z.string(),
      })
    )
    .optional(),
});

export type ChatRequest = z.infer<typeof ChatMessageSchema>;

/**
 * Pagination Validation
 */
export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Safe validation helper
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      throw new ValidationError(messages.join("; "));
    }
    throw new ValidationError("Invalid input");
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Sanitize URL
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
 * Validate persona ID format
 */
export function validatePersonaId(id: string): boolean {
  return /^persona_[a-zA-Z0-9_-]{12}$/.test(id);
}
