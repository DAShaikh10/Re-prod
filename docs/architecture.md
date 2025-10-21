# Re-Prod Architecture Documentation

## Project Overview
Re-Prod is an AI-native R analysis IDE that addresses the limitations of RStudio by providing:
- Real-time AI assistance integrated into the workflow
- Automatic code re-execution on file changes (similar to marimo)
- Better reproducibility through comprehensive execution logging
- Modern, intuitive user interface

## Architecture Decisions

### 1. Technology Stack

#### **Final Stack Decision:**
- **Frontend**: React + TypeScript + Monaco Editor
- **Backend**: Node.js + Express + TypeScript + Socket.io
- **R Integration**: Direct child process spawning
- **File Watching**: Chokidar
- **AI Integration**: Claude API

#### **Why We Chose This Stack:**

##### **Why NOT Python:**
- **Unnecessary complexity**: Python + rpy2 adds an extra translation layer between web and R
- **Performance overhead**: Every R call would need to go through Python bindings
- **Deployment complexity**: Would require both Python and R runtime environments
- **Not natural for R ecosystem**: RStudio uses C++/Java for good reasons - they need direct process control

##### **Why Node.js + TypeScript:**
1. **Direct R execution**: Simple child process spawning without intermediaries
   ```javascript
   const { spawn } = require('child_process');
   const R = spawn('Rscript', ['script.R']);
   ```
2. **Excellent file watching**: Chokidar provides robust, cross-platform file monitoring
3. **Native WebSocket support**: Real-time updates without additional complexity
4. **Single language**: TypeScript for both frontend and backend reduces context switching
5. **Fast async I/O**: Perfect for handling multiple R processes, file operations, and AI calls
6. **Mature ecosystem**: Extensive libraries for all our needs

##### **Why Express over NestJS (for MVP):**
- **Faster prototyping**: Can get running in 1-2 hours vs 3-4 hours for NestJS
- **Less boilerplate**: Focus on core features, not framework conventions
- **Sufficient for MVP**: WebSocket support via Socket.io is excellent
- **Easy migration path**: Can move to NestJS later if needed for scaling

### 2. Development Approach

#### **Web-First, Then Electron:**
- Start with web app for faster iteration
- Port to Electron later for desktop features
- Shared codebase between both versions
- Focus on desktop-only experience (no mobile/tablet support for MVP)

#### **MVP-Driven Development:**
- Build minimal working version first
- Iterate based on actual usage
- Avoid over-engineering early
- Target desktop browsers only (Chrome, Firefox, Safari)

#### **UI/UX Priorities:**
- RStudio-familiar layout for easy adoption
- Resizable panes for customizable workspace
- AI integration that doesn't interrupt workflow
- Real-time feedback and auto-execution capabilities

## System Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client (Browser)                           │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │   Monaco     │  │   AI Chat    │  │   Output     │                │
│  │   Editor     │  │    Panel     │  │    Panel     │                │
│  │   (.Rmd)     │  │              │  │              │                │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                │
│         │                  │                  │                        │
│         └──────────────────┼──────────────────┘                        │
│                            │                                           │
│                     ┌──────▼───────┐                                  │
│                     │   React App   │                                  │
│                     │   (State)     │                                  │
│                     └──────┬───────┘                                  │
└─────────────────────────────┼─────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │                   │
                    │  WebSocket/HTTP   │
                    │                   │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────────────┐
│                     Node.js Backend (TypeScript)                       │
│                                                                         │
│  ┌──────────────────────────▼──────────────────────────┐              │
│  │                  Express + Socket.io                 │              │
│  │                                                      │              │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │              │
│  │  │   Routes   │  │  WebSocket │  │   Events   │   │              │
│  │  │  Handlers  │  │  Handlers  │  │   Emitter  │   │              │
│  │  └────┬───────┘  └────┬───────┘  └────┬───────┘   │              │
│  └───────┼───────────────┼───────────────┼────────────┘              │
│          │               │               │                            │
│  ┌───────▼────────┬──────▼────────┬─────▼────────┐                  │
│  │   R Executor   │  File Watcher │  AI Service  │                  │
│  │                │   (Chokidar)  │  (Claude API)│                  │
│  └───────┬────────┴──────┬────────┴─────┬────────┘                  │
│          │               │              │                            │
└──────────┼───────────────┼──────────────┼────────────────────────────┘
           │               │              │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌────▼─────┐
    │  R Process  │ │  File       │ │ Claude   │
    │  (Rscript)  │ │  System     │ │   API    │
    └─────────────┘ └─────────────┘ └──────────┘
