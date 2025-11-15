#!/usr/bin/env bash
set -euo pipefail

# Script to resume the two Issue 075 coder sessions via `codex resume`.
# Run this from the repo root and ensure the listed session IDs are current.

SESSIONS=(
  "019a7d93-fe62-7601-9794-35884ddcc052" # Mira | wt/075/mira-ci-cleanup
  "019a7d93-fe57-7a93-82cd-844b52d53a29" # Atlas | wt/075/atlas-timeline-tests
)

for SESSION_ID in "${SESSIONS[@]}"; do
  echo "Resuming coder session ${SESSION_ID}…"
  codex resume "${SESSION_ID}" -- "Continue"
done
