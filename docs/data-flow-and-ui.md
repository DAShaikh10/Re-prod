# Re-Prod Data Flow & UI Design

## Quick Reference - Data Flow

### Core Data Flow Loop
```
User Input → WebSocket → Server → R Process → Output → WebSocket → UI Update
     ↑                                                                    │
     └────────────────── User sees results ──────────────────────────────┘
```

### Real-time File Watching Flow
```
External Edit → File System → Chokidar → Server → WebSocket → Editor Update
                                 ↓
                          Auto-execute if enabled
                                 ↓
                            R Process → Output Panel
```

### AI Assistance Flow
```
Code + Question → Server → Claude API → Response → Apply/Reject
                    ↑                                    ↓
              Include context                    Update Editor
              (execution history,
               current file)
```

## UI Layout - RStudio-Style Design

### Desktop Layout (All panes resizable via drag handles)
```
┌─────────────────────────────────────────┬──────────────────┐
│                                         │                  │
│                                         │   AI Assistant   │
│            Code Editor                  │     (25-30%)     │
│              (60-65%)                   │                  │
│                                         ├──────────────────┤
│                                         │                  │
│                                         │   Plots/Graphs   │
│                                         │   (Square-ish)   │
│                                         │                  │
├─────────────────────────────────────────┴──────────────────┤
│                   Console/Output (20% height)              │
│                 (Resizable, can expand to ~40%)            │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Layout with Tabs
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Re-Prod                                                    [─][□][X]    │
├─────────────────────────────────────────────────────────────────────────┤
│ File  Edit  Code  View  Plots  Session  Build  Debug  Tools  Help       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌───────────────────────────────────────────┬─────────────────────────┐ │
│ │ 📄 analysis.Rmd                  [▶Run]   │ AI Assistant     [⚙️]   │ │
│ ├───────────────────────────────────────────┤ ┌─────────────────────┐ │ │
│ │ 1  # Data Analysis                         │ │ 💬 How can I help?  │ │ │
│ │ 2  library(tidyverse)                      │ │                     │ │ │
│ │ 3                                           │ │ Recent suggestions: │ │ │
│ │ 4  # Load data                              │ │ • Use glimpse()     │ │ │
│ │ 5  data <- read_csv("data.csv")             │ │ • Try ggplot2 for   │ │ │
│ │ 6                                           │ │   visualization     │ │ │
│ │ 7  # Basic summary                          │ │                     │ │ │
│ │ 8  summary(data)                            │ │ ┌─────────────────┐ │ │ │
│ │ 9                                           │ │ │ Ask a question  │ │ │ │
│ │ 10 # Visualization                          │ │ └─────────────────┘ │ │ │
│ │ 11 ggplot(data, aes(x=var1, y=var2)) +     │ └─────────────────────┘ │ │
│ │ 12   geom_point()                           │ ═══════════════════════ │ │
│ │ 13                                          │ Plots │ Viewer │ Help  │ │
│ │ 14                                          │ ┌─────────────────────┐ │ │
│ │ 15                                          │ │                     │ │ │
│ │ 16                                          │ │   📊 Plot Area      │ │ │
│ │ 17                                          │ │                     │ │ │
│ │ 18                                          │ │   [Scatter plot     │ │ │
│ │ 19                                          │ │    visualization]   │ │ │
│ │ 20                                          │ │                     │ │ │
│ │                                             │ │ [◀] [▶] [🔍] [💾]   │ │ │
│ │                                             │ └─────────────────────┘ │ │
│ └───────────────────────────────────────────┴─────────────────────────┘ │
│ ═════════════════════════════════════════════════════════════════════════  │
│ Console │ Terminal │ Jobs │ History                              [▲]    │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ > summary(data)                                                     │ │
│ │      var1              var2                                         │ │
│ │  Min.   :  1.00     Min.   :  0.00                                 │ │
│ │  Mean   : 50.50     Mean   : 25.00                                 │ │
│ │  Max.   :100.00     Max.   : 50.00                                 │ │
│ │ >                                                                   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pane Configuration (Default Sizes)
- **Code Editor**: 60-65% width
- **Right Panel**: 35-40% width
  - **AI Assistant**: Upper ~50% of right panel
  - **Plots/Viewer**: Lower ~50% of right panel
- **Console**: 20% height (expandable to 40%)
- **All panes**: Resizable via drag handles (using react-split-pane or similar)

## Component Communication

### 1. Editor Component Events
```
Editor
  ├── onChange → debounce(500ms) → save-draft
  ├── onExecute → execute-code → R Process
  └── onCursorPosition → update-context → AI Service
