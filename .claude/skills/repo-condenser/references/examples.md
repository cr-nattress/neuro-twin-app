# Repo Condenser - Examples

Real-world examples of repo-condenser output for different project types.

## Example 1: Full-Stack Web App (Neural Twin App)

### Configuration
```yaml
target_directory: "."
output_folder: "claude-context"
max_files: 6
include_patterns:
  - "app/**"
  - "components/**"
  - "hooks/**"
  - "services/**"
  - "netlify/functions/**"
  - "types/**"
  - "*.json"
  - "*.md"
exclude_patterns:
  - "node_modules/**"
  - ".next/**"
```

### Output Summary
```
Repository Analysis Complete
============================
Files analyzed: 127
Folders analyzed: 31
Size before: 154 MB (node_modules excluded)
Size after: 3.2 MB

Files created:
✓ 00-README.md (3.8 KB)
✓ 01-codebase-overview.md (28 KB)
✓ 02-core-modules.md (45 KB)
✓ 03-configurations.md (15 KB)
✓ 04-documentation.md (32 KB)

Languages detected:
- TypeScript: 78% (app, components, hooks, services)
- JSON: 12% (config files)
- Markdown: 8% (documentation)
- JavaScript: 2% (build config)

Included:
✓ Next.js app pages and routing
✓ React components and hooks
✓ Service interfaces and implementations
✓ Netlify Functions and utilities
✓ Type definitions
✓ Configuration (package.json, tsconfig, etc.)

Excluded:
✗ node_modules/ (147 MB)
✗ .next/ (build artifacts)
✗ .git/ (version control)
✗ Test files (*__tests__*, *.test.ts)

Reduction: 98% size, 2.4% file count
Ready to upload to Claude Projects!
```

### File Structure
```
/claude-context/
├── 00-README.md
│   └── Quick start guide for using files
├── 01-codebase-overview.md
│   ├── Architecture overview
│   ├── Tech stack
│   ├── Directory structure
│   └── Key data flows
├── 02-core-modules.md
│   ├── Auth service (2 interfaces + 1 implementation)
│   ├── Persona service (4 functions)
│   ├── React hooks (3 custom hooks)
│   ├── Netlify Functions (6 utilities + 1 handler)
│   └── UI utilities (3 functions)
├── 03-configurations.md
│   ├── Dependencies (34 packages)
│   ├── Build config (tsconfig, next.config, netlify.toml)
│   ├── Environment variables (7 required)
│   └── Scripts (8 npm scripts)
└── 04-documentation.md
    ├── Quick start
    ├── Project structure
    ├── Common tasks
    └── Deployment steps
```

---

## Example 2: Python CLI Tool

### Configuration
```yaml
target_directory: "."
output_folder: "claude-context"
max_files: 4
include_patterns:
  - "src/**"
  - "*.py"
  - "pyproject.toml"
  - "requirements.txt"
  - "README.md"
exclude_patterns:
  - "__pycache__/**"
  - "*.pyc"
  - "venv/**"
  - "dist/**"
  - "build/**"
analysis_depth: "moderate"
language_priorities: ["python"]
```

### Output Summary
```
Repository Analysis Complete
============================
Files analyzed: 42
Size before: 8.3 MB
Size after: 0.89 MB

Files created:
✓ 00-README.md (2.5 KB)
✓ 01-codebase-overview.md (18 KB)
✓ 02-core-modules.md (32 KB)
✓ 03-configurations.md (8 KB)

Languages detected:
- Python: 85% (source code)
- YAML: 10% (config)
- Markdown: 5% (docs)

Included:
✓ All .py source files (structure and classes)
✓ Package dependencies
✓ Configuration (pyproject.toml)
✓ Type hints and docstrings

Excluded:
✗ venv/ (virtual environment)
✗ __pycache__/ (compiled)
✗ dist/, build/ (built packages)
✗ .git/ (version control)

Reduction: 89% size, 4% file count
```

---

## Example 3: React Component Library

### Configuration
```yaml
target_directory: "."
output_folder: ".claude-context"
max_files: 5
include_patterns:
  - "src/components/**"
  - "src/hooks/**"
  - "src/utils/**"
  - "src/types.ts"
  - "*.json"
exclude_patterns:
  - "node_modules/**"
  - "dist/**"
  - "**/*.test.tsx"
  - "**/*.stories.tsx"
```

### Output Summary
```
Repository Analysis Complete
============================
Files analyzed: 89
Size before: 47 MB
Size after: 1.2 MB

Files created:
✓ 00-README.md (2.2 KB)
✓ 01-codebase-overview.md (12 KB)
✓ 02-core-modules.md (38 KB)
✓ 03-configurations.md (7 KB)
✓ 04-component-api.md (18 KB)

Components analyzed: 34
- Buttons: 5 components
- Forms: 8 components
- Layout: 6 components
- Utilities: 15 components

Included:
✓ Component definitions
✓ Props interfaces
✓ Hook implementations
✓ Utility functions
✓ Type definitions

Excluded:
✗ node_modules/ (45 MB)
✗ dist/ (built output)
✗ Test files (*.test.tsx)
✗ Story files (*.stories.tsx)

Reduction: 97% size
```

---

## Example 4: Microservices Backend

