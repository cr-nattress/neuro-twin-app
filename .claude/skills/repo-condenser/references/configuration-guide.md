# Repo Condenser - Configuration Guide

Complete reference for all configuration options and patterns.

## Basic Configuration

### target_directory
Directory to analyze. Defaults to current directory.

```yaml
# Analyze current directory
target_directory: "."

# Analyze sibling project
target_directory: "../other-project"

# Analyze specific path
target_directory: "/Users/username/projects/neural-twin-app"

# Analyze remote (cloned first by skill)
target_directory: "https://github.com/user/repo.git"
```

### output_folder
Where to create condensed files. Defaults to "claude-context".

```yaml
output_folder: "claude-context"      # Standard
output_folder: ".claude-context"     # Hidden folder
output_folder: "project-context"     # Custom name
output_folder: "../shared-context"   # Outside repo
```

### max_files
Target number of condensed output files (4-10 typical).

```yaml
max_files: 4    # Very small projects (minimal files)
max_files: 6    # Standard (most projects)
max_files: 8    # Large projects (more detail)
max_files: 10   # Very large/complex projects
```

---

## Filtering Configuration

### include_patterns
Only analyze files/folders matching these glob patterns.

```yaml
# Analyze entire repository
include_patterns: []  # or omit entirely

# Only source code
include_patterns: ["src/**", "lib/**", "app/**"]

# Multiple languages
include_patterns: ["src/**", "tests/**", "docs/**"]

# Specific file types
include_patterns: ["**/*.ts", "**/*.tsx", "**/*.js"]

# Named folders
include_patterns: ["components/", "services/", "hooks/"]
```

### exclude_patterns
Skip files/folders matching these patterns.

```yaml
# Default excludes (applied automatically):
exclude_patterns:
  - "**/node_modules/**"
  - "**/.git/**"
  - "**/dist/**"
  - "**/build/**"
  - "**/.next/**"
  - "**/coverage/**"

# Additional custom excludes
exclude_patterns:
  - "**/node_modules/**"
  - "**/dist/**"
  - "**/*.test.ts"
  - "**/fixtures/**"
  - "**/__mocks__/**"

# Skip large directories
exclude_patterns:
  - "node_modules/**"
  - "dist/**"
  - ".git/**"
  - "*.log"
  - ".env*"

# Skip specific file types
exclude_patterns:
  - "**/*.md"  # Exclude all markdown
  - "**/*.lock"  # Exclude lock files
  - "**/.*"  # Exclude dotfiles
```

### ignore_dotfiles
Ignore hidden files and folders (starting with .).

```yaml
ignore_dotfiles: true   # Default - skip .gitignore, .env, etc.
ignore_dotfiles: false  # Include everything
```

---

## Content Configuration

### include_tests
Include test files in analysis.

```yaml
include_tests: false  # Default - skip test files
include_tests: true   # Include *.test.ts, *.spec.ts, etc.
```

### include_lock_files
Include dependency lock files in output.

```yaml
include_lock_files: false  # Default - summarize only
include_lock_files: true   # Include package-lock.json, yarn.lock, etc.
```

### analysis_depth
How deep to analyze code structure.

```yaml
analysis_depth: "shallow"   # Names and exports only
analysis_depth: "moderate"  # Includes type signatures
analysis_depth: "deep"      # Full AST analysis (slower)
```

**Shallow**:
- Function names, parameters, return types
- Class names, public methods
- Module exports

**Moderate**:
- Everything shallow plus:
- Type signatures and interfaces
- Dependencies and imports
- Key comments preserved

**Deep**:
- Everything moderate plus:
- Private method analysis
- Data flow relationships
- Complex type information

### remove_comments
Remove comments from condensed code.

```yaml
remove_comments: true   # Default - cleaner output
remove_comments: false  # Preserve all comments
```

### code_snippet_size
Maximum lines to include for code examples.

```yaml
code_snippet_size: 5    # Very minimal (just signature)
code_snippet_size: 15   # Standard (brief examples)
code_snippet_size: 30   # Verbose (full implementations)
```

---

## Output Configuration

### verbosity
Control output detail and logging.

```yaml
verbosity: "quiet"    # No progress output
verbosity: "normal"   # Standard progress
verbosity: "verbose"  # Detailed analysis info
```

### include_file_sizes
Show file sizes in condensed output.

```yaml
include_file_sizes: true   # Default
include_file_sizes: false  # Cleaner output
```

### include_timestamps
Add analysis timestamp to README.

```yaml
include_timestamps: true   # Default
include_timestamps: false  # Omit date
```

### preserve_structure
Keep original folder structure in references.

```yaml
preserve_structure: true   # Default - show full paths
preserve_structure: false  # Simplify paths
```

---

## Advanced Configuration

### language_priorities
Prioritize analysis for specific languages.

