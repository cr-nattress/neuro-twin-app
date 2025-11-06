# TSDoc Tag Reference

Complete guide to JSDoc/TSDoc tags used by the code-comments skill.

## Overview

TSDoc is the typed documentation standard for TypeScript and JavaScript. The skill uses these tags to create AI-friendly documentation.

## File-Level Tags

### @module
Describes the purpose and content of a module/file.

**Usage:**
```typescript
/**
 * @module netlify/functions/lib/openai
 * @purpose OpenAI client with built-in caching and retry logic
 * @context Used by persona processing and chat functions
 * @dependencies openai SDK v6+, Zod
 */
```

**Attributes:**
- `@module [path]` - Relative path from project root
- `@purpose` - Why this module exists (1-2 sentences)
- `@context` - Where/when it's used
- `@dependencies` - External APIs, libraries, or services

### @exports
Describes public API surface of the module.

```typescript
/**
 * @module ./persona.service
 * @exports PersonaService - Main service interface
 * @exports apiPersonaService - Default implementation
 * @exports PersonaServiceError - Custom error type
 */
```

## Class & Interface Tags

### @class
Summarize a class definition.

```typescript
/**
 * @class OpenAIClient
 * @purpose Wrapper around OpenAI SDK with caching and retry logic
 * @pattern Singleton with in-memory cache
 * @assumes Only one instance created per application lifecycle
 */
export class OpenAIClient { ... }
```

**Attributes:**
- `@class [name]` - Class name (auto-detected)
- `@purpose` - Why this class exists
- `@pattern` - Design pattern (Singleton, Factory, Adapter, Observer, etc.)
- `@assumes` - Preconditions and invariants

### @interface
Summarize an interface definition.

```typescript
/**
 * @interface PersonaServiceInterface
 * @purpose Contract for persona data access and processing
 * @describes Abstracts implementation details (API, database, cache)
 */
export interface PersonaService { ... }
```

### @pattern
Document the design pattern used.

```typescript
/**
 * @pattern Adapter
 * Adapts Supabase SDK to generic StorageService interface
 * enabling future storage backend swaps.
 */
```

Common patterns:
- Singleton
- Factory
- Adapter
- Strategy
- Observer
- Decorator
- Command
- Repository

### @assumes
Document preconditions and invariants the code relies on.

```typescript
/**
 * @assumes
 * - Auth middleware has already verified user session
 * - personaId is UUID format (validated upstream)
 * - Supabase "personas" bucket exists and is readable
 */
```

## Function & Method Tags

### @param
Document a function parameter.

**Format:**
```typescript
/**
 * @param paramName - Description of what this parameter is/does
 * @param [optionalParam] - Optional parameter description
 * @param {...restParams} - Rest parameter description
 */
function doSomething(paramName: string, optionalParam?: number, ...rest: string[]): void { ... }
```

**For complex types:**
```typescript
/**
 * @param payload - User input with the following structure:
 *   - `textBlocks` (string[]): Self-descriptions, max 10k chars each
 *   - `links` (string[]): Valid URLs, max 2k chars each
 * @param options - Configuration object with optional properties
 */
```

### @returns
Document the return value.

```typescript
/**
 * @returns Promise resolving to the extracted Persona object with traits,
 * interests, and communication style inferred from user input.
 */
export async function processPersona(payload: PersonaInput): Promise<Persona> { ... }
```

### @throws
Document exceptions that can be thrown.

```typescript
/**
 * @throws {ValidationError} if input fails Zod schema validation
 * @throws {OpenAIError} if OpenAI API call fails
 * @throws {StorageError} if Supabase save operation fails
 */
export async function savePersona(persona: Persona): Promise<{ id: string }> { ... }
```

### @deprecated
Mark functions/methods as deprecated.

```typescript
/**
 * @deprecated Use {@link newFunction} instead. Old approach had race conditions.
 * Will be removed in v2.0.0.
 */
```

### @example
Provide a minimal working example.

```typescript
/**
 * @example
 * const persona = await processPersona({
 *   textBlocks: ["I'm a full-stack developer..."],
 *   links: ["https://github.com/myprofile"]
 * });
 * console.log(persona.traits); // ["innovative", "collaborative", ...]
 */
export async function processPersona(payload: PersonaInput): Promise<Persona> { ... }
```

### @decision
Document a significant architectural or algorithmic choice.

```typescript
/**
 * @decision Use GPT-4 over gpt-3.5-turbo despite 5x cost/latency.
 * Tradeoff: Accuracy vs. Speed. Persona extraction requires semantic understanding.
 * Mitigation: Cache responses for 24 hours; refresh via hourly cron job.
 */
```

### @sideeffects
Document IO operations and external state mutations.

```typescript
/**
 * @sideeffects
 * - Calls OpenAI API (network IO, token billing)
 * - Uploads JSON to Supabase Storage (object creation)
 * - Logs usage metrics to structured logger
 */
export async function savePersona(persona: Persona): Promise<void> { ... }
```

