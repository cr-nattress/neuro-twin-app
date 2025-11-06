# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Neural Twin App** is a full-stack Next.js application for creating and interacting with AI-powered digital personas. Users input information about themselves (text blocks + links), the system extracts structured persona data via OpenAI, and they can then chat with their AI twin.

**Tech Stack:** Next.js 16 + React 19 (frontend), Netlify Functions (serverless backend), Supabase (auth + storage), OpenAI API (persona extraction & chat)

---

## Common Commands

### Development
```bash
npm run dev              # Start Next.js dev server (localhost:3000)
npm run dev:clean       # Clean locks/ports and start dev server
npm run dev:force       # Dev with Turbopack enabled
npm run build           # Create production build
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking
```

### Key Development Notes
- **Dev Cleanup:** Use `npm run dev:clean` if you get "lock file already exists" or port conflicts. The script kills stale processes on ports 3000-3003 and cleans .next artifacts.
- **Netlify Dev:** Runs on port 8889 and proxies both UI and functions. Local API calls automatically route to the correct port.
- **Force Dynamic:** Root layout has `export const dynamic = "force-dynamic"` to ensure per-request auth checks.

---

## High-Level Architecture

### Data Flow

**Persona Creation Flow:**
```
User Input (Home page)
  → personaService.processPersona()
  → POST /.netlify/functions/process-persona
  → OpenAI extracts structured persona
  → User reviews PersonaReview component
  → handleSave() → POST /.netlify/functions/save-persona
  → Persona stored in Supabase with unique ID
```

**Chat Flow:**
```
User message (Chat page)
  → useChat.sendMessage()
  → POST /.netlify/functions/chat
  → Load persona from Supabase
  → OpenAI generates response with persona context
  → Display in MessageList component
```

**Authentication Flow:**
```
User email (Login page)
  → Supabase magic link sent
  → User clicks link with OTP
  → /auth/callback verifies OTP
  → Session persisted in cookies via middleware
  → Middleware protects routes (/ requires auth)
```

### Folder Structure Summary

```
app/                    # Next.js pages & layouts (App Router)
  auth/                 # Login & callback routes
  chat/                 # Chat page

components/             # React components
  chat/                 # ChatMessage, MessageList, ChatInput, etc.
  persona/              # TextBlockInput, PersonaReview
  ui/                   # shadcn/ui primitives (button, input, etc.)

hooks/                  # React hooks
  useAuth.ts            # Auth state & session
  usePersona.ts         # Persona fetching & caching
  useChat.ts            # Chat state & message sending

services/               # Business logic & service factory
  persona.service.ts    # Persona service interface
  auth.service.ts       # Auth service interface
  api/
    apiPersonaService.ts    # Implementation (calls Netlify)
    apiAuthService.ts       # Implementation (Supabase)

netlify/                # Serverless backend
  functions/
    process-persona.ts  # Extract persona from text (OpenAI)
    save-persona.ts     # Store persona JSON (Supabase)
    get-persona.ts      # Retrieve persona by ID
    list-personas.ts    # Paginated persona list
    chat.ts             # Generate chat response
    lib/                # Shared backend utilities
      base-handler.ts   # HTTP error handling & CORS
      validation.ts     # Zod schemas for input validation
      errors.ts         # 11 custom error types
      openai.ts         # OpenAI client with cache & retry
      supabase.ts       # Supabase operations
      logger.ts         # Structured logging

types/                  # TypeScript interfaces
  persona.ts            # Persona types & schemas

middleware.ts           # Auth guards & session refresh
```

### Key Integration Points

1. **Supabase:** Auth (magic link), Storage (persona JSON files), RLS policies
2. **OpenAI:** GPT model for persona extraction and chat responses
3. **Netlify:** Serverless functions, static hosting, environment secrets

---

## Critical Implementation Details

### Validation & Error Handling
- **Input validation:** Zod schemas in `netlify/functions/lib/validation.ts`
- **Error types:** 11 custom error classes in `netlify/functions/lib/errors.ts`
- **Constraints:**
  - Text blocks: max 10,000 chars each, max 50 blocks
  - Links: valid URLs, max 2,048 chars, max 50 links
  - Chat messages: role validation (user/assistant)

