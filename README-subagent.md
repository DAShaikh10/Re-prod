# Subagent A: Issue 038 – AI Diff UX

## Scope
- Implement diff/patch preview for AI suggestions per Issue 038.
- Update client-side typing + UI to show before/after and staged apply.

## Key Files
- `shared/src/types.ts` – extend `CodeBlock` metadata
- `client/src/core/ai/codeBlockUtils.ts` – parse structured code blocks
- `client/src/components/ai-panel/CodeBlockWithApply.tsx` (existing UI)
- `client/src/components/ai-panel` – new diff preview component(s)
- `client/src/hooks/useAIConversation.ts` – ensure message payloads carry metadata

## Required Deliverables
1. Extended type/interface definitions for structured code blocks (filepath, range, original code, checksum).
2. New diff preview UI (likely Monaco `DiffEditor`).
3. Refactored `CodeBlockWithApply` to integrate diff preview + validation states.
4. Tests (Vitest/RTL) covering diff rendering + state logic.
5. Documentation updates in `docs/.obsidian/issues/038-ai-diff-preview.md` as needed.

## Acceptance Criteria
- AI suggestions display diff preview before apply.
- Apply button respects per-hunk or per-range operations (paired with Issue 039’s new metadata).
- Warn when editor content changed since block generation.

## Checks to Run
- `pnpm --filter client lint`
- `pnpm --filter client test`

## TDD Expectations
- Start every change by adding or updating a failing test that captures the desired diff-preview behavior (e.g., snapshot mismatch, missing metadata guard).
- Implement just enough code to make the new/updated tests pass, then refactor while keeping the suite green.
- Include screenshots or notes in the PR/issue comment summarizing which tests were added and how they prove the behavior.

## Notes
- Coordinate with Issue 039 branch for new code-block schema.
- Keep UI styling non-“AI generated” per repo guidelines.
