# Code Comments Skill - Configuration Guide

Complete reference for all configuration parameters.

## Core Parameters

### `comment_density_target` (string, default: "balanced")

Controls how many comments are added relative to code volume.

| Value | Coverage | Use When |
|-------|----------|----------|
| `minimal` | File headers + public functions only | Legacy codebases where minimal context helps |
| `balanced` | Essential headers + classes + exported functions | Most projects (recommended) |
| `max-intent` | All functions + extensive inline comments | Complex algorithms, concurrent code, caching |

**Relationship to LOC:**
- `minimal`: 0.5–1 block per 100 LOC
- `balanced`: 1–3 blocks per 100 LOC
- `max-intent`: 3–8 blocks per 100 LOC

### `include_examples` (boolean, default: true)

Add `@example` blocks for public functions and classes.

- `true`: Include minimal working examples in docblocks
- `false`: Skip examples (useful if examples are in separate `examples/` directory)

### `adr_inline_notes` (boolean, default: true)

Insert Architecture Decision Record (ADR) style inline comments near significant tradeoffs.

Example:
```typescript
// ADR-001: Cache responses for 24h despite stale data risk.
// Tradeoff: Accuracy vs. Performance. Persona refreshes hourly via cron.
const cachedPersona = cache.get(personaId);
```

### `add_ai_metadata_blocks` (boolean, default: true)

Insert YAML `ai-metadata` blocks for validators, mappers, adapters, and other pattern-specific code.

Example:
```typescript
/**
 * ai-metadata:
 *   pattern: Zod Validator
 *   validates: PersonaInput
 *   throws: ZodError
 */
export const personaInputSchema = z.object({ ... });
```

### `side_effects_documentation` (boolean, default: true)

Add `@sideeffects` blocks documenting IO operations:
- Network calls (fetch, axios, OpenAI API)
- Storage mutations (Supabase, localStorage, fs)
- Environment mutations (process.env, config changes)
- Timers and background jobs

### `enforce_tsdoc` (boolean, default: true)

Normalize JSDoc tags to TSDoc convention for TypeScript projects.

| JSDoc | TSDoc |
|-------|-------|
| `@returns` | `@returns` (no change) |
| `@throws` | `@throws` (no change) |
| `@param {type} name` | `@param name - Description` |
| `@author` | (removed; use git blame) |

## Scope Parameters

### `languages` (string, default: "ts,tsx,js,jsx,mts,cts")

Comma-separated file extensions to process.

Common values:
- `"ts,tsx"` - TypeScript only
- `"ts,tsx,js,jsx"` - TypeScript + JavaScript
- `"ts,tsx,js,jsx,mts,cts,cjs,mjs"` - All JS variants

### `exclude_globs` (string, default: "**/node_modules/**,**/dist/**,**/build/**,**/.next/**,**/coverage/**,**/*.min.*")

Glob patterns to skip (e.g., generated, minified, or dependencies).

Add patterns separated by commas:
```
**/node_modules/**,**/dist/**,**/*.test.ts,**/fixtures/**
```

### `max_file_size_kb` (integer, default: 600)

Skip files larger than this threshold (avoids bundled assets, large generated files).

Typical thresholds:
- `200` - Only small hand-written files
- `600` - Most source files (recommended)
- `2000` - Include large modules

## Output & Integration Parameters

### `create_branch` (boolean, default: true)

Create a Git branch for changes.

- `true`: Branch named per `branch_name` (default: `chore/ai-friendly-comments`)
- `false`: Modify working directory only; manual commit required

### `branch_name` (string, default: "chore/ai-friendly-comments")

Name of feature branch if `create_branch=true`.

Use branch naming convention of your project:
- `docs/comments-update`
- `chore/ai-readable-code`
- `refactor/add-docblocks`

### `open_pull_request` (boolean, default: false)

Automatically open a PR after creating branch.

- `true`: Creates PR with pre-filled `pr_title` and `pr_body`
- `false`: Branch only; manual PR creation

**Note:** Requires `create_branch=true`.

### `pr_title` (string)

Title for auto-created PR.

Default: `"docs: add AI‑friendly code comments (JSDoc/TSDoc, intent, decisions)"`

### `pr_body` (string)

Description for auto-created PR. Supports markdown.

Default includes:
- Summary of changes (JSDoc/TSDoc, intent comments, examples)
- No logic changes; documentation-only
- Link to CHANGESUMMARY.md

Customize to reference your project's contribution guidelines or review process.

## Advanced Parameters

### Comment Style Options

**Intent comment format** (inline):
```typescript
// Guard against double refresh; mutex held by parent scope
if (alreadyRefreshing) return;
```

vs.

```typescript
// Check if already refreshing
if (alreadyRefreshing) return;
```

The skill prefers high-signal intent ("why/when") over restating code.

### Examples in Docblocks

**minimal** (one-liner):
```typescript
/**
 * @example
 * const persona = await processPersona({ textBlocks: [...], links: [...] });
 */
```

**balanced** (realistic usage):
```typescript
/**
 * @example
 * const input = {
 *   textBlocks: ["I'm a full-stack developer..."],
 *   links: ["https://github.com/myprofile"]
 * };
 * const persona = await processPersona(input);
 * console.log(persona.traits); // ["innovative", "collaborative"]
 */
```

### File Header Components

All `@module` blocks include (if applicable):
- **Purpose** - What the module does
- **Context** - Where/when it's used
- **Dependencies** - External libraries or services
- **Exports** - Public API surface

Example:
```typescript
/**
 * @module netlify/functions/lib/openai
 * @purpose OpenAI client with caching, retry logic, and token tracking
 * @context Used by all persona processing and chat functions
 * @dependencies openai SDK v6+, Zod validation
 */
```

## Preset Configurations

### Preset: "Quick Polish" (for PRs)
```
comment_density_target: minimal
include_examples: false
adr_inline_notes: false
add_ai_metadata_blocks: false
side_effects_documentation: false
create_branch: true
open_pull_request: true
```
Fast, lightweight documentation pass; good for code reviews.

### Preset: "Balanced" (recommended)
```
comment_density_target: balanced
include_examples: true
adr_inline_notes: true
add_ai_metadata_blocks: true
side_effects_documentation: true
create_branch: true
open_pull_request: false
```
Comprehensive but maintainable; most projects.

### Preset: "Agent-Friendly" (for AI navigation)
```
comment_density_target: max-intent
include_examples: true
adr_inline_notes: true
add_ai_metadata_blocks: true
side_effects_documentation: true
create_branch: true
open_pull_request: false
```
Maximum signal for AI agents; prepare for dense comments.

## Example Configurations

### API-Heavy Project
```
comment_density_target: balanced
include_examples: true
add_ai_metadata_blocks: true  # Document request/response handlers
side_effects_documentation: true  # Document all API calls
adr_inline_notes: true  # Document API design choices
```

### Legacy Codebase (gradual improvement)
```
comment_density_target: minimal
include_examples: false
create_branch: true
open_pull_request: false  # Review first, merge manually
```

### Concurrent/Cache-Heavy Code
```
comment_density_target: max-intent
adr_inline_notes: true  # Document sync primitives, cache strategies
side_effects_documentation: true  # Track state mutations
include_examples: true
```

## Troubleshooting

**Q: Comments are too verbose**
- A: Lower `comment_density_target` to `minimal` or filter with `languages` and `exclude_globs`

**Q: Docblocks missing @example blocks**
- A: Ensure `include_examples: true` and function is exported

**Q: Want to re-run skill on specific files only**
- A: Not yet supported; manually edit CHANGESUMMARY.md and re-run, or use `exclude_globs` to target directories

**Q: Comments seem inaccurate**
- A: Review CHANGESUMMARY.md for TODOs and uncertainty markers; edit manually as needed
