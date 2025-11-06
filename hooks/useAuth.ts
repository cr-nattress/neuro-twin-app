/**
 * @module hooks/useAuth
 *
 * React hook for managing authentication state across the application.
 *
 * @context
 * - Used by layout.tsx and auth-protected pages
 * - Subscribes to Supabase auth state changes
 * - Provides current user, session, loading state, and signOut function
 *
 * @dependencies
 * - react (useEffect, useState, useCallback)
 * - @/services/serviceFactory (authService): Auth service abstraction
 * - @/types/auth: Auth type definitions
 *
 * @exports useAuth: Hook that returns { user, session, isLoading, error, signOut }
 *
 * @example
 * ```typescript
 * const { user, session, isLoading, error, signOut } = useAuth();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!user) return <LoginPrompt />;
 * return <Dashboard user={user} onSignOut={signOut} />;
 * ```
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { authService } from "@/services/serviceFactory";
import type { User, Session, AuthState } from "@/types/auth";

/**
 * React hook for authentication state management.
 *
 * @returns {object} Auth state and methods
 * @returns {User | null} user - Current authenticated user or null
 * @returns {Session | null} session - Current session with tokens or null
 * @returns {boolean} isLoading - True while fetching initial auth state
 * @returns {string | null} error - Error message if auth operations fail
 * @returns {Function} signOut - Async function to sign out current user
 *
 * @sideeffects
 * - Subscribes to auth state changes (cleanup on unmount)
 * - Fetches user and session on mount
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  /**
   * Load initial auth state on component mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const [user, session] = await Promise.all([
          authService.getCurrentUser(),
          authService.getCurrentSession(),
        ]);

        setState({
          user,
          session,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load auth state";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
      }
    };

    initAuth();
  }, []);

  /**
   * Subscribe to auth state changes
   * Updates state when user logs in/out
   */
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setState((prev) => ({
        ...prev,
        user,
      }));
    });

    return () => unsubscribe();
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
      setState({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sign out";
      setState((prev) => ({
        ...prev,
        error: message,
      }));
    }
  }, []);

  return { ...state, signOut };
}
