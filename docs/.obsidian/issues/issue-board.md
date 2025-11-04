# Re-prod Issue Board

**Last Updated**: 2025-11-05

This board tracks all Re-prod issues with their priorities and current status. Update this file whenever issue status changes.

## Issue Status Legend

- ✅ **Completed**: Fully implemented and merged
- 🔶 **In Progress**: Partially implemented or actively being worked on
- ❌ **Not Started**: Not yet implemented
- 📋 **Planning**: In planning/design phase
- ❓ **Unknown**: Status needs verification

## Priority Levels

- 🔴 **P0**: Demo Critical - Must have for first public demo
- 🟡 **P1**: Demo Plus-One - Needed immediately after demo for polish
- 🟢 **P2**: Post-Demo - Extensions after demo readiness
- 📚 **Ref**: Reference documentation

---

## All Issues

| Priority | Issue | Title | Status | Notes |
|----------|-------|-------|--------|-------|
| 🔴 **P0** | **005** | R execution capture | 🔶 **In Progress** | ExecutionRequest/Event implemented, Timeline integration pending |
| 🔴 **P0** | **006** | Plot artifact capture | ✅ **Completed** | PNG plots display correctly |
| 🔴 **P0** | **007** | Session timeline data model | ❌ **Not Started** | Persistent storage design needed (SQLite suggested, not required) ← **TOP PRIORITY** |
| 🔴 **P0** | **008** | Session timeline UI | ❌ **Not Started** | Timeline UI components not implemented |
| 🔴 **P0** | **013** | R tool integration framework | ✅ **Completed** | ToolRegistry, Executor, Validator implemented and merged |
| 🔴 **P0** | **014** | R tool starter pack | ✅ **Completed** | 10 tool manifests implemented (dplyr, ggplot2, readr, base-stats, biostrings, seqinr, phangorn, ggtree, blast, samtools) with tests and example workflows |
| 🔴 **P0** | **015** | Reproduction export | ❌ **Not Started** | Requires timeline implementation |
| 🔴 **P0** | **016** | Shell execution service | ✅ **Completed** | Shell execution service implemented and merged via PR #9 |
| 🔴 **P0** | **017** | Demo assets | ✅ **Completed** | Demo assets prepared and merged via PR #8 |
| 🟡 **P1** | **003** | Provider registry/config | ❓ **Unknown** | Status needs verification |
| 🟡 **P1** | **009** | Edit history logging | ❌ **Not Started** | Track AI vs Human edits |
| 🟡 **P1** | **010** | R-aware AI context builder | ❌ **Not Started** | Pass workspace state to AI |
| 🟡 **P1** | **012** | Local model support | ❓ **Unknown** | Status needs verification |
| 🟢 **P2** | **001** | Provider authentication strategy | ❌ **Not Started** | Non-API-key authentication research |
| 🟢 **P2** | **002** | Auth JSON desktop flow | ❓ **Unknown** | Status needs verification |
| 🟢 **P2** | **004** | Provider selection UI | ❓ **Unknown** | Status needs verification |
| 🟢 **P2** | **011** | ACP external agent integration | ❌ **Not Started** | Zed-compatible Agent Client Protocol |
| 📚 **Ref** | **000** | Demo analysis scenario | 📖 **Reference** | Demo scenario documentation |
| 📚 **Ref** | **000** | Demo feature matrix | 📖 **Reference** | Feature matrix documentation |
| 📚 **Ref** | **000** | Demo workstreams | 📖 **Reference** | Work stream documentation |
| 📚 **Ref** | **018** | AI context awareness | 📋 **Planning** | AI Context implementation planning |

---

## Implementation Summary

### P0 Issues (9 total)
- ✅ **Completed**: 5 issues (006, 013, 014, 016, 017)
- 🔶 **In Progress**: 1 issue (005)
- ❌ **Not Started**: 3 issues (007, 008, 015)

**Completion Rate**: 56% (5/9 completed)

### P1 Issues (4 total)
- ❌ **Not Started**: 2 issues (009, 010)
- ❓ **Unknown**: 2 issues (003, 012)

### P2 Issues (4 total)
- ❌ **Not Started**: 1 issue (001)
- ❓ **Unknown**: 3 issues (002, 004, 011)

---

## Recommended Implementation Order

### Phase 1: Timeline Foundation (Top Priority)
1. **Issue 007**: Timeline data model design
   - Design persistent storage (SQLite, JSON, or other)
   - Define event schema for code blocks, plots, shell commands
   - Plan data retention and pruning strategy

2. **Issue 008**: Timeline UI implementation
   - Build timeline visualization components
   - Implement navigation and filtering
   - Add event detail views

3. **Issue 005**: Complete timeline integration
   - Integrate ExecutionRequest/Event with timeline storage
   - Connect R execution to timeline UI

### Phase 2: Tool Integration ✅ COMPLETED
4. **Issue 016**: ✅ Shell execution service (COMPLETED)
   - ✅ Implemented secure command runner
   - ✅ Added stdout/stderr capture
   - ✅ Integrated with timeline

5. **Issue 014**: ✅ R tool starter pack (COMPLETED)
   - ✅ Created 10 tool manifests (dplyr, ggplot2, readr, base-stats, biostrings, seqinr, phangorn, ggtree, blast, samtools)
   - ✅ Added 3 example workflows (phylogenetic, sequence analysis, NGS pipeline)
   - ✅ Wrote comprehensive automated tests (10 test cases)

### Phase 3: Export Functionality
6. **Issue 015**: Reproduction export
   - Implement export pipeline
   - Create bundle format (tarball/zip with metadata)
   - Add validation script

7. **Issue 017**: ✅ Demo assets (COMPLETED)
   - ✅ Prepared demo data and scripts
   - ✅ Documented demo workflow

---

## How to Update This Board

When an issue status changes:

1. Update the status emoji and text in the table
2. Update the "Implementation Summary" section
3. Update the "Last Updated" date at the top
4. Commit with message: `Update issue board: <brief description>`

Example commit:
```bash
git add issue-board.md
git commit -m "Update issue board: Mark Issue 007 as in progress"
```

---

## Notes

- **Issue 007**: SQLite is suggested but not required. Alternative storage methods (JSON, in-memory with export) are acceptable.
- **Issue 013**: Successfully completed and merged to develop branch.
- **Issue 014**: 10 comprehensive tool manifests completed with tests and workflows.
- **Issue 016**: Shell execution service completed and merged via PR #9.
- **Issue 017**: Demo assets completed and merged via PR #8.
- **Worktrees**: Issues 016 and 017 worktrees have been cleaned up. Issue 014 worktree still active.
