/**
 * @module netlify/functions/lib/supabase
 *
 * Supabase Storage client for persona blob storage operations.
 *
 * @context
 * - Used by save-persona, get-persona, list-personas, and chat functions
 * - Stores persona JSON as blobs in "personas" bucket
 * - Uses service role key to bypass Row Level Security (RLS)
 *
 * @dependencies
 * - @supabase/supabase-js (createClient): Official Supabase SDK
 * - ./env (getEnv): Environment configuration
 * - ./errors (SupabaseError): Custom error class for storage failures
 * - ./logger (logger): Structured logging
 * - nanoid: Generates collision-resistant unique IDs
 *
 * @exports
 * - generatePersonaId: Creates unique persona_[nanoid] identifier
 * - savePersonaToStorage: Uploads persona JSON to blob storage
 * - getPersonaFromStorage: Downloads and parses persona JSON
 * - listPersonasFromStorage: Lists all personas with pagination
 * - deletePersonaFromStorage: Removes persona blob
 *
 * @pattern Singleton - Single shared Supabase client instance
 * @sideeffects
 * - Network requests to Supabase Storage API
 * - Blob storage operations (create, read, list, delete)
 */

import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./env";
import { SupabaseError } from "./errors";
import { logger } from "./logger";
import { nanoid } from "nanoid";

/**
 * Singleton Supabase client instance (lazy-initialized).
 */
let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Supabase Storage bucket name for persona blobs.
 */
const PERSONAS_BUCKET = "personas";

/**
 * @todo Future: metadata table for searchable persona attributes
 */
const METADATA_TABLE = "persona_metadata";

/**
 * Gets or creates the Supabase client with service role key.
 *
 * @returns {SupabaseClient} Configured Supabase client
 * @sideeffects Creates Supabase client on first call (reads SUPABASE_URL and key from env)
 *
 * @decision Uses service role key instead of anon key to bypass RLS. This is safe
 * because functions run server-side with controlled access.
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    const env = getEnv();
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Generates a unique persona identifier.
 *
 * @returns {string} Persona ID in format "persona_[12 char nanoid]"
 *
 * @decision Uses nanoid(12) for collision resistance (2.6M IDs at 1% collision probability)
 * and URL-safe characters. Prefix "persona_" makes IDs self-documenting.
 */
export function generatePersonaId(): string {
  return `persona_${nanoid(12)}`;
}

/**
 * Saves a persona as JSON blob to Supabase Storage.
 *
 * @param {string} personaId - Unique persona identifier (from generatePersonaId)
 * @param {any} personaData - Persona object to serialize and store
 * @returns {Promise<{path: string, size: number}>} Storage path and byte size
 * @throws {SupabaseError} If upload fails or bucket doesn't exist
 *
 * @sideeffects
 * - Uploads JSON blob to Supabase Storage
 * - Logs save operation
 *
 * @decision Uses upsert:false to prevent accidental overwrites. Personas are immutable
 * after creation (no update operation exists).
 */
export async function savePersonaToStorage(
  personaId: string,
  personaData: any
): Promise<{ path: string; size: number }> {
  const client = getSupabaseClient();

  const personaJson = JSON.stringify(personaData);
  const fileName = `${personaId}.json`;
  const filePath = `${fileName}`;

  logger.info("Saving persona to Supabase", { personaId, size: personaJson.length });

  try {
    const { data, error } = await client.storage
      .from(PERSONAS_BUCKET)
      .upload(filePath, personaJson, {
        contentType: "application/json",
        upsert: false,
      });

    if (error) {
      throw new SupabaseError(`Failed to upload persona: ${error.message}`);
    }

    logger.info("Persona saved successfully", { personaId, filePath });

    return {
      path: filePath,
      size: personaJson.length,
    };
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("auth") || message.includes("permission")) {
      throw new SupabaseError("Not authorized to save personas. Check service role key.", 403);
    }
    if (message.includes("exist")) {
      throw new SupabaseError("Personas bucket does not exist in Supabase. Create it first.", 404);
    }

    throw new SupabaseError(`Failed to save persona: ${message}`);
  }
}

