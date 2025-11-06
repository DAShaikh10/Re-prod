# Re-prod Project: Claude Code Instructions

## 📋 Project Overview

Re-prod is a reproducible data analysis environment for R, built with Tauri and Rust. It provides:
- R code execution with timeline tracking
- Plot artifact capture
- AI-assisted coding with context awareness
- Full session export for reproducibility

## 🌳 Git Worktree Development

This project uses **git worktrees** for parallel development. Each worktree is an independent working directory for a specific feature or refactoring task.

### Quick Start with Slash Command

Use the `/pw` (parallel-worktree) command to launch 3 Claude Code subagents in parallel:

```bash
# Inside Claude Code
/pw
```

This automatically:
1. Launches 3 parallel subagents using Task tool
2. Each subagent works in its own worktree
3. Auto-retries up to 3 times if tests fail
4. Verifies tests and builds before finishing

### Parallel Development

The `parallel-worktree` skill handles:
- **Issue 021**: UI Pane Improvements (wt-021-ui-pane)
- **Issue 007**: JSON Storage Refactoring (wt-007-json-storage)
- **Issue 020**: AI File Operations (wt-020-ai-files)

### Before Running

Clean worktrees to remove unstaged changes:

```bash
bash clean-worktrees.sh
```

### If Complete Reset Needed

Reset all worktrees to develop:

```bash
bash reset-worktrees.sh
```

## 🚨 Important Notes

### Security Considerations

When implementing AI file operations features:
- AI must ONLY access files within workspace
- Validate ALL file paths for `..` or absolute paths outside workspace
- Limit file sizes (10MB max)
- Rate limit file operations
- Security tests are CRITICAL

### Timeline Storage Format

Timeline storage uses JSON/YAML format:
- Uses NDJSON (newline-delimited JSON) for append-only writes
- Stores in `.reprod/timeline.json`
- Language-agnostic, version-control-friendly
- No database dependencies

## 🧪 Testing

### Backend Tests (Rust)
```bash
cd core
cargo test --all
cargo test <module>::tests
```

### Frontend Tests (TypeScript)
```bash
pnpm --filter client test
pnpm --filter client test -- <ComponentName>
pnpm --filter client run test:integration
```

## 🔄 Git Workflow

### Commit Changes
```bash
git add <files>
git commit -m "feat(issue-XXX): implement <feature>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Note**: NEVER use `--amend`, `--force`, or skip hooks unless explicitly requested.

## 🔧 Allowed Commands (No Permission Required)

### Package Management
```bash
pnpm install
pnpm --filter client test
pnpm --filter client run type-check
pnpm --filter client run build
pnpm run dev
```

### Rust/Cargo
```bash
cargo check
cargo build
cargo test
cargo test <module>::tests
```

### Git Operations
```bash
git status
git log
git branch
git worktree list
git restore <file>
git merge <branch>
```

### System Commands
```bash
echo <text>
ls
pwd
cat <file>  # Prefer Read tool when possible
```

**Note**: Use `pnpm` for all package management (NOT `npm`).

## 🎓 Claude Code Best Practices

### 1. Start with Documentation
Always read the issue documentation first:
```bash
Read docs/.obsidian/issues/XXX-<issue-name>.md
```

### 2. Add Relevant Directories
Use `--add-dir` to give Claude context:
```bash
claude --add-dir core/src/timeline/ \
      --add-dir core/src/websocket/handlers/
```

### 3. Request Incremental Implementation
```
Let's implement this step by step:
1. First, create the JsonTimeline struct
2. Then, implement append-only writes
3. Next, add the query API
```

### 4. Run Tests Frequently
```
Run cargo test timeline::json to verify our changes
```

## 🔒 Git Hooks

This project uses Git hooks to ensure code quality before pushing.

### Installing Hooks

Run this once after cloning the repository:

```bash
bash scripts/install-hooks.sh
```

### Pre-Push Checks

The following checks run automatically before `git push`:

1. **Rust Formatting** (`cargo fmt --check`)
   - Ensures all Rust code follows standard formatting
   - Fix with: `cargo fmt`

2. **Rust Linting** (`cargo clippy`)
   - Catches common mistakes and suggests improvements
   - Fix with: `cargo clippy --fix`

3. **TypeScript Linting** (`pnpm run lint`)
   - Validates TypeScript/JavaScript code style
   - Fix with: `pnpm run lint --fix` (if available)

### Bypassing Hooks (Not Recommended)

If you need to bypass the checks temporarily:

```bash
git push --no-verify
```

**Note**: Use this only in exceptional cases. Failed checks indicate issues that should be fixed before pushing.

---

**Last Updated**: 2025-11-06
