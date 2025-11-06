---
name: repo-condenser
description: Intelligently analyze and condense a repository into a compact set of files optimized for Claude Projects upload. Use when you need to extract the essential structure, code, and documentation from a codebase into 4-8 condensed files that preserve understanding while minimizing size. Useful for sharing projects with Claude or creating project context for AI assistants.
---

# Repo Condenser

Analyze a repository and create a condensed, Claude Projects-optimized set of files that capture the essential structure and information needed to understand a codebase.

## Overview

This skill scans a complete repository and produces:
- **Consolidated architecture overview** - How the code is organized
- **Core modules summary** - Key components and their purposes
- **Configuration inventory** - Dependencies, settings, build scripts
- **Documentation digest** - Essential docs and guides
- **4-8 optimized files** - Ready for Claude Projects

All original files remain untouched. Output goes to `/claude-context` folder.

## Quick Start

1. **Run the skill** - Activate from Claude Code Skills menu
2. **Configure scope** (optional):
   - `target_directory`: Which repo to analyze (default: current dir)
   - `output_folder`: Where to put condensed files (default: `claude-context`)
   - `max_files`: Target number of condensed files (default: 6)
3. **Review output** - Examine files in `/claude-context`
4. **Upload to Claude** - Add these files to Claude Projects context

## How It Works

### Phase 1: Analyze
Scan entire repository:
- Identify all file types and structure
- Parse code for functions, classes, exports
- Detect dependencies and relationships
- Categorize files as core, config, docs, generated, or ignore

### Phase 2: Extract
Pull essential information:
- Module names, purposes, and relationships
- Public APIs and key functions
- Configuration items and versions
- Documentation and guides
- Build/deployment scripts

### Phase 3: Condense
Create optimized files:
- Remove redundant code (deduplicate utilities)
- Condense large files to structure only
- Reference paths instead of full contents
- Consolidate similar items (configs, dependencies)
- Target 4-8 files, each <100KB

### Phase 4: Output
Generate `/claude-context` folder:
- `00-README.md` - How to use these files with Claude
- `01-codebase-overview.md` - Architecture and structure
- `02-core-modules.md` - Key components and APIs
- `03-configurations.md` - Dependencies, config, build
- `04-documentation.md` - Guides and essential docs
- `[additional].md` - Topic-specific files as needed

## Configuration

### Target Directory
```
target_directory: "."  # Default: current directory
                 | "/path/to/repo"
                 | "../another-project"
```

### Output Folder
```
output_folder: "claude-context"  # Default folder name
            | "project-context"
            | ".claude-context"
```

### Max Files
```
max_files: 6  # Target number of condensed files (4-10 typical range)
```

### Include/Exclude Patterns
```
include_patterns: ["src/**", "app/**", "lib/**"]  # Only these folders
exclude_patterns: ["**/*.test.ts", "**/dist/**"]  # Skip these
ignore_dotfiles: true  # Ignore .* files (default: true)
```

### Verbosity
```
verbosity: "normal"  # "quiet" | "normal" | "verbose"
```

## What Gets Condensed

### Code Files
- **Keep**: Function/class names, signatures, public APIs
- **Remove**: Non-essential comments, test code, boilerplate
- **Reference**: File paths and line numbers instead of full code
- **Extract**: Dependencies, imports, and relationships

### Configuration Files
- **Keep**: All config values (package.json, tsconfig.json, etc.)
- **Consolidate**: Related configs into single file
- **Extract**: Version numbers, key settings

### Documentation
- **Keep**: READMEs, guides, architecture docs
- **Summarize**: Long docs into key points with references
- **Extract**: Quick start, API docs, deployment guides

### Ignored by Default
- Generated files (`dist/`, `build/`, `.next/`)
- Dependencies (`node_modules/`)
- Version control (`.git/`)
- Compiled code (`.o`, `.pyc`)
- Lock files are analyzed but not included verbatim
- Test files (optional, can be included)

## Example Output Structure

```
/claude-context/
├── 00-README.md
│   └── Instructions for using files with Claude
│
├── 01-codebase-overview.md
│   ├── Project description
│   ├── Architecture diagram (text)
│   ├── Directory structure
│   ├── Key modules and relationships
│   └── Technology stack
│
├── 02-core-modules.md
│   ├── Main services/components
│   ├── Public APIs (functions, classes, interfaces)
│   ├── Key imports and dependencies
│   └── Module interdependencies
│
├── 03-configurations.md
│   ├── Dependencies (package.json, requirements.txt)
│   ├── Build configuration (tsconfig, webpack, etc.)
│   ├── Environment variables
│   ├── Deployment config
│   └── Scripts and commands
│
├── 04-documentation.md
│   ├── Getting started
│   ├── Project structure explanation
│   ├── Development workflow
│   ├── Deployment steps
│   └── Contributing guidelines
│
└── 05-database-schema.md [optional]
    └── If project uses databases
```

## Output Summary

After condensing, you'll receive:

```
Repository Analysis Complete
============================
Files analyzed: 342
Size before: 127 MB (node_modules excluded)
Size after: 2.4 MB (condensed files)

Files created in /claude-context/:
✓ 00-README.md (4.2 KB)
✓ 01-codebase-overview.md (18 KB)
✓ 02-core-modules.md (34 KB)
✓ 03-configurations.md (12 KB)
✓ 04-documentation.md (22 KB)

Included:
✓ Source code structure and APIs
✓ Configuration and dependencies
✓ Architecture documentation
✓ 5 core modules summarized

Excluded:
✗ node_modules/ (345MB)
✗ dist/, build/ (generated)
✗ .git/ (version control)
✗ Test files (optional: can include with config)

Upload to Claude Projects:
1. Copy all files from /claude-context/
2. Add to Claude Projects file context
3. Reference files in conversation for code analysis
```

## Usage in Claude Projects

Once uploaded, reference the files in your prompts:

```
Based on the codebase in /claude-context/:
- 01-codebase-overview.md describes the architecture
- 02-core-modules.md lists the main components
- 03-configurations.md shows dependencies

[Your question about the codebase]
```

## Advanced Options

### Preserve Test Files
```
include_patterns: ["src/**", "**/*.test.ts"]  # Include tests
```

### Include Specific Folders Only
```
include_patterns: ["src/", "lib/", "types/"]
```

### Deep Analysis (Detailed Function Signatures)
```
verbosity: "verbose"  # Show full function signatures, not just names
```

### Custom Output Structure
```
custom_sections:
  - name: "API Reference"
    pattern: "src/api/**"
  - name: "Database Models"
    pattern: "src/models/**"
```

## Best Practices

1. **Review the output** - Check `/claude-context/README.md` for usage notes
2. **Keep condensed files** - Save them in your project for future uploads
3. **Update periodically** - Regenerate when major changes are made
4. **Upload carefully** - Add all 00-04 files to Claude context
5. **Reference clearly** - Use file names when asking about specific parts

## Limitations

- Very large codebases (10k+ files) may need more than 8 condensed files
- Binary files and images are skipped
- Some language-specific analysis may be shallow (AST parsing not included)
- Lock files are summarized, not included verbatim

## Next Steps

1. Run the skill (defaults analyze current directory)
2. Review files in `/claude-context/`
3. Adjust configuration if needed and re-run
4. Upload condensed files to Claude Projects
5. Start asking questions about your codebase!

See `references/` for detailed guides on what each file contains and how to customize the condensation process.