/**
 * Retrieves and parses a persona from Supabase Storage.
 *
 * @param {string} personaId - Persona identifier
 * @returns {Promise<any>} Parsed persona object
 * @throws {SupabaseError} If persona not found (404) or download fails
 *
 * @sideeffects
 * - Downloads blob from Supabase Storage
 * - Logs retrieval operation
 */
export async function getPersonaFromStorage(personaId: string): Promise<any> {
  const client = getSupabaseClient();

  const fileName = `${personaId}.json`;
  const filePath = `${fileName}`;

  logger.info("Retrieving persona from Supabase", { personaId });

  try {
    const { data, error } = await client.storage.from(PERSONAS_BUCKET).download(filePath);

    if (error) {
      if (error.message.includes("not found")) {
        throw new SupabaseError(`Persona not found: ${personaId}`, 404);
      }
      throw new SupabaseError(`Failed to download persona: ${error.message}`);
    }

    if (!data) {
      throw new SupabaseError(`Persona not found: ${personaId}`, 404);
    }

    // Convert blob to text and parse JSON
    const text = await data.text();
    const personaData = JSON.parse(text);

    logger.info("Persona retrieved successfully", { personaId });

    return personaData;
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("not found")) {
      throw new SupabaseError(`Persona not found: ${personaId}`, 404);
    }
    if (message.includes("auth") || message.includes("permission")) {
      throw new SupabaseError("Not authorized to retrieve personas. Check service role key.", 403);
    }

    throw new SupabaseError(`Failed to retrieve persona: ${message}`);
  }
}

/**
 * Lists all personas in storage with pagination.
 *
 * @param {number} [limit=20] - Maximum number of personas to return
 * @param {number} [offset=0] - Number of personas to skip
 * @returns {Promise<{personas: Array, total: number}>} Persona list and count
 * @throws {SupabaseError} If listing fails
 *
 * @sideeffects
 * - Lists files in Supabase Storage bucket
 * - Logs list operation
 *
 * @decision Returns file metadata only (not full persona objects) for performance.
 * Client can fetch full persona on demand.
 */
export async function listPersonasFromStorage(limit = 20, offset = 0): Promise<{
  personas: Array<{ id: string; name: string; created_at: string }>;
  total: number;
}> {
  const client = getSupabaseClient();

  logger.info("Listing personas from Supabase", { limit, offset });

  try {
    const { data, error } = await client.storage.from(PERSONAS_BUCKET).list(undefined, {
      limit,
      offset,
      sortBy: {
        column: "created_at",
        order: "desc",
      },
    });

    if (error) {
      throw new SupabaseError(`Failed to list personas: ${error.message}`);
    }

    // Transform file list to persona list
    const personas = (data || [])
      .filter((file) => file.name.endsWith(".json"))
      .map((file) => {
        const personaId = file.name.replace(".json", "");
        return {
          id: personaId,
          name: personaId,
          created_at: file.created_at,
        };
      });

    logger.info("Personas listed successfully", { count: personas.length });

    return {
      personas,
      total: personas.length + offset,
    };
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new SupabaseError(`Failed to list personas: ${message}`);
  }
}

/**
 * Deletes a persona from Supabase Storage.
 *
 * @param {string} personaId - Persona identifier
 * @returns {Promise<void>}
 * @throws {SupabaseError} If deletion fails
 *
 * @sideeffects
 * - Removes blob from Supabase Storage (permanent)
 * - Logs deletion operation
 */
export async function deletePersonaFromStorage(personaId: string): Promise<void> {
  const client = getSupabaseClient();

  const fileName = `${personaId}.json`;

  logger.info("Deleting persona from Supabase", { personaId });

  try {
    const { error } = await client.storage.from(PERSONAS_BUCKET).remove([fileName]);

    if (error) {
      throw new SupabaseError(`Failed to delete persona: ${error.message}`);
    }

    logger.info("Persona deleted successfully", { personaId });
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new SupabaseError(`Failed to delete persona: ${message}`);
  }
}
