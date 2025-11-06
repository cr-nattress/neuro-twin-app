/**
 * @module hooks/usePersona
 *
 * React hook for fetching and caching persona data by ID.
 *
 * @context
 * - Used by chat page and persona review components
 * - Fetches persona on mount and when personaId changes
 * - Provides refetch function for manual refresh
 *
 * @dependencies
 * - react (useState, useEffect)
 * - @/types/persona (Persona): Persona type definition
 * - @/services/serviceFactory (personaService): Persona service abstraction
 *
 * @exports usePersona: Hook that takes personaId and returns { persona, loading, error, refetch }
 *
 * @example
 * ```typescript
 * const { persona, loading, error, refetch } = usePersona(personaId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (!persona) return <NotFound />;
 * return <PersonaDisplay persona={persona} />;
 * ```
 */

import { useState, useEffect } from "react";
import { Persona } from "@/types/persona";
import { personaService } from "@/services/serviceFactory";
import { createApiLogger } from "@/lib/api-logger";

/**
 * Return type for usePersona hook.
 *
 * @interface UsePersonaReturn
 * @property {Persona | null} persona - Fetched persona or null
 * @property {boolean} loading - True while fetching
 * @property {string | null} error - Error message if fetch failed
 * @property {Function} refetch - Manually refetch persona
 */
interface UsePersonaReturn {
  persona: Persona | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * React hook for persona data fetching.
 *
 * @param {string | null} personaId - Persona identifier to fetch
 * @returns {UsePersonaReturn} Persona state and refetch function
 *
 * @sideeffects
 * - Makes network request to get-persona function on mount and when personaId changes
 */
export function usePersona(personaId: string | null): UsePersonaReturn {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersona = async () => {
    const logger = createApiLogger("usePersona", "/.netlify/functions/get-persona");

    if (!personaId) {
      logger.logStep("No personaId provided, skipping fetch");
      setLoading(false);
      return;
    }

    logger.logStep("Starting persona fetch", { personaId });
    setLoading(true);
    setError(null);

    try {
      logger.logStep("Calling personaService.getPersona");
      const response = await personaService.getPersona(personaId);

      logger.logStep("Received response from personaService", {
        success: response.success,
        hasPersona: !!response.persona,
        hasError: !!response.error,
      });

      if (response.success && response.persona) {
        logger.logStep("Persona fetched successfully", {
          personaName: response.persona.name,
        });
        setPersona(response.persona);
      } else {
        const errorMessage = response.error || "Failed to load persona";
        logger.logStep("Persona fetch failed", { error: errorMessage });
        setError(errorMessage);
      }
    } catch (err: any) {
      logger.logError(err);
      const errorMessage = err.message || "An unexpected error occurred";
      logger.logStep("usePersona catch error", { errorMessage });
      setError(errorMessage);
    } finally {
      setLoading(false);
      logger.logStep("usePersona fetch completed");
    }
  };

  useEffect(() => {
    fetchPersona();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId]);

  return {
    persona,
    loading,
    error,
    refetch: fetchPersona,
  };
}
