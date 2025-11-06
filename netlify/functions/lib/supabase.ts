/**
 * Supabase Client Wrapper
 * Handles blob storage operations for personas
 */

import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./env";
import { SupabaseError } from "./errors";
import { logger } from "./logger";
import { nanoid } from "nanoid";

let supabaseClient: ReturnType<typeof createClient> | null = null;

const PERSONAS_BUCKET = "personas";
const METADATA_TABLE = "persona_metadata";

/**
 * Get or create Supabase client with service role key
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
 * Generate unique persona ID
 */
export function generatePersonaId(): string {
  return `persona_${nanoid(12)}`;
}

/**
 * Save persona to Supabase blob storage
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
 * Retrieve persona from Supabase blob storage
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
 * List personas from Supabase blob storage
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
 * Delete persona from Supabase blob storage
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
