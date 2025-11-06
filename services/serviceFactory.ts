/**
 * @module services/serviceFactory
 *
 * Service factory that exports configured service instances for the application.
 *
 * @context
 * - Central location for all service dependencies
 * - Makes it easy to swap implementations (API, mock, localStorage) in one place
 * - Used by hooks and components to access backend services
 *
 * @dependencies
 * - ./persona.service (IPersonaService): Persona service interface
 * - ./api/apiPersonaService: Real API implementation for personas
 * - ./auth.service (IAuthService): Auth service interface
 * - ./api/apiAuthService: Real Supabase implementation for auth
 *
 * @exports
 * - personaService: Configured persona service instance (currently apiPersonaService)
 * - authService: Configured auth service instance (currently apiAuthService)
 *
 * @pattern Factory - Centralizes service instantiation and configuration
 * @decision All services use live APIs by default. To swap implementations (e.g., for
 * tests), change the assignment in this file.
 */

import { IPersonaService } from "./persona.service";
import { apiPersonaService } from "./api/apiPersonaService";
import { IAuthService } from "./auth.service";
import { apiAuthService } from "./api/apiAuthService";

/**
 * Persona service instance that calls real Netlify Functions.
 *
 * @type {IPersonaService}
 */
export const personaService: IPersonaService = apiPersonaService;

/**
 * Auth service instance that uses real Supabase for magic link authentication.
 *
 * @type {IAuthService}
 */
export const authService: IAuthService = apiAuthService;
