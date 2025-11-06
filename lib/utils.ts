/**
 * @module lib/utils
 *
 * General utility functions for UI components and formatting.
 *
 * @context
 * - Used throughout React components for styling and formatting
 * - cn() is the most frequently used utility for conditional Tailwind classes
 *
 * @dependencies
 * - clsx: Conditional class name builder
 * - tailwind-merge: Merges Tailwind classes intelligently (handles conflicts)
 *
 * @exports
 * - cn: Combines and merges Tailwind classes
 * - delay: Promise-based setTimeout wrapper
 * - formatDate: Formats ISO dates for display
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges Tailwind CSS class names intelligently.
 *
 * @param {...ClassValue[]} inputs - Class names, objects, or arrays
 * @returns {string} Merged class string with conflicts resolved
 *
 * @decision Uses tailwind-merge to handle Tailwind class conflicts (e.g., "px-4 px-2"
 * becomes "px-2"). Without this, conflicting classes would both apply.
 *
 * @example
 * ```typescript
 * cn("px-4 py-2", isActive && "bg-blue-500", className)
 * // Output: "px-4 py-2 bg-blue-500 custom-class"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a Promise that resolves after a specified delay.
 *
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>} Promise that resolves after delay
 *
 * @example
 * ```typescript
 * await delay(1000); // Wait 1 second
 * console.log("Delayed execution");
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Formats an ISO date string or Date object for human-readable display.
 *
 * @param {string | Date} date - ISO date string or Date object
 * @returns {string} Formatted date (e.g., "January 15, 2024")
 *
 * @example
 * ```typescript
 * formatDate("2024-01-15T00:00:00Z") // "January 15, 2024"
 * ```
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
