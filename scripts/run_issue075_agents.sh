#!/usr/bin/env bash
set -euo pipefail

# Absolute repo root (script lives in scripts/).
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

run_manager() {
  codex exec --model gpt-5-codex-mini \
             --sandbox workspace-write \
             -C "${REPO_ROOT}" \
             -- "$(
                cat <<'PROMPT'
You are Manager Kai overseeing Issue 075 (Vitest CI). Keep work inside this repo,
coordinate coders’ worktrees, collect diagnostics, enforce validation gates, and
post status updates to docs/cto/. Do not push or fetch remotes without explicit approval.
PROMPT
             )"
}

run_coder_mira() {
  codex exec --model gpt-5-codex-mini \
             --sandbox workspace-write \
             -C "${REPO_ROOT}/wt/075/mira-ci-cleanup" \
             -- "$(
                cat <<'PROMPT'
You are Coder Mira working on Issue 075 (Vitest hang). Stay inside this worktree,
instrument client/vitest.config.ts and .github/workflows/ci.yml to eliminate the hang,
remove continue-on-error, and gather proof of stable runs. No pushes or remote fetches without instruction.
PROMPT
             )"
}

run_coder_atlas() {
  codex exec --model gpt-5-codex-mini \
             --sandbox workspace-write \
             -C "${REPO_ROOT}/wt/075/atlas-timeline-tests" \
             -- "$(
                cat <<'PROMPT'
You are Coder Atlas working on Issue 075 tests. Stay inside this worktree,
fix duplicate key warnings, stabilize TimelinePanel tests, ensure deterministic snapshots,
and prep changes for feature/075-vitest-ci. Avoid touching files outside the workspace
and do not push/fetch remotes without approval.
PROMPT
             )"
}

run_manager &
run_coder_mira &
run_coder_atlas &
wait