### Configuration
```yaml
target_directory: "."
output_folder: "claude-context"
max_files: 8
include_patterns:
  - "services/*/src/**"
  - "shared/**"
  - "*.yaml"
  - "*.yml"
  - "docker-compose.yml"
exclude_patterns:
  - "**/node_modules/**"
  - "**/dist/**"
  - "**/target/**"
  - "**/.env"
module_grouping: "by-folder"
```

### Output Summary
```
Repository Analysis Complete
============================
Files analyzed: 234
Size before: 89 MB
Size after: 4.1 MB

Files created:
✓ 00-README.md (4.2 KB)
✓ 01-codebase-overview.md (35 KB)
✓ 02-core-modules.md (52 KB)
✓ 03-configurations.md (22 KB)
✓ 04-documentation.md (28 KB)
✓ 05-api-endpoints.md (35 KB)
✓ 06-database-schema.md (18 KB)
✓ 07-deployment.md (12 KB)

Services analyzed: 4
- Authentication Service: 28 files
- User Service: 31 files
- Product Service: 26 files
- Order Service: 24 files

Shared modules: 8

Included:
✓ Service endpoints
✓ Data models
✓ Database schemas
✓ API contracts
✓ Shared utilities
✓ Docker configuration

Excluded:
✗ node_modules/, target/ (dependencies)
✗ dist/, build/ (compiled code)
✗ .git/, .env (secrets/control)
✗ vendor/ (vendored packages)

Reduction: 95% size
```

---

## Example 5: Machine Learning Project

### Configuration
```yaml
target_directory: "."
output_folder: "claude-context"
max_files: 6
include_patterns:
  - "src/**"
  - "models/**"
  - "data_processing/**"
  - "notebooks/*.ipynb"
  - "*.yaml"
  - "*.md"
exclude_patterns:
  - "data/raw/**"
  - "**/*.pkl"
  - "**/*.h5"
  - ".venv/**"
  - "__pycache__/**"
analysis_depth: "moderate"
language_priorities: ["python"]
```

### Output Summary
```
Repository Analysis Complete
============================
Files analyzed: 156
Size before: 2.4 GB (data excluded)
Size after: 1.8 MB

Files created:
✓ 00-README.md (3.1 KB)
✓ 01-codebase-overview.md (22 KB)
✓ 02-core-modules.md (48 KB)
✓ 03-configurations.md (12 KB)
✓ 04-documentation.md (18 KB)
✓ 05-model-architecture.md (25 KB)

Python modules analyzed: 34
- Data loading: 4 modules
- Preprocessing: 6 modules
- Model training: 8 modules
- Evaluation: 5 modules
- Utilities: 6 modules

Notebooks: 3
- Exploration.ipynb (analyzed)
- Training.ipynb (analyzed)
- Results.ipynb (analyzed)

Included:
✓ Data loading and preprocessing
✓ Model architectures
✓ Training loops
✓ Evaluation metrics
✓ Configuration files
✓ Notebook structure

Excluded:
✗ Data files (*.csv, *.pkl)
✗ Model weights (*.h5, *.pt)
✗ .venv/ (virtual environment)
✗ __pycache__/ (compiled Python)
✗ .git/ (version control)

Reduction: 99.9% size (data-heavy projects)
```

---

## Using Condensed Files in Claude Projects

### Upload Steps
1. Run repo-condenser skill on your project
2. Copy all .md files from `/claude-context/` folder
3. Create new Claude Project
4. Add files to project context
5. Start asking questions about your code

### Example Prompts

**With condensed files context:**

> "Based on 01-codebase-overview.md and 02-core-modules.md, what's the data flow when a user creates a new persona?"

> "Using the architecture in 02-core-modules.md, how should I add a new Netlify Function for chat?"

> "From 03-configurations.md, what are all the required environment variables I need to deploy?"

> "Using 04-documentation.md and 02-core-modules.md, walk me through the magic link authentication flow."

### What to Expect

Claude can now:
- ✅ Answer questions about your codebase architecture
- ✅ Suggest improvements based on current structure
- ✅ Help you understand how components interact
- ✅ Generate code that fits your patterns
- ✅ Find and fix bugs more effectively
- ✅ Plan refactoring with full context

Claude cannot:
- ❌ Access original source files (condensed version only)
- ❌ See line numbers (reference to original needed)
- ❌ Run code (need to test locally)
- ❌ Access runtime data or logs

---

## Tips

### Best Practices
1. **Regenerate periodically** - After major refactoring
2. **Keep condensed files** - Save in your repo for future use
3. **Version with code** - Commit condensed files to git
4. **Update before asking** - Refresh context if code changed significantly
5. **Reference file names** - Use "01-codebase-overview.md" in prompts

### Common Issues

**Claude seems to miss details:**
- Regenerate condensed files (code may have changed)
- Increase `max_files` or `analysis_depth` in config
- Ask more specific questions with file references

**Output files too large:**
- Reduce `analysis_depth` to "shallow"
- Increase `max_files` to spread content
- Remove specific folders from `include_patterns`

**Important code is missing:**
- Check `exclude_patterns` - may be filtering it out
- Ensure `include_patterns` covers needed folders
- Regenerate with `verbosity: "verbose"` to see what's skipped
