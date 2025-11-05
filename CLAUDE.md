# Re-prod Project: Claude Code Instructions

## 📋 Project Overview

Re-prod is a reproducible data analysis environment for R, built with Tauri and Rust. It provides:
- R code execution with timeline tracking
- Plot artifact capture
- AI-assisted coding with context awareness
- Full session export for reproducibility

## 🌳 Git Worktree Development

This project uses **git worktrees** for parallel development. Each worktree is an independent working directory for a specific feature or refactoring task.

### Quick Start Script

Use the `start-worktrees.sh` script to launch Claude Code in a worktree:

```bash
# From main repository
bash start-worktrees.sh <issue-number>
```

This automatically:
1. Changes to the appropriate worktree directory
2. Adds relevant source directories with `--add-dir`
3. Enables autonomous execution with `--allow-file-operations` and `--allow-bash`
4. Provides a comprehensive prompt to implement the complete solution

### Manual Worktree Execution

If you prefer manual control:

```bash
# Navigate to worktree
cd /path/to/worktree

# Start Claude Code with context
claude --add-dir path/to/relevant/code/ \
      --allow-file-operations \
      --allow-bash \
      -p "Read docs/.obsidian/issues/XXX-description.md. IMPLEMENT the complete solution - do not just plan, actually create all files and make all changes. [detailed tasks...] Make all necessary changes and run tests."
```

### Key Principles

1. **Autonomous Execution**: Use `-p` flag with explicit instructions to implement (not just plan)
2. **Permission Flags**: Include `--allow-file-operations` and `--allow-bash` for uninterrupted execution
3. **Complete Instructions**: Specify "IMPLEMENT" and "create all files and make all changes" to ensure full implementation
4. **Testing**: Include "run tests" in the prompt to verify changes

### Parallel Development

Multiple worktrees can run simultaneously:

```bash
# Start multiple Claude Code instances
bash start-worktrees.sh <issue-A> > logs/issue-A.log 2>&1 &
bash start-worktrees.sh <issue-B> > logs/issue-B.log 2>&1 &
bash start-worktrees.sh <issue-C> > logs/issue-C.log 2>&1 &

# Monitor progress
tail -f logs/issue-A.log
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
cd client
npm test
npm test -- <ComponentName>
npm run test:integration
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

---

**Last Updated**: 2025-11-05
