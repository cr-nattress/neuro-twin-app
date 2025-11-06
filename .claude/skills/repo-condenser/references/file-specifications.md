# Repo Condenser - Output File Specifications

Detailed guide to each condensed file format and content.

## File: 00-README.md

**Purpose**: Instructions for using the condensed files in Claude Projects

**Contents**:
1. Quick overview of the project
2. How to use these files with Claude
3. File guide (brief description of each file)
4. Where to find original source (GitHub URL if available)
5. Tips for asking Claude about the codebase

**Size**: 2-5 KB typically

**Example**:
```markdown
# Condensed Neural Twin App Context

This folder contains condensed files from the Neural Twin App repository,
optimized for use with Claude Projects.

## How to Use

1. Add all .md files from this folder to Claude's file context
2. When asking questions, reference specific files:
   - "Based on 01-codebase-overview.md, how is authentication handled?"
   - "Using 02-core-modules.md, show me the persona service interface"
3. Ask follow-up questions to dig deeper

## Files Included

- **01-codebase-overview.md** - Architecture, structure, tech stack
- **02-core-modules.md** - Key components and APIs
- **03-configurations.md** - Dependencies and build configuration
- **04-documentation.md** - Getting started and guides

## Original Repository

https://github.com/username/repo
Last analyzed: [timestamp]
```

---

## File: 01-codebase-overview.md

**Purpose**: High-level understanding of the project structure and architecture

**Contents**:
1. Project description and purpose
2. Key statistics (language breakdown, file count)
3. Architecture overview (text diagram)
4. Directory structure with descriptions
5. Technology stack summary
6. Key data flows and relationships
7. Entry points and main execution paths

**Size**: 15-40 KB typically

**Structure**:
```markdown
# Codebase Overview

## Project Description
[2-3 sentence summary of what the project does]

## Statistics
- **Primary Language**: TypeScript (75%)
- **Total Files**: 127 (excluding node_modules)
- **Core Modules**: 12
- **External Dependencies**: 34

## Architecture
[ASCII art or text description of major components and their relationships]

## Directory Structure
```
app/
├── auth/ - Authentication pages (login, callback)
├── chat/ - Chat interface
└── page.tsx - Main persona creation form

components/
├── chat/ - Chat UI components
├── persona/ - Persona form components
└── ui/ - shadcn/ui primitives

services/
├── persona.service.ts - Persona API interface
└── api/ - Service implementations

netlify/functions/
├── lib/ - Shared utilities
├── process-persona.ts - OpenAI processing
└── save-persona.ts - Storage operations
```

## Technology Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Netlify Functions, Node.js 18
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Blob Storage
- **AI**: OpenAI GPT-4 API
- **Styling**: Tailwind CSS

## Key Flows
1. **Authentication**: Magic link via Supabase
2. **Persona Creation**: User input → OpenAI → Review → Save
3. **Chat**: Load persona → Send to OpenAI → Display response
```

---

## File: 02-core-modules.md

**Purpose**: Quick reference for main components, classes, and APIs

**Contents**:
1. List of core modules (grouped by domain/layer)
2. For each module:
   - File path
   - Purpose (1-2 sentences)
   - Main exports (functions, classes, interfaces)
   - Key dependencies
   - Example usage (if applicable)

**Size**: 20-50 KB typically

**Structure**:
```markdown
# Core Modules

## Authentication Services

### `services/auth.service.ts`
Service interface for authentication operations.

**Exports**:
- `IAuthService` - Interface with methods:
  - `sendMagicLink(email): Promise<SendMagicLinkResponse>`
  - `getCurrentUser(): Promise<User | null>`
  - `getCurrentSession(): Promise<Session | null>`
  - `signOut(): Promise<void>`

**Dependencies**: Supabase Auth

**Usage**: Implemented by `apiAuthService` in `services/api/apiAuthService.ts`

---

### `services/api/apiAuthService.ts`
Production authentication implementation using Supabase.

**Key Methods**:
- Sends magic link to user's email
- Retrieves current authenticated user
- Manages session state
- Listens for auth state changes

**Used by**: `useAuth` hook, Login page

---

## Persona Processing

### `netlify/functions/lib/openai.ts` (Singleton pattern)
OpenAI GPT client with caching and retry logic.

**Exports**:
- `extractPersona(input): Promise<PersonaExtractionResult>`
- `PersonaExtractionInput` - Type for input
- `PersonaExtractionResult` - Type for output

**Features**:
- Temperature: 0.3 (consistent but creative)
- Max tokens: 2000
- Retry logic: 3 attempts with exponential backoff
- Response caching: 24 hours

**Cost**: ~2-3 cents per persona extraction

**Dependencies**: OpenAI SDK v6, environment config

---

[Continue for each core module]
```

---

## File: 03-configurations.md

**Purpose**: Inventory of dependencies, build settings, and configuration

**Contents**:
1. Dependencies list (name, version, purpose)
2. Build configuration (tsconfig, next.config, etc.)
3. Environment variables required
4. Development scripts
5. Deployment configuration
6. Optional dependencies or feature flags

**Size**: 10-30 KB typically

