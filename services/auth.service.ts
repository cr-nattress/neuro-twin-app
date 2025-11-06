/**
 * @module services/auth.service
 *
 * Service interface for authentication operations (magic link, sessions, state changes).
 *
 * @context
 * - Defines contract implemented by apiAuthService (Supabase backend)
 * - Used by useAuth hook and auth-protected components
 * - Supports magic link (passwordless) authentication
 *
 * @dependencies
 * - @/types/auth: Type definitions for auth operations
 *
 * @exports
 * - IAuthService: Interface with sendMagicLink, getCurrentUser, getCurrentSession, signOut, onAuthStateChange
 *
 * @pattern Strategy - Allows swapping auth providers (Supabase, Auth0, Firebase, etc.)
 */

import type { SendMagicLinkResponse, User, Session } from "@/types/auth";

/**
 * Service interface for authentication operations.
 *
 * @interface IAuthService
 */
export interface IAuthService {
  /**
   * Sends a magic link to the user's email for passwordless authentication.
   *
   * @param {string} email - User's email address
   * @returns {Promise<SendMagicLinkResponse>} Response indicating success or error
   * @sideeffects Sends email via Supabase
   */
  sendMagicLink(email: string): Promise<SendMagicLinkResponse>;

  /**
   * Gets the currently authenticated user.
   *
   * @returns {Promise<User | null>} User object if authenticated, null otherwise
   * @sideeffects Reads from Supabase session storage
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Gets the current user session with tokens.
   *
   * @returns {Promise<Session | null>} Session object if authenticated, null otherwise
   * @sideeffects Reads from Supabase session storage
   */
  getCurrentSession(): Promise<Session | null>;

  /**
   * Signs out the current user and clears session.
   *
   * @returns {Promise<void>}
   * @sideeffects
   * - Clears Supabase session storage
   * - Triggers onAuthStateChange listeners
   */
  signOut(): Promise<void>;

  /**
   * Subscribes to authentication state changes.
   *
   * @param {Function} callback - Function called when auth state changes (login/logout)
   * @returns {Function} Unsubscribe function to stop listening
   * @sideeffects Registers listener with Supabase auth
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}
