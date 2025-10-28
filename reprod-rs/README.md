# Re-prod Rust Workspace

Rust workspace for Re-prod desktop application with Tauri.

## Prerequisites

- Rust (latest stable)
- Node.js (for frontend)
- R (for code execution)

## Project Structure

```
reprod-rs/
├── protocol/      # Shared types
├── common/        # Error handling
├── core/          # Business logic
└── desktop/       # Tauri desktop app
```

## Development

### Run desktop app in dev mode

```bash
cd desktop
cargo tauri dev
```

### Build desktop app

```bash
cd desktop
cargo tauri build
```

### Check workspace

```bash
cargo check --workspace
```

## Configuration

The app uses `~/.reprod/auth.json` for configuration:

```json
{
  "anthropic_api_key": "your-api-key",
  "r_path": "Rscript"
}
```