### Netlify Functions
- Base handler wraps all functions with CORS, error catching, logging
- Request validation using Zod before processing
- Structured JSON responses with error codes
- All functions use Web API Request/Response types (not Node.js)

### Service Factory Pattern
- `serviceFactory.ts` provides dependency injection
- Interfaces defined in `persona.service.ts` and `auth.service.ts`
- Implementations in `api/` folder separate concerns
- Allows easy testing by swapping service implementations

### Caching & Performance
- OpenAI responses cached for 24 hours in-memory
- Retry logic with exponential backoff (3 retries)
- Token usage tracked per call
- Dynamic rendering forced (no static generation)

### Environment Configuration
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend)
- `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` (backend/Netlify)
- Optional `NEXT_PUBLIC_AUTH_REDIRECT_URL` for deployed redirects
- Validation in `netlify/functions/lib/env.ts`

### Type Safety
- Full TypeScript with strict mode enabled
- Zod schemas for runtime validation
- Type inference from schemas using `z.infer<typeof Schema>`

---

## When Modifying Components

### Adding a New Page
1. Create file in `app/[route]/page.tsx`
2. Use `useAuth()` hook to check authentication
3. Implement loading & error states
4. Add `"use client"` if using client-side hooks/state

### Adding a New API Endpoint
1. Create function in `netlify/functions/[name].ts`
2. Import `baseHandler` and wrap your handler
3. Add Zod schema validation in `lib/validation.ts`
4. Add service method in `services/api/` if user-facing
5. Call via `fetch(/.netlify/functions/[name])` from frontend

### Modifying Persona Processing
- Main logic: `netlify/functions/process-persona.ts`
- OpenAI client: `netlify/functions/lib/openai.ts` (includes cache & retry)
- Validation: `netlify/functions/lib/validation.ts` → `PersonaInputSchema`

### Modifying Chat Functionality
- Chat hook: `hooks/useChat.ts` (message state & API calls)
- Endpoint: `netlify/functions/chat.ts` (response generation)
- Components: `components/chat/` (UI rendering)
- Load persona context from Supabase in chat.ts before generating response

---

## Testing & Debugging

### Local Testing
1. `npm run dev:clean` to start dev server
2. Test auth flow at `http://localhost:3000/auth/login`
3. Netlify functions accessible via `http://localhost:8889`
4. Check Supabase Studio for storage files and auth logs

### Debugging Netlify Functions
- Console logs appear in terminal output
- Logger utility in `netlify/functions/lib/logger.ts` for structured logs
- Check HTTP status codes in network tab
- Validate request/response formats match Zod schemas

### Type Checking
- Run `npm run type-check` to catch TypeScript errors
- Check `tsconfig.json` for path aliases like `@/*`

---

## Deployment Notes

### Prerequisites
- Supabase project with "personas" bucket created
- OpenAI API key with GPT-4 access
- Netlify project connected to GitHub

### Environment Setup on Netlify
```
SUPABASE_SERVICE_ROLE_KEY     (secret)
OPENAI_API_KEY                (secret)
NEXT_PUBLIC_AUTH_REDIRECT_URL (for OAuth redirects)
```

### Build & Deploy
- Deploy hook: GitHub push → Netlify automatic build
- Build command: `npm run build` (runs in netlify.toml)
- Functions deploy automatically from `netlify/` folder
- Static files from `.next` folder

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `middleware.ts` | Auth guards & session refresh on every request |
| `netlify/functions/lib/base-handler.ts` | HTTP wrapper for all functions |
| `netlify/functions/lib/validation.ts` | Zod schemas for all inputs |
| `netlify/functions/lib/openai.ts` | OpenAI client with cache & retry |
| `services/serviceFactory.ts` | Dependency injection container |
| `types/persona.ts` | All persona-related TypeScript types |
| `hooks/useAuth.ts` | Auth state (user, session, signOut) |
| `hooks/usePersona.ts` | Fetch & cache persona data |
| `hooks/useChat.ts` | Chat state & message management |