**Structure**:
```markdown
# Configurations & Dependencies

## Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.0.1 | React framework |
| react | 19.2.0 | UI library |
| @supabase/ssr | ^0.x.x | Supabase authentication |
| openai | 6.8.1 | OpenAI API client |
| zod | 4.1.12 | Input validation |
| tailwindcss | 4.1.16 | Utility CSS framework |

## Development Dependencies

| Package | Purpose |
|---------|---------|
| typescript | 5.9.3 | Type checking |
| eslint | Linting |
| prettier | Code formatting |

## Build Configuration

### tsconfig.json
- Target: ES2020
- Module: ESNext
- Strict mode: enabled
- Path aliases: `@/*` → `./`

### next.config.mjs
- React strict mode: enabled
- Image optimization: enabled
- Dynamic rendering: force-dynamic

### netlify.toml
- Build command: `npm run build`
- Functions directory: `netlify/functions/`
- Publish directory: `.next/`
- Node bundler: esbuild

## Environment Variables

**Required (Frontend)**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key for browser clients

**Required (Backend)**:
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin access)
- `OPENAI_API_KEY` - OpenAI API key

**Optional**:
- `NEXT_PUBLIC_AUTH_REDIRECT_URL` - For Netlify deployment
- `LOG_LEVEL` - Logging level (debug|info|error)
- `NODE_ENV` - development|production

## Development Scripts

```bash
npm run dev              # Start dev server (port 3000)
npm run dev:clean       # Clean and start dev server
npm run build           # Production build
npm run start           # Start production server
npm run type-check      # TypeScript validation
npm run lint            # ESLint check
```

## Deployment

Deployed on **Netlify**:
- Automatic builds on GitHub push
- Environment secrets configured in Netlify dashboard
- Functions auto-deploy from netlify/functions/
- Static files from .next/ directory

## Feature Flags

None currently configured. See `netlify/functions/lib/env.ts` for adding.
```

---

## File: 04-documentation.md

**Purpose**: Essential guides and documentation extracted from README/docs

**Contents**:
1. Quick start guide
2. Project structure explanation
3. Common development tasks
4. Deployment steps
5. Troubleshooting
6. Contributing guidelines
7. References to full documentation

**Size**: 15-40 KB typically

**Structure**:
```markdown
# Documentation Summary

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key

### Setup
```bash
git clone <repo>
cd neural-twin-app
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

Open http://localhost:3000

## Project Structure Explained

**Frontend** (app/, components/, hooks/):
- Next.js pages for auth and UI
- React components for forms and chat
- Custom hooks for state management

**Backend** (netlify/functions/):
- Serverless functions as API endpoints
- Shared utilities in lib/ folder
- Error handling and validation

**Data**:
- Supabase for auth and blob storage
- Persona JSON files stored as blobs
- In-memory caching for responses

## Common Development Tasks

### Add a new API endpoint
1. Create file in `netlify/functions/[name].ts`
2. Use `createHandler()` wrapper
3. Add validation schema in `lib/validation.ts`
4. Call from frontend via fetch

### Modify persona extraction
1. Edit OpenAI prompt in `lib/openai.ts`
2. Update `PersonaSchema` if output structure changes
3. Test with different inputs

### Update UI components
1. Edit `.tsx` files in `components/`
2. Run `npm run dev` to hot reload
3. Use existing Tailwind classes for styling

## Deployment

### To Netlify
1. Connect GitHub repo to Netlify
2. Set environment variables:
   - SUPABASE_SERVICE_ROLE_KEY
   - OPENAI_API_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
3. Push to main branch
4. Deploy automatically triggers

### Supabase Setup
1. Create "personas" bucket in Storage
2. Set bucket to private
3. Create RLS policy for authenticated users

## Troubleshooting

**Issue**: Functions return 502 Bad Gateway
**Solution**: Check Netlify function logs, verify environment variables

**Issue**: Magic link not working
**Solution**: Verify Supabase auth settings, check email domain

**Issue**: Persona not saving
**Solution**: Verify service role key permissions, check bucket exists

## Contributing

1. Create feature branch from main
2. Make changes and test locally
3. Submit PR with description
4. Ensure tests pass and linting succeeds

## Full Documentation

See full README.md and CLAUDE.md in repository root.
```

---

## Optional Files

### 05-database-schema.md
For projects with databases, include:
- Table definitions
- Field types and constraints
- Relationships between tables
- Indexes and performance notes

### 06-api-endpoints.md
If API-heavy project:
- Endpoint paths and methods
- Request/response schemas
- Authentication requirements
- Rate limits

### 07-testing-guide.md
If significant test suite:
- How to run tests
- Test structure and patterns
- Coverage goals
- Common test scenarios

---

## Size Guidelines

- **00-README.md**: 2-5 KB
- **01-overview**: 15-40 KB (critical)
- **02-modules**: 20-50 KB (critical)
- **03-config**: 10-30 KB (critical)
- **04-docs**: 15-40 KB (critical)
- **Optional files**: 10-30 KB each

**Total target**: Under 150 KB for most projects

---

## Content Best Practices

### Keep
- Public APIs and function signatures
- Architecture diagrams (ASCII art)
- Configuration values
- Essential documentation
- Relationships between modules
- Error handling approach

### Remove
- Full source code
- Comments (extract meaning into structure)
- Test code and test utilities
- Generated documentation
- Verbose prose (use bullet points)
- Implementation details that don't affect understanding

### Simplify
- Replace long lists with tables
- Use references (file paths, line numbers) instead of code
- Consolidate related concepts
- Show structure, not implementation
