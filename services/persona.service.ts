/**
 * @module services/persona.service
 *
 * Service interface for persona operations (process, save, get, list).
 *
 * @context
 * - Defines contract implemented by apiPersonaService (and mockable for tests)
 * - Used by hooks and components to interact with persona backend
 * - All methods call Netlify Functions via HTTP
 *
 * @dependencies
 * - @/types/persona: Type definitions for persona operations
 *
 * @exports
 * - IPersonaService: Interface with processPersona, savePersona, getPersona, listPersonas
 * - Re-exports persona types for convenience
 *
 * @pattern Strategy - Allows swapping implementations (API, mock, localStorage, etc.)
 */

export type {
  PersonaInputPayload,
  ProcessPersonaResponse,
  SavePersonaPayload,
  SavePersonaResponse,
  GetPersonaResponse,
  Persona,
} from "@/types/persona";

import {
  PersonaInputPayload,
  ProcessPersonaResponse,
  SavePersonaPayload,
  SavePersonaResponse,
  GetPersonaResponse,
  Persona,
} from "@/types/persona";

/**
 * Service interface for persona operations.
 *
 * @interface IPersonaService
 */
export interface IPersonaService {
  /**
   * Processes raw text blocks and links into structured persona using OpenAI.
   *
   * @param {PersonaInputPayload} input - Text blocks and links
   * @returns {Promise<ProcessPersonaResponse>} Response with persona or error
   * @sideeffects Makes HTTP POST to /.netlify/functions/process-persona
   */
  processPersona(input: PersonaInputPayload): Promise<ProcessPersonaResponse>;

  /**
   * Saves a persona to Supabase Storage.
   *
   * @param {SavePersonaPayload} payload - Persona to save
   * @returns {Promise<SavePersonaResponse>} Response with persona ID and storage path
   * @sideeffects Makes HTTP POST to /.netlify/functions/save-persona
   */
  savePersona(payload: SavePersonaPayload): Promise<SavePersonaResponse>;

  /**
   * Retrieves a persona by ID from Supabase Storage.
   *
   * @param {string} id - Persona identifier
   * @returns {Promise<GetPersonaResponse>} Response with persona data or error
   * @sideeffects Makes HTTP GET to /.netlify/functions/get-persona
   */
  getPersona(id: string): Promise<GetPersonaResponse>;

  /**
   * Lists all personas from Supabase Storage.
   *
   * @returns {Promise<Persona[]>} Array of personas
   * @sideeffects Makes HTTP GET to /.netlify/functions/list-personas
   * @todo Add pagination parameters
   */
  listPersonas(): Promise<Persona[]>;
}
