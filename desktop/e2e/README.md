# Desktop E2E

This directory contains the minimal WebDriverIO suite that exercises the Re-prod desktop app via `tauri-driver`.

## Prerequisites

- `pnpm` (>=9) and Node.js 18 to run the test harness
- `cargo` and `tauri-driver` (`cargo install tauri-driver`)
- Native GTK/WebKit dependencies (`libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, etc.)
- R (>=4.3) so the desktop Rust backend can execute scripts

## Running the tests locally

1. Bootstrap dependencies from the repo root:
   ```sh
   pnpm install
   pnpm tauri build --debug
   ```
2. Ensure `tauri-driver` is installed and the built binary is available. By default the suite looks for `../target/debug/reprod-desktop` relative to this directory. Override with `TAURI_DRIVER_APP` if needed.
3. From this directory run:
   ```sh
   pnpm test
   ```
   Add `--debug` to the script or set `TAURI_DRIVER_ARGS`/`TAURI_DRIVER_TAURI_OPTIONS` for additional logging or alternative launch flags.

### Environment variables

- `TAURI_DRIVER_APP`: full path to the Tauri binary that should be driven
- `TAURI_DRIVER_EXECUTABLE`: command used to start the driver (defaults to `tauri-driver`)
- `TAURI_DRIVER_ARGS`: space-separated arguments passed to the driver (`--port 9515 --binary <path>` by default)
- `TAURI_DRIVER_HOST`, `TAURI_DRIVER_PORT`, `TAURI_DRIVER_PATH`: overrides for the WebDriver endpoint
- `TAURI_DRIVER_TAURI_OPTIONS`: JSON blob merged into the capability sent to the driver

## CI integration

The `ci.yml` workflow includes an `e2e-tests` job that only runs for pull requests targeting `main` (i.e. develop→main). It builds the Tauri app, installs `tauri-driver`, and runs the suite under `xvfb` for headless execution:

```yaml
e2e-tests:
  if: github.base_ref == 'main' && github.event_name == 'pull_request'
  steps:
    - run: pnpm install
    - run: pnpm tauri build --debug
    - run: cargo install tauri-driver
    - run: xvfb-run --auto-servernum pnpm --filter @reprod/e2e test
```

## Troubleshooting

- If the tests cannot find the app, double-check `TAURI_DRIVER_APP` and rebuild the desktop binary.
- Increase `TAURI_DRIVER_READY_TIMEOUT` if the driver takes longer than 15 s to warm up.
- Inspect the captured `tauri-driver` stdout/stderr (the config already pipes it to this process).
- The suite targets the `Run All` button and the console output; record the DOM structure before changing these selectors.
