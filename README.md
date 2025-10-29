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

- 🤖 **AI Agent Integration**: LLM APIs for intelligent R programming assistance
- 🔄 **File Watching**: Real-time file monitoring with chokidar
- 📝 **Execution History**: Complete log of all R executions

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
- **Node.js** 18+ and npm
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

### 3. Install Node.js dependencies

```bash
npm install
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
npm run dev
```

This starts:
- **Rust server**: `http://localhost:3001`
- **React client**: `http://localhost:5173`

Access at: http://localhost:5173

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

The AI assistant supports both **OpenAI** (default) and **Claude**:

**OpenAI (GPT-4o)** - Default:
- Faster responses
- Excellent R programming knowledge
- Configure via `OPENAI_API_KEY` in `server/.env`

**Claude (3.5 Sonnet)** - Alternative:
- Strong coding capabilities
- Set `AI_PROVIDER=anthropic` in `server/.env`


**Switching Providers:**
```env
# In server/.env
AI_PROVIDER=openai        # or "anthropic"
OPENAI_API_KEY=sk-...     # for OpenAI
ANTHROPIC_API_KEY=sk-...  # for Claude
```

### Keyboard Shortcuts

- `Cmd/Ctrl + Enter`: Run current cell/section
- `Shift + Enter`: Run current cell and move to next
- `Cmd/Ctrl + Shift + Enter`: Run all code

### R Path

If `Rscript` is not in your PATH, set the full path:

```env
R_PATH=/usr/local/bin/Rscript
```

## Development

### Type Checking

```bash
npm run lint
```

### Building for Production

```bash
npm run build
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
1. Ensure backend is running on port 4000
2. Check `CLIENT_URL` in server/.env matches frontend URL
3. Check browser console for CORS errors

### AI not responding

**Solution**:
1. Verify either of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set in `server/.env`
2. Check server logs for API errors
3. Ensure you have API credits

## Implementation Notes

Following AGENTS.md guidelines:
- ✅ No dummy implementations - all services are real
- ✅ Real Claude API integration
- ✅ Real R execution via child_process
- ✅ Real file watching via chokidar
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
