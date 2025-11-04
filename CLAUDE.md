# Issue 015: Reproduction Export (Design Phase)

## ⚠️ IMPORTANT: Read Issue 019 First
**Before starting, read `docs/.obsidian/issues/019-timeline-api-contract.md`**

Issue 019 defines ExecutionEvent structure which is the foundation of export bundles.

## Objective
Design (and optionally implement) the reproduction export system for full session replay.

## Background
- Read `docs/.obsidian/issues/015-reproduction-export.md`
- Read `docs/.obsidian/api/timeline-api-contract.md` (Issue 019)
- Review `core/src/protocol.rs` for ExecutionEvent structure

## Key Dependencies
✅ Issue 005: ExecutionEvent schema (completed)
✅ Issue 019: Timeline types (completed - **READ THIS**)
⏳ Issue 007: Timeline storage (needed for export source)
⏳ Issue 008: Timeline UI (needed for export trigger)

## Phase 1: Design (Can Start Now)

Design the export format, metadata structure, and validation strategy WITHOUT needing Issue 007/008.

### 1. Export Bundle Format Design

**Option A: Tarball with Metadata**
```
reproduction-bundle-2025-11-05-10-23-45.tar.gz
├── metadata.json
├── timeline.json
├── code/
│   ├── analysis.R
│   ├── plots.R
│   └── models.R
├── plots/
│   ├── plot_001.png
│   ├── plot_002.png
│   └── plot_003.png
├── artifacts/
│   └── output.csv
└── validate.sh
```

**Option B: ZIP with Same Structure**

### 2. Metadata Schema Design

**File**: Design `metadata.json` structure

```json
{
  "format_version": "1.0",
  "created_at": "2025-11-05T10:23:45Z",
  "re_prod_version": "0.1.0",
  "session": {
    "start_time": 1699200000000,
    "end_time": 1699210000000,
    "duration_ms": 10000000,
    "total_events": 42
  },
  "environment": {
    "r_version": "4.3.0",
    "r_path": "/usr/local/bin/Rscript",
    "platform": "macos",
    "working_dir": "/Users/user/project"
  },
  "statistics": {
    "total_executions": 42,
    "user_actions": 30,
    "ai_actions": 12,
    "total_plots": 15,
    "total_errors": 2
  },
  "files": {
    "timeline": "timeline.json",
    "code": ["code/analysis.R", "code/plots.R"],
    "plots": ["plots/plot_001.png", "plots/plot_002.png"],
    "artifacts": ["artifacts/output.csv"]
  }
}
```

### 3. Timeline Export Format

**File**: Design `timeline.json` structure

```json
{
  "events": [
    {
      "event_id": "evt-001",
      "timestamp": 1699200123456,
      "actor": "user",
      "source": "cell",
      "document": "analysis.R",
      "code": "data <- read.csv('input.csv')",
      "result": {
        "success": true,
        "output": "[1] 42\n",
        "execution_time_ms": 150
      },
      "artifacts": {
        "plots": ["plots/plot_001.png"]
      }
    }
  ]
}
```

### 4. Validation Script Design

**File**: Design `validate.sh` or `validate.R`

```bash
#!/bin/bash
# Validation script to verify bundle integrity

echo "Validating reproduction bundle..."

# Check metadata.json exists
if [ ! -f metadata.json ]; then
  echo "ERROR: metadata.json not found"
  exit 1
fi

# Check timeline.json exists
if [ ! -f timeline.json ]; then
  echo "ERROR: timeline.json not found"
  exit 1
fi

# Validate JSON schema
# Check file references
# Verify plot files exist
# etc.

echo "Validation complete!"
```

### 5. Replay Script Design

**File**: Design `replay.R` or `replay.sh`

```r
# Replay script to re-execute timeline events

library(jsonlite)

# Load timeline
timeline <- fromJSON("timeline.json")

# Execute events in order
for (event in timeline$events) {
  cat(sprintf("Executing event %s...\n", event$event_id))
  
  # Execute code
  result <- tryCatch({
    eval(parse(text = event$code))
  }, error = function(e) {
    list(success = FALSE, error = e$message)
  })
  
  # Compare with expected result
  # ...
}
```

## Phase 2: Implementation (After Issue 007/008)

### 6. Export Service Implementation

**File**: `core/src/export/bundle.rs` (NEW)

```rust
pub struct ReproductionBundle {
    metadata: Metadata,
    events: Vec<ExecutionEvent>,
    artifacts: Vec<Artifact>,
}

impl ReproductionBundle {
    pub fn create(timeline: &SqliteTimeline) -> Result<Self> {
        // Gather all events
        // Collect artifacts
        // Generate metadata
    }
    
    pub fn write_tarball(&self, path: &Path) -> Result<()> {
        // Create tarball
    }
    
    pub fn validate(&self) -> Result<ValidationReport> {
        // Validate bundle integrity
    }
}
```

### 7. UI Export Trigger

**File**: `client/src/components/timeline/ExportButton.tsx` (NEW)

```typescript
export function ExportButton() {
  const handleExport = async () => {
    // Request export from backend
    const response = await socketService.send({
      type: 'export_timeline',
      format: 'tarball'
    });
    
    // Download file
    downloadFile(response.file_path);
  };
  
  return <button onClick={handleExport}>Export Session</button>;
}
```

## Deliverables for Phase 1 (Design)

### Documentation
- [ ] Export bundle format specification
- [ ] Metadata schema (metadata.json)
- [ ] Timeline export format (timeline.json)
- [ ] Validation script specification
- [ ] Replay script specification
- [ ] Implementation plan

### Design Decisions
- [ ] Archive format (tar.gz vs zip)
- [ ] Metadata structure
- [ ] File organization
- [ ] Validation strategy
- [ ] Replay strategy

## Design Questions to Answer

1. **Bundle Format**: Tarball or ZIP?
2. **Compression**: gzip, bzip2, or none?
3. **File Structure**: Flat or hierarchical?
4. **Validation**: Shell script, R script, or both?
5. **Replay**: Manual or automated?
6. **Versioning**: How to handle format changes?
7. **Large Files**: How to handle huge plots/artifacts?
8. **Incremental Export**: Support partial timeline export?

## Success Criteria (Phase 1 - Design)

✅ Bundle format specified
✅ Metadata schema defined
✅ Timeline export format defined
✅ Validation script designed
✅ Replay script designed
✅ Documentation complete
✅ Ready for implementation (Phase 2)

## Success Criteria (Phase 2 - Implementation)

✅ Export service creates valid bundles
✅ Bundle includes all events and artifacts
✅ Validation script verifies integrity
✅ Replay script re-executes successfully
✅ UI export button works
✅ Integration tests pass

## Implementation Checklist (Phase 2)

- [ ] Implement `core/src/export/bundle.rs`
- [ ] Implement `core/src/export/metadata.rs`
- [ ] Implement validation script
- [ ] Implement replay script
- [ ] Add WebSocket handler for export
- [ ] Add UI export button
- [ ] Write integration tests
- [ ] Test with real session data

## Start (Phase 1 - Design)

1. Read `docs/.obsidian/issues/015-reproduction-export.md`
2. Read `docs/.obsidian/api/timeline-api-contract.md`
3. Review ExecutionEvent structure in `core/src/protocol.rs`
4. Begin documenting bundle format design
5. Design metadata.json schema
6. Design validation script

**Note**: Phase 1 can be completed WITHOUT Issue 007/008. Phase 2 requires them.
