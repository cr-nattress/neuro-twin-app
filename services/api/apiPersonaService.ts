/**
 * @module services/api/apiPersonaService
 *
 * Production persona service that calls Netlify Functions.
 *
 * @context
 * - Implements IPersonaService interface for type-safe API calls
 * - Called by usePersona hook and components for all persona operations
 * - Makes HTTP requests to Netlify serverless functions
 *
 * @dependencies
 * - IPersonaService (service interface)
 * - getApiBaseUrl (API URL resolution)
 * - createApiLogger (request/response logging)
 *
 * @exports
 * - ApiPersonaService: Main service class
 * - apiPersonaService: Singleton instance
 *
 * @sideeffects
 * - Makes network requests to Netlify Functions
 * - Calls Supabase storage and OpenAI APIs (indirectly via functions)
 * - Logs all requests/responses for debugging
 */

import {
  IPersonaService,
  PersonaInputPayload,
  ProcessPersonaResponse,
  SavePersonaPayload,
  SavePersonaResponse,
  GetPersonaResponse,
} from "../persona.service";
import { Persona } from "@/types/persona";
import { getApiBaseUrl } from "@/lib/api";
import { createApiLogger } from "@/lib/api-logger";

/**
 * API Persona Service Class
 *
 * @pattern Strategy - Implements IPersonaService interface
 */
export class ApiPersonaService implements IPersonaService {
  private baseUrl: string;

  constructor() {
    // Get base URL at construction time (might be called from browser context)
    try {
      this.baseUrl = getApiBaseUrl();
    } catch {
      // Fallback to relative URLs if called outside browser context
      this.baseUrl = "";
    }
  }