```

### Screen Layout (RStudio-Style UI Mockup)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Re-Prod - AI-Powered R Analysis IDE                             [─][□][X]  │
├─────────────────────────────────────────────────────────────────────────────┤
│  File  Edit  Code  View  Plots  Session  Build  Debug  Tools  Help         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────┬──────────────────────────┐   │
│  │  📄 analysis.Rmd               [▶ Run]   │  AI Assistant    [⚙️]    │   │
│  ├──────────────────────────────────────────┤  ┌────────────────────┐  │   │
│  │ 1  # Data Analysis                        │  │ 💬 How can I help? │  │   │
│  │ 2  library(tidyverse)                     │  │                    │  │   │
│  │ 3                                          │  │ Suggestions:       │  │   │
│  │ 4  # Load and explore data                │  │ • Use glimpse()    │  │   │
│  │ 5  data <- read_csv("data.csv")           │  │ • Try pivot_wider  │  │   │
│  │ 6                                          │  │                    │  │   │
│  │ 7  # Basic summary statistics             │  │ [Ask question...]  │  │   │
│  │ 8  summary(data)                          │  └────────────────────┘  │   │
│  │ 9                                          ├─────────────────────────┤   │
│  │ 10 # Create visualization                 │  Plots │ Viewer │ Help  │   │
│  │ 11 ggplot(data, aes(x=var1, y=var2)) +   │  ┌────────────────────┐  │   │
│  │ 12   geom_point(color="blue") +          │  │                    │  │   │
│  │ 13   theme_minimal()                     │  │   📊 Plot Area     │  │   │
│  │ 14                                        │  │                    │  │   │
│  │ 15 # Statistical analysis                │  │  [Scatter plot     │  │   │
│  │ 16 model <- lm(var2 ~ var1, data=data)  │  │   visualization]   │  │   │
│  │ 17 summary(model)                        │  │                    │  │   │
│  │                                           │  │ [◀][▶][🔍][💾]     │  │   │
│  │                                           │  └────────────────────┘  │   │
│  └──────────────────────────────────────────┴──────────────────────────┘   │
│  ═══════════════════════════════════════════════════════════════════════   │
│  Console │ Terminal │ Jobs │ History                               [▲]      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ > summary(data)                                                      │  │
│  │      var1              var2                                          │  │
│  │  Min.   :  1.00     Min.   :  0.00                                  │  │
│  │  Mean   : 50.50     Mean   : 25.00                                  │  │
│  │  Max.   :100.00     Max.   : 50.00                                  │  │
│  │ >                                                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Status: Connected | R 4.3.0 | Auto-run: ON | Watching: analysis.Rmd      │
└─────────────────────────────────────────────────────────────────────────────┘

Layout Specifications:
- Code Editor: 60-65% width (resizable)
- Right Panel: 35-40% width
  - AI Assistant: Upper 50% (resizable)
  - Plots/Viewer: Lower 50% (resizable)
- Console: 20% height (resizable, can expand to 40%)
```

### WebSocket Communication Flow

```
Client                          Server                          Services
  │                               │                                │
  ├──── connect ──────────────────>│                                │
  │<─── connected ─────────────────│                                │
  │                               │                                │
  ├──── watch-file(path) ─────────>│                                │
  │                               ├──── start watching ────────────>│ FileWatcher
  │                               │                                │
  │                               │<─── file changed ──────────────│
  │<─── file-updated(content) ─────│                                │
  │                               │                                │
  ├──── execute(code) ─────────────>│                                │
  │                               ├──── spawn Rscript ─────────────>│ R Process
  │                               │<─── stdout/stderr ──────────────│
  │<─── execution-result ──────────│                                │
  │                               │                                │
  ├──── ai-request(code, prompt) ──>│                                │
  │                               ├──── call Claude API ───────────>│ AI Service
  │                               │<─── completion ─────────────────│
  │<─── ai-response ───────────────│                                │
  │                               │                                │
```

## Implementation Phases

### Phase 1: Core Infrastructure (Day 1)
- Basic Express + TypeScript setup
- WebSocket configuration
- Project structure
- Basic React UI with split panes

### Phase 2: R Integration (Day 1-2)
- R code execution via child process
- Output capture (stdout, stderr)
- Plot generation and display
- Error handling

### Phase 3: File Operations (Day 2)
- File watching with Chokidar
- Auto-reload on external changes
- Rmd parsing for code chunks
- Save/load functionality

### Phase 4: AI Integration (Day 3)
- Claude API integration
- Context-aware prompting
- Code suggestion interface
- Apply changes mechanism

### Phase 5: Enhanced Features (Day 4-5)
- Execution history logging
- Auto-run on change
- Cell-based execution
- Performance optimization

## Key Design Principles

1. **Real-time Updates**: Use WebSockets for instant feedback
2. **Separation of Concerns**: Clean service layer architecture
3. **Type Safety**: TypeScript everywhere for better maintainability
4. **User-Centric**: AI assistance integrated naturally into workflow
5. **Reproducibility**: All executions logged automatically

## Future Considerations

### Potential Migrations
- **To NestJS**: If we need microservices, complex auth, or team scaling
- **To Electron**: For native file system access and offline usage
- **To Cloud**: Deploy as SaaS with user workspaces

### Performance Optimizations
- R process pooling for faster execution
- Caching frequently used packages
- Incremental execution for large scripts
- WebAssembly for client-side R (long-term)

### Feature Expansions
- Collaborative editing
- Version control integration
- Package management UI
- Custom AI model fine-tuning
- Export to various formats (PDF, HTML, Jupyter)