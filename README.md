[English](README.md) | [Japanese](README.ja.md)

---

# Re-prod

AI-Powered R Analysis IDE - A modern, AI-native alternative to RStudio.

## Mission

Data analysts and researchers shouldn't need to spend half a day reading R package documentation or juggling fragmented tools just to perform analysis. 
This inefficiency represents a significant opportunity cost for the scientific community whether you're a biologist, statistician, or data scientist.

Re-prod transforms **R and sparse tools into natural language**, letting AI handle the complexity while you focus on insights.

Furthermore unlike traditional IDEs, Re-prod **will ensure perfect reproducibility** through complete execution history and **will provide an end-to-end platform** that eliminates constant context-switching. We're building toward a future where R analysis is accessible, reproducible, and efficient for everyone.

---

## Features

- 🤖 **AI Agent Integration**: Claude API for intelligent R programming assistance
- 📝 **Execution History**: Complete log of all R executions
- 📊 **Plot Management**: Automatic plot capture and interactive viewing

## Architecture

### Backend (Rust)
- **Rust workspace** with Cargo
- **Tauri** for desktop app (cross-platform)
- **Axum** for web server (optional)
- Native WebSocket communication
- Real R execution via tokio::process
- AI provider integration (Anthropic, OpenAI, etc.)
- Platform-agnostic core library

### Frontend
- React + TypeScript + Vite
- Monaco Editor for code editing
- RStudio-inspired color palette
- Works with both Desktop (Tauri) and Web (Axum server)

## Prerequisites

- **Rust** (latest stable) - Install from [rustup.rs](https://rustup.rs/)
- **Node.js** 18+
- **pnpm** 9+ (installs via `corepack enable pnpm` or `npm install -g pnpm`)
- **R** (4.0+) with `Rscript` in PATH
- **Anthropic API key** (optional, for AI features)

## Installation

### 1. Install Rust (if not already installed)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. Install Tauri CLI

```bash
cargo install tauri-cli --version "^2.0"
```

### 3. Install JavaScript dependencies (pnpm)

```bash
pnpm install
```

### 4. Configure Application (Optional)

Create `~/.reprod/auth.json` for AI features:

```bash
mkdir -p ~/.reprod
cat > ~/.reprod/auth.json << 'EOF'
{
  "anthropic_api_key": "your-api-key-here",
  "r_path": "Rscript"
}
EOF
```

## Running the Application

### Option 1: Desktop App (Recommended)

```bash
cd desktop
cargo tauri dev
```

This launches the Tauri desktop application with:
- Native desktop window
- Automatic frontend startup
- Rust backend built-in

### Option 2: Web Version

```bash
# Start both Rust server and React client
pnpm dev
```

This starts:
- **Rust server**: `http://localhost:3001`
- **React client**: `http://localhost:5173`

Access at: http://localhost:5173

### Option 3: Frontend Only

```bash
pnpm --filter client dev
```

Runs the Vite dev server on `http://localhost:5173` without launching the Rust backend.

## Project Structure

```
Re-prod/
├── Cargo.toml                 # Rust workspace root
├── protocol/                  # Shared type definitions
│   └── src/messages.rs
├── common/                    # Error handling utilities
│   └── src/errors.rs
├── core/                      # Platform-agnostic business logic
│   ├── src/executor/         # R code execution
│   ├── src/ai/               # AI provider integration
│   └── src/config/           # Configuration management
├── desktop/                   # Tauri desktop app
│   ├── src/
│   │   ├── main.rs           # Desktop entry point
│   │   └── commands/         # Tauri commands
│   └── tauri.conf.json
├── server/                    # Axum web server (optional)
│   └── src/
│       ├── main.rs           # Server entry point
│       ├── routes.rs         # HTTP routes
│       └── handlers.rs       # WebSocket handlers
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Feature-oriented UI
│   │   │   ├── ai-panel/
│   │   │   ├── console/
│   │   │   ├── editor/
│   │   │   ├── menu/
│   │   │   ├── plots/
│   │   │   └── shared/
│   │   ├── core/             # Zustand store
│   │   ├── services/
│   │   │   └── socket.ts     # Native WebSocket client
│   │   └── css/
│   └── package.json
├── shared/                    # Shared TypeScript types
├── docs/                      # Architecture documentation
├── AGENTS.md                  # AI agent guidelines
└── package.json               # Root workspace config
```

## Usage

1. **Open Re-prod** in browser at `http://localhost:5173`
2. **Write R code** in the Monaco editor (left pane)
3. **Run code** by clicking "▶ Run" button
4. **View output** in Console panel (bottom)
5. **See plots** in Plots panel (right side, bottom)
6. **Ask AI** for help using AI Assistant panel (right side, top)

### AI Assistant

The AI assistant uses **Claude (Anthropic)** for intelligent R programming assistance:

**Claude (claude-sonnet-4-5)**:
- Strong R programming knowledge
- Code generation and explanation
- Debugging assistance

**Configuration:**

The API key can be configured in two ways:

1. **Configuration file** (Recommended):
```bash
~/.reprod/auth.json
{
  "anthropic_api_key": "sk-ant-...",
  "r_path": "Rscript"
}
```

2. **Environment variable** (Fallback):
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Keyboard Shortcuts

- `Cmd/Ctrl + Enter`: Run current cell/section
- `Shift + Enter`: Run current cell and move to next
- `Cmd/Ctrl + Shift + Enter`: Run all code

### R Path

If `Rscript` is not in your PATH, set the full path in `~/.reprod/auth.json`:

```json
{
  "anthropic_api_key": null,
  "r_path": "/usr/local/bin/Rscript"
}
```

## Development

### Type Checking

```bash
pnpm -r lint
```

### Building for Production

```bash
pnpm -r build
```

### Clean Temporary Files

Temporary R plots and scripts are stored in `server/temp/`. They are automatically cleaned up hourly, but you can manually delete them:

```bash
rm -rf server/temp/*
```

## Troubleshooting

### R not found
```
Error: Failed to start R process
```

**Solution**: Ensure R is installed and `Rscript` is in PATH, or set `R_PATH` in `.env`

### WebSocket connection failed
```
Socket connection error
```

**Solution**:
1. Ensure backend is running on port 3001
2. Check that no other service is using port 3001 (`lsof -i :3001`)
3. Verify frontend is connecting to `ws://localhost:3001/ws`
4. Check browser console for connection errors

### AI not responding

**Solution**:
1. Verify `ANTHROPIC_API_KEY` is set in `~/.reprod/auth.json` or as environment variable
2. Check server/desktop logs for API errors
3. Ensure you have Anthropic API credits
4. Verify API key format: `sk-ant-...`

## Implementation Notes

Following AGENTS.md guidelines:
- ✅ No dummy implementations - all services are real
- ✅ Real Claude API integration (Anthropic)
- ✅ Real R execution via tokio::process
- ✅ Native WebSocket communication (Rust Axum)
- ✅ RStudio-inspired UI (light grays, muted blues)
- ✅ TypeScript strict mode with explicit types
- ✅ Functional React components
- ✅ Two-space indentation

## Future Enhancements

- File browser and project management
- Keyboard shortcuts
- Dark theme support
- Multiple file tabs
- R package management
- Export to PDF/HTML
- Collaborative editing
- Electron desktop app

## License

MIT

## Acknowledgments

- Inspired by RStudio's excellent UI/UX
- Built with React, Monaco Editor, and Socket.io