```yaml
language_priorities:
  - typescript
  - python
  - javascript
```

Languages analyzed most thoroughly appear first in condensed files.

### custom_sections
Define custom output sections.

```yaml
custom_sections:
  - name: "API Layer"
    pattern: "src/api/**"
    max_size: "30KB"

  - name: "Data Models"
    pattern: "src/models/**"
    max_size: "20KB"

  - name: "Business Logic"
    pattern: "src/services/**"
    max_size: "30KB"
```

### module_grouping
How to group modules in output.

```yaml
module_grouping: "by-folder"      # Group by directory (default)
module_grouping: "by-type"        # Group by file type
module_grouping: "by-dependency"  # Group by relationships
```

---

## Example Configurations

### Small API Project
```yaml
target_directory: "."
output_folder: "claude-context"
max_files: 4

include_patterns:
  - "src/**"
  - "*.json"

exclude_patterns:
  - "node_modules/**"
  - "**/*.test.ts"

analysis_depth: "moderate"
verbosity: "normal"
```

### Large Full-Stack Application
```yaml
target_directory: "."
output_folder: ".claude-context"
max_files: 8

include_patterns:
  - "src/**"
  - "app/**"
  - "lib/**"
  - "services/**"
  - "*.config.js"
  - "*.json"

exclude_patterns:
  - "node_modules/**"
  - "dist/**"
  - ".next/**"
  - "**/__tests__/**"
  - "**/*.test.ts"

include_tests: false
analysis_depth: "moderate"
verbosity: "normal"
```

### Data Science Project
```yaml
target_directory: "."
output_folder: "claude-context"
max_files: 6

include_patterns:
  - "src/**"
  - "notebooks/**"
  - "data_processing/**"
  - "models/**"
  - "*.yaml"
  - "*.yml"

exclude_patterns:
  - "__pycache__/**"
  - "*.pyc"
  - "venv/**"
  - "*.csv"
  - "*.pkl"

analysis_depth: "deep"
language_priorities: ["python"]
```

### Monorepo
```yaml
target_directory: "."
output_folder: "claude-context"
max_files: 10

include_patterns:
  - "packages/*/src/**"
  - "*.json"
  - "*.config.js"
  - "README.md"

exclude_patterns:
  - "**/node_modules/**"
  - "**/dist/**"
  - "**/.next/**"

module_grouping: "by-folder"
verbosity: "verbose"
```

---

## Configuration File Format

Create a `.claude-condenser.yaml` in your project root:

```yaml
# .claude-condenser.yaml
target_directory: "."
output_folder: "claude-context"
max_files: 6

include_patterns:
  - "src/**"
  - "lib/**"
  - "*.json"

exclude_patterns:
  - "node_modules/**"
  - "dist/**"
  - "**/*.test.ts"

analysis_depth: "moderate"
verbosity: "normal"
include_tests: false
```

Then run: `skill: repo-condenser`

The skill will automatically detect and use `.claude-condenser.yaml` if present.

---

## Environment Detection

The skill automatically detects:

| Detection | Uses |
|-----------|------|
| `package.json` exists | Node.js/JavaScript project |
| `Cargo.toml` exists | Rust project |
| `pyproject.toml` exists | Python project |
| `go.mod` exists | Go project |
| Multiple languages | Multi-language project |

This affects default include patterns and analysis strategies.

---

## Tips

### For GitHub Uploads
```yaml
# Include everything needed to understand the project
include_patterns: ["src/**", "app/**", "lib/**", "*.json", "*.md"]
exclude_patterns: ["node_modules/**", "dist/**", ".git/**"]
```

### For Code Review
```yaml
# Focus on application code only
include_patterns: ["src/**", "app/**"]
exclude_patterns: ["node_modules/**", "dist/**", "**/*.test.ts"]
analysis_depth: "moderate"
```

### For Onboarding
```yaml
# Comprehensive project overview
max_files: 8
include_tests: true  # Show test structure
verbosity: "verbose"  # Detailed explanations
```

### For CI/CD
```yaml
# Minimal, repeatable output
verbosity: "quiet"
include_timestamps: false
include_file_sizes: false
```

---

## Troubleshooting

### Too many files being included
```yaml
# Use stricter patterns
include_patterns:
  - "src/**"
  - "app/**"
  # Remove other folders
```

### Output files too large
```yaml
# Increase max_files to spread content
max_files: 8  # Instead of 6

# Or reduce analysis depth
analysis_depth: "shallow"
```

### Missing important code
```yaml
# Check exclude_patterns
exclude_patterns: []  # Temporarily disable to debug

# Or adjust include_patterns
include_patterns:
  - "**/*.ts"
  - "**/*.tsx"
```

### Too much detail
```yaml
# Reduce analysis depth
analysis_depth: "shallow"

# Or increase max_files to spread detail
max_files: 8
```