```

### 2. AI Panel Events
```
AI Panel
  ├── onQuestion → send with code context
  ├── onApplyCode → update editor + mark as AI-generated
  └── onReject → log rejection for learning
```

### 3. Output Panel Events
```
Output Panel
  ├── Console Tab → Show text output
  ├── Plots Tab → Show generated images
  └── History Tab → Show execution log
```

## State Management

### Global State (React Context/Redux)
```javascript
{
  editor: {
    content: string,
    filepath: string,
    isDirty: boolean,
    cursorPosition: { line, column }
  },
  execution: {
    isRunning: boolean,
    currentCell: number,
    results: Array<Result>,
    history: Array<Execution>
  },
  ai: {
    messages: Array<Message>,
    isLoading: boolean,
    suggestions: Array<Suggestion>
  },
  settings: {
    autoRun: boolean,
    theme: 'light' | 'dark',
    rPath: string
  },
  layout: {
    editorWidth: 65,  // percentage
    rightPanelWidth: 35,
    aiPanelHeight: 50,  // percentage of right panel
    consoleHeight: 20   // percentage of window
  }
}
```

## WebSocket Events Reference

### Client → Server
- `execute`: Run R code
- `watch-file`: Start watching file
- `unwatch-file`: Stop watching file
- `ai-request`: Get AI assistance
- `save-file`: Save current content
- `load-file`: Load file content

### Server → Client
- `execution-result`: R execution output
- `execution-error`: R execution error
- `file-changed`: External file change
- `ai-response`: AI suggestion
- `plot-generated`: New plot available
- `status-update`: Server status

## Performance Considerations

### Debouncing/Throttling
```
User typing → debounce(500ms) → Auto-save
File changes → throttle(1000ms) → Auto-execute
Scroll events → throttle(100ms) → Update viewport
Pane resize → throttle(50ms) → Update layout
```

### Lazy Loading
```
- Monaco Editor: Load on demand
- AI Panel: Load when first opened
- Plot viewer: Virtual scrolling for many plots
```

## Error Handling Flow

```
Error Occurs
     ↓
Categorize Error Type
     ├── R Syntax Error → Show in Output Panel
     ├── R Runtime Error → Show in Output Panel + Suggestions
     ├── Network Error → Show toast + Retry option
     ├── AI API Error → Fallback to local suggestions
     └── File System Error → Show modal + Recovery options
```

## Keyboard Shortcuts

```
Cmd/Ctrl + Enter     : Run current cell
Shift + Enter        : Run cell and move to next
Cmd/Ctrl + S        : Save file
Cmd/Ctrl + Shift + I : Open AI assistant
Cmd/Ctrl + Shift + C : Clear output
Cmd/Ctrl + /        : Toggle comment
```

## Resizable Panes Implementation

Using `react-split-pane` or `allotment` for smooth resizing:

```javascript
// Example layout structure
<SplitPane split="horizontal" defaultSize="80%">
  <SplitPane split="vertical" defaultSize="65%">
    <EditorPane />
    <SplitPane split="horizontal" defaultSize="50%">
      <AIAssistantPane />
      <PlotsPane />
    </SplitPane>
  </SplitPane>
  <ConsolePane />
</SplitPane>
```