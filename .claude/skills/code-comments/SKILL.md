---
name: code-comments
description: Automatically add and update JSDoc/TSDoc comments and intent documentation throughout a TypeScript/JavaScript codebase to improve AI-agent comprehension. Use when you want to enhance code documentation for future AI assistants without changing runtime behavior. Useful for making complex codebases easier for agents to understand decisions, side effects, and APIs.
---

# Code Comments

Add intelligent, AI-friendly JSDoc/TSDoc blocks and inline comments to improve code comprehension for AI agents without altering runtime behavior.

## Overview

This skill scans your TypeScript/JavaScript codebase and inserts:
- **File headers** - Purpose, context, dependencies, and exports
- **Class/interface blocks** - Patterns, assumptions, side effects
- **Function docblocks** - Parameters, returns, decisions, examples
- **Inline intent comments** - Only where reasoning isn't obvious (concurrency, caching, retries)

All changes are **documentation-only** with zero impact on logic or public APIs.

## Quick Start

1. **Run the skill** - Activate from Claude Code Skills menu
2. **Configure density** - Choose `minimal`, `balanced` (recommended), or `max-intent`
3. **Review generated comments** - Check for accuracy before committing
4. **Commit documentation changes** - Optional branch and PR support

## Configuration

Key options (see `references/config-guide.md` for all 15+ parameters):

- `comment_density_target`: `minimal` | `balanced` (default) | `max-intent`
- `include_examples`: Add `@example` blocks for public functions (default: true)
- `adr_inline_notes`: Insert decision notes for tradeoffs (default: true)
- `side_effects_documentation`: Document IO side effects (default: true)
- `create_branch`: Create feature branch for changes (default: true)
- `open_pull_request`: Open PR for review (default: false)

## Workflow

### Phase 1: Analysis
Scan project structure, detect TypeScript/JavaScript tooling, build symbol map of modules and exports.

### Phase 2: Documentation
For each source file:
1. Insert file-level `@module` block (purpose, context, dependencies)
2. Add class/interface docblocks with `@pattern`, `@assumes`, `@sideeffects`
3. Add function docblocks with parameters, returns, `@decision`, optional `@example`
4. Insert minimal inline comments for intent and edge cases only

### Phase 3: Validation
Run TypeScript compiler, ESLint, and Prettier. Generate changeset summary.

### Phase 4: Integration
Optionally create branch and/or PR for code review.

## Style Guide

### Documentation Hierarchy

```
1) File header (@module)    ← Purpose, context, exports, dependencies
2) Class/interface blocks   ← Summary, pattern, assumptions, side effects
3) Function docblocks       ← Params, returns, throws, decision, example
4) Inline comments          ← Only for non-obvious intent and edge cases
```

### Preferred JSDoc/TSDoc Tags

- `@module` - File-level purpose and exports
- `@purpose` - Why this exists
- `@pattern` - Singleton, Adapter, Observer, etc.
- `@assumes` - Preconditions and invariants
- `@sideeffects` - IO: network, storage, timers, env mutations
- `@decision` - Key tradeoff or architectural choice
- `@example` - Minimal working example

See `references/tsdoc-guide.md` for complete tag reference.

### Comment Density

**balanced** (~1–3 blocks per 100 LOC):
- Essential file headers for all modules
- Docblocks for exported functions and classes only
- Inline comments only where logic isn't obvious

**minimal** (headers + exports only):
- File headers with module purpose
- Public function/class docblocks only
- No inline comments

**max-intent** (comprehensive):
- All of balanced, plus
- Docblocks for all functions (public and private)
- Inline comments for every non-trivial decision

## Output

The skill produces:

1. **Updated source files** - With docblocks and intent comments added/refreshed
2. **CHANGESUMMARY.md** - Per-file stats and examples of changes
3. **Optional branch** - Named `chore/ai-friendly-comments` (configurable)
4. **Optional PR** - With pre-filled title and description

## Rules

These constraints ensure documentation integrity:

- **Never change runtime logic** - Comments only, no code changes
- **Preserve public APIs** - No renaming, no signature changes
- **Keep comments truthful** - Infer carefully; mark uncertainty with TODO
- **Maintain formatting** - Run prettier at end
- **Prefer concise prose** - Signal over verbosity

## Example

### Before

```typescript
export function processPersona(payload: PersonaInput): Promise<Persona> {
  const result = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: JSON.stringify(payload) }]
  });
  return parsePersona(result.choices[0].message.content);
}
```

### After

```typescript
/**
 * @module persona processor
 * @purpose Extract structured persona data from user input via OpenAI
 * @dependencies OpenAI API client, Zod validation
 */

/**
 * Transform unstructured user input into a structured persona object.
 *
 * Calls OpenAI GPT-4 with persona extraction prompt and parses response.
 *
 * @param payload - User input (text blocks + links) with validated structure
 * @returns Extracted persona with traits, interests, communication style
 * @throws AppError if OpenAI API fails or response parsing fails
 *
 * @decision Use GPT-4 over gpt-3.5-turbo for better persona understanding
 * despite higher latency (tradeoff: accuracy vs. speed)
 *
 * @example
 * const persona = await processPersona({
 *   textBlocks: ["I'm a developer..."],
 *   links: ["https://github.com/..."]
 * });
 */
export async function processPersona(payload: PersonaInput): Promise<Persona> {
  // Call OpenAI with persona extraction system prompt (caching reduces latency)
  const result = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: JSON.stringify(payload) }]
  });

  // Parse response with type validation; throw if malformed
  return parsePersona(result.choices[0].message.content);
}
```

## Next Steps

1. Run the skill with defaults (balanced density recommended)
2. Review CHANGESUMMARY.md for examples and TODOs
3. Inspect generated docblocks for accuracy
4. Adjust parameters if needed and re-run on specific files
5. Merge branch/PR when satisfied

See `references/` directory for detailed guides on configuration, TSDoc conventions, and troubleshooting.