**IO categories:**
- Network: API calls, HTTP requests
- Storage: Database writes, file system, cloud storage
- Environment: process.env mutations, config changes
- Timers: setTimeout, setInterval, scheduled jobs
- State: Global variables, singletons, caches

### @remarks
Add additional context or notes.

```typescript
/**
 * @remarks
 * This function uses exponential backoff for retries (3 attempts max).
 * See {@link OPENAI_RETRY_STRATEGY} for configuration.
 */
export async function callOpenAI(prompt: string): Promise<string> { ... }
```

### @internal
Mark a function/class as internal (not part of public API).

```typescript
/**
 * @internal
 * Used only by savePersona() to parse OpenAI response.
 * Do not call directly; API may change without warning.
 */
function parseOpenAIResponse(response: ChatCompletion): Persona { ... }
```

## Special Tags

### @ai-metadata
Yaml metadata block for pattern-specific documentation (validators, mappers, adapters).

```typescript
/**
 * Zod validator for persona input.
 *
 * ai-metadata:
 *   pattern: Zod Validator
 *   validates: PersonaInput
 *   throws: ZodError
 *   example: personaInputSchema.parse(data)
 */
export const personaInputSchema = z.object({
  textBlocks: z.array(z.string()),
  links: z.array(z.string().url())
});
```

### @todo
Mark incomplete documentation or uncertain inferences.

```typescript
/**
 * @todo Verify whether this caches across server restarts.
 * Current implementation uses in-memory Map; unclear if per-process or per-machine.
 */
```

## Documentation Hierarchy

### Full Function Block Example

```typescript
/**
 * @module services/api/apiPersonaService
 * @purpose Fetch and cache persona data from Netlify Functions API
 * @dependencies supabase, fetch API, Zod validation
 */

/**
 * Fetch a persona by ID and cache result for performance.
 *
 * Calls the get-persona serverless function and validates response against
 * the Persona schema. Caches for 5 minutes to reduce API calls.
 *
 * @param personaId - UUID of the persona to retrieve
 * @param options - Optional cache bypass and timeout settings
 * @param options.bypassCache - Force fresh fetch (default: false)
 * @param options.timeout - Request timeout in ms (default: 5000)
 *
 * @returns Promise resolving to Persona object with all fields populated
 *
 * @throws {ValidationError} if API response doesn't match Persona schema
 * @throws {NotFoundError} if persona doesn't exist (HTTP 404)
 * @throws {TimeoutError} if request exceeds configured timeout
 *
 * @decision Cache for 5 minutes even if persona might change elsewhere.
 * Tradeoff: Eventual consistency vs. freshness. Personas change rarely;
 * optimization prevents redundant API calls.
 *
 * @sideeffects
 * - Network call to /.netlify/functions/get-persona
 * - In-memory cache update (cleared after 5 minutes)
 *
 * @example
 * const persona = await getPersona("550e8400-e29b-41d4-a716-446655440000");
 * console.log(persona.traits); // ["innovative", "curious", ...]
 *
 * // Bypass cache for fresh data
 * const fresh = await getPersona(personaId, { bypassCache: true });
 */
export async function getPersona(
  personaId: string,
  options?: { bypassCache?: boolean; timeout?: number }
): Promise<Persona> {
  // Implementation...
}
```

## Common Patterns

### Validator Functions
```typescript
/**
 * Validate persona input against schema.
 *
 * ai-metadata:
 *   pattern: Zod Validator
 *   validates: PersonaInput
 *   throws: ZodError with detailed field errors
 *
 * @param data - Untrusted input to validate
 * @returns Valid PersonaInput
 * @throws {ZodError} with field-level error details if validation fails
 */
```

### Adapter Functions
```typescript
/**
 * Adapt Netlify HandlerEvent to standard Web API Request.
 *
 * @pattern Adapter
 * Converts Netlify-specific event structure to standard fetch API Request,
 * enabling framework-agnostic handler code.
 *
 * @param event - Netlify HandlerEvent from function invocation
 * @returns Web API Request object ready for handler processing
 */
```

### Cache Functions
```typescript
/**
 * Cache OpenAI responses with TTL-based expiration.
 *
 * @decision Use in-memory cache despite process restarts.
 * Tradeoff: Simplicity vs. persistence. Most responses are deterministic;
 * cache misses on restart are acceptable.
 *
 * @sideeffects Mutates in-memory cache Map; keeps references until TTL expires
 */
```

## Links & References

Use `{@link}` for cross-referencing:

```typescript
/**
 * See {@link ProcessPersonaFunction} for the OpenAI integration.
 * Configuration defined in {@link OPENAI_CONFIG}.
 * For examples, see {@link examples/persona-creation.md}
 */
```

## Validation

Run type checks to ensure TSDoc is well-formed:

```bash
npx tsc --noEmit
npx eslint . --ext .ts,.tsx
```

Some IDEs (VS Code, JetBrains) provide real-time TSDoc validation with warnings.