  /**
   * Process persona data using OpenAI via Netlify Function.
   *
   * @param {PersonaInputPayload} input - User input (textBlocks, links)
   * @returns {Promise<ProcessPersonaResponse>} Response with persona or error
   * @throws Never (catches all errors and returns error response)
   *
   * @sideeffects
   * - Makes HTTP POST to /.netlify/functions/process-persona
   * - Calls OpenAI API (indirectly via Netlify function)
   * - Logs detailed request/response for debugging
   *
   * @decision Log at detailed level including full request/response
   * to troubleshoot 502 errors and API issues
   */
  async processPersona(input: PersonaInputPayload): Promise<ProcessPersonaResponse> {
    const logger = createApiLogger(
      "processPersona",
      "/.netlify/functions/process-persona"
    );

    const url = `${this.baseUrl}/.netlify/functions/process-persona`;

    try {
      logger.logStep("Initializing persona processing", {
        textBlocksCount: input.textBlocks.length,
        linksCount: input.links.length,
      });

      logger.logRequest({
        url,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: input,
        timestamp: new Date().toISOString(),
      });

      logger.logStep("Sending fetch request to Netlify function");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      logger.logStep("Fetch completed", {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        logger.logStep("Response not OK, attempting to parse error");
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          logger.logStep("Could not parse error response as JSON", {
            responseText: await response.text(),
          });
        }

        const error = new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
        logger.logError(error);

        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      logger.logStep("Parsing response JSON");
      const data: ProcessPersonaResponse = await response.json();

      logger.logResponse({
        status: response.status,
        statusText: response.statusText,
        body: data,
        duration: 0,
        timestamp: new Date().toISOString(),
      });

      logger.logStep("Successfully processed persona", {
        success: data.success,
        hasPersona: !!data.persona,
      });

      return data;
    } catch (error: unknown) {
      logger.logError(error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process persona (unknown error)",
      };
    }
  }

  /**
   * Save persona to Supabase storage via Netlify Function.
   *
   * @param {SavePersonaPayload} payload - Persona to save
   * @returns {Promise<SavePersonaResponse>} Response with persona_id or error
   *
   * @sideeffects
   * - Makes HTTP POST to /.netlify/functions/save-persona
   * - Uploads JSON blob to Supabase Storage
   * - Logs detailed request/response for debugging
   */
  async savePersona(payload: SavePersonaPayload): Promise<SavePersonaResponse> {
    const logger = createApiLogger(
      "savePersona",
      "/.netlify/functions/save-persona"
    );

    const url = `${this.baseUrl}/.netlify/functions/save-persona`;

    try {
      logger.logStep("Starting persona save", {
        hasPersona: !!payload.persona,
      });

      logger.logRequest({
        url,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      logger.logStep("Save fetch completed", {
        status: response.status,
      });

      if (!response.ok) {
        logger.logStep("Response not OK, parsing error");
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          logger.logStep("Could not parse error response as JSON");
        }

        const error = new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
        logger.logError(error);

        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: SavePersonaResponse = await response.json();

      logger.logResponse({
        status: response.status,
        statusText: response.statusText,
        body: data,
        duration: 0,
        timestamp: new Date().toISOString(),
      });

      logger.logStep("Persona saved successfully", {
        personaId: data.persona_id,
      });

      return data;
    } catch (error: unknown) {
      logger.logError(error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save persona",
      };
    }
  }

  /**
   * Get persona by ID from Supabase via Netlify Function.
   *
   * @param {string} id - Persona identifier
   * @returns {Promise<GetPersonaResponse>} Response with persona or error
   *
   * @sideeffects
   * - Makes HTTP GET to /.netlify/functions/get-persona
   * - Downloads JSON blob from Supabase Storage
   * - Logs detailed request/response for debugging
   */
  async getPersona(id: string): Promise<GetPersonaResponse> {
    const logger = createApiLogger(
      "getPersona",
      "/.netlify/functions/get-persona"
    );

    const url = `${this.baseUrl}/.netlify/functions/get-persona?persona_id=${encodeURIComponent(id)}`;

    try {
      logger.logStep("Fetching persona by ID", { personaId: id });

      logger.logRequest({
        url,
        method: "GET",
        headers: { "Content-Type": "application/json" },
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      logger.logStep("Fetch completed", { status: response.status });

      if (!response.ok) {
        logger.logStep("Response not OK");
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          logger.logStep("Could not parse error response");
        }

        const error = new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
        logger.logError(error);

        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data: GetPersonaResponse = await response.json();

      logger.logResponse({
        status: response.status,
        statusText: response.statusText,
        body: data,
        duration: 0,
        timestamp: new Date().toISOString(),
      });

      return data;
    } catch (error: unknown) {
      logger.logError(error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get persona",
      };
    }
  }

  /**
   * List all personas from Supabase via Netlify Function.
   *
   * @returns {Promise<Persona[]>} Array of persona summaries
   *
   * @sideeffects
   * - Makes HTTP GET to /.netlify/functions/list-personas
   * - Lists objects in Supabase Storage bucket
   * - Logs detailed request/response for debugging
   */
  async listPersonas(): Promise<Persona[]> {
    const logger = createApiLogger(
      "listPersonas",
      "/.netlify/functions/list-personas"
    );

    const url = `${this.baseUrl}/.netlify/functions/list-personas?limit=50&offset=0`;

    try {
      logger.logStep("Listing personas");

      logger.logRequest({
        url,
        method: "GET",
        headers: { "Content-Type": "application/json" },
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      logger.logStep("Fetch completed", { status: response.status });

      if (!response.ok) {
        logger.logStep("Response not OK");
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (parseError) {
          logger.logStep("Could not parse error response");
        }

        const error = new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
        logger.logError(error);

        return [];
      }

      const data: any = await response.json();

      logger.logResponse({
        status: response.status,
        statusText: response.statusText,
        body: {
          personasCount: data.personas?.length,
        },
        duration: 0,
        timestamp: new Date().toISOString(),
      });

      logger.logStep("Personas listed", {
        count: data.personas?.length || 0,
      });

      // The list-personas function returns basic persona info
      // For now, return empty array as we'd need to fetch full personas if needed
      return [];
    } catch (error: unknown) {
      logger.logError(error);

      return [];
    }
  }
}

/**
 * Export singleton instance
 */
export const apiPersonaService = new ApiPersonaService();
