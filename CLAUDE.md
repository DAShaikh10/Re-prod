# Claude Code Instructions for Re-prod Project

## Important: Read AGENTS.md First

**Before starting any work, please read `AGENTS.md` in this repository.**

`AGENTS.md` contains the comprehensive guidelines for this project, including:
- Project structure and module organization
- Build, test, and development commands
- Coding style and naming conventions
- Testing guidelines
- Commit and pull request guidelines
- Security and configuration tips
- **Bash command permissions** - what commands you can execute without asking

## Project-Specific Instructions

### Git Commit Messages
- **NEVER** add "Co-Authored-By: Claude <noreply@anthropic.com>" to commit messages
- Do NOT include any AI co-author attribution in git commits
- Follow the imperative, lower-case commit style shown in `AGENTS.md`

### Git Staging Rules
- **NEVER** use `git add -A` or `git add .`
- **ALWAYS** stage files explicitly: `git add <file1> <file2> <file3>`
- **Reason**: The `docs/` directory may contain temporary files that should not be committed
- **Example**: `git add core/src/lib.rs core/Cargo.toml` ✅ | `git add .` ❌

### Path Handling
- **NEVER** commit files containing absolute paths (e.g., `/Users/username/...`)
- Always use relative paths in configuration files
- Environment-specific configs like `.cargo/config.toml` should be in `.gitignore`

### Development Workflow
1. Read `AGENTS.md` for project conventions
2. Check `docs/.obsidian/issues/` for current issues and priorities
3. Follow the Rust/Tauri/Axum architecture described in `AGENTS.md`
4. Use the allowed commands listed in `AGENTS.md` without asking for permission

### File Editing Permissions
- Programming files: `.rs`, `.toml`, `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`
- Configuration files: Can be created/edited as needed
- Documentation: Can be created/edited without asking

### Configuration Files
- Application config: `~/.reprod/auth.json`
- Project configs: `.env`, `tsconfig.json`, `Cargo.toml`, `tauri.conf.json`, etc.

---

**For detailed guidelines, always refer to `AGENTS.md` in this repository.**
