# Re-Prod

AI-Powered R Analysis IDE - A modern, AI-native alternative to RStudio.

## Features

- 🤖 **Real AI Integration**: Claude API for intelligent R programming assistance
- 📊 **Live R Execution**: Direct R process spawning with real-time output
- 🎨 **RStudio-Inspired UI**: Familiar layout with light grays, muted blues, clean borders
- 📈 **Automatic Plot Capture**: Plots generated in R are automatically displayed
- 🔄 **File Watching**: Real-time file monitoring with chokidar
- 📝 **Execution History**: Complete log of all R executions
- ⚡ **WebSocket Communication**: Real-time bidirectional updates

## Architecture

### Backend
- Node.js + Express + TypeScript
- Socket.io for WebSocket communication
- Real R execution via child_process
- Claude API integration (@anthropic-ai/sdk)
- Chokidar for file watching

### Frontend
- React + TypeScript + Vite
- Monaco Editor for code editing
- Allotment for resizable panes
- Zustand for state management
- RStudio-inspired color palette

## Prerequisites

- Node.js 18+
- npm
- R (4.0+) with `Rscript` in PATH
- **OpenAI API key** (default) OR **Anthropic API key** (alternative)

## Installation

```bash
# Install all dependencies for all workspaces
npm install
```

This will install dependencies for:
- Root workspace
- `client/` (React frontend)
- `server/` (Node.js backend)
- `shared/` (TypeScript types)

## Running the Application

### Start Both Frontend and Backend

```bash
npm run dev
```

This starts:
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

### Run Separately

```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client
```

## Project Structure

```
Re-Prod/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── MenuBar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   ├── EditorPanel.tsx
│   │   │   ├── AIPanel.tsx
│   │   │   ├── PlotsPanel.tsx
│   │   │   └── ConsolePanel.tsx
│   │   ├── services/
│   │   │   └── socket.ts      # WebSocket client
│   │   ├── store/
│   │   │   └── useStore.ts    # Zustand state
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.css          # RStudio colors
│   └── package.json
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── services/
│   │   │   ├── rExecutor.ts   # Real R execution
│   │   │   ├── fileWatcher.ts # File watching
│   │   │   └── aiService.ts   # Claude API
│   │   └── server.ts          # Main server
│   ├── .env                   # Environment config (has your API key)
│   └── package.json
├── shared/                    # Shared TypeScript types
│   └── src/
│       └── types.ts
├── docs/                      # Documentation
│   ├── architecture.md
│   ├── data-flow-and-ui.md
│   └── overview.md
├── AGENTS.md                  # Coding guidelines
└── package.json               # Root workspace config
```

## Usage

1. **Open Re-Prod** in browser at `http://localhost:5173`
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

**Features:**
- Ask R programming questions
- Get code suggestions with syntax highlighting
- Apply suggested code directly to editor
- Context-aware based on your current code and execution history

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

### Cell-Based Execution

Re-Prod follows RStudio's section convention. Mark sections with comments followed by at least 4 dashes:

```r
# Load Data ----
data <- read.csv("data.csv")

# Analyze Data ----
summary(data)

# Visualize ----
plot(data$x, data$y)
```

**Features:**
- Visual indicators show section boundaries (blue line in left margin)
- Executing cells are highlighted with light blue background
- Can be disabled via settings: `showCellDecorations` and `highlightExecutingCell`

## Configuration

### Environment Variables

Edit `server/.env`:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# AI Provider (openai or anthropic)
AI_PROVIDER=openai

# OpenAI Configuration (default)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Anthropic Configuration (alternative)
ANTHROPIC_API_KEY=sk-ant-...

# R Configuration
R_PATH=Rscript
```

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
1. Verify `ANTHROPIC_API_KEY` is set in `server/.env`
2. Check server logs for API errors
3. Ensure you have API credits

### Plots not showing

**Solution**:
1. Ensure your R code generates plots
2. Check Console panel for R errors
3. Verify `server/temp/` directory exists and is writable

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
- Powered by Claude AI (Anthropic)
- Built with React, Monaco Editor, and Socket.io
