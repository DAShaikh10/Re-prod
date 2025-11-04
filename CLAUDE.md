# Re-prod Project: Claude Code Instructions

## 📋 Project Overview

Re-prod is a reproducible data analysis environment for R, built with Tauri and Rust. It provides:
- R code execution with timeline tracking
- Plot artifact capture
- AI-assisted coding with context awareness
- Full session export for reproducibility

## 🚨 Important Notes

### Security Considerations

**Issue 020 (AI File Operations)** requires strict security validation:
- AI must ONLY access files within workspace
- Validate ALL file paths for `..` or absolute paths outside workspace
- Limit file sizes (10MB max)
- Rate limit file operations
- Security tests are CRITICAL

### Timeline Storage Format Change

**Issue 007** changes timeline storage from SQLite to JSON/YAML:
- Uses NDJSON (newline-delimited JSON) for append-only writes
- Stores in `.reprod/timeline.json`
- Language-agnostic, version-control-friendly
- No SQLite dependencies

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
