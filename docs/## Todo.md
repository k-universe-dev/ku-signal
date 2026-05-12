# Source-of-Truth/"SOT" Files Cleanup & Reorganization

## Session Name: Big _"SOT"_ Cleanup Operation

### Operation Name: #SOT-Cleanup {#sot-cleanup-operation}

#### **Todo's List** {#todos-list}

- Clean up the source-of-truth/SOT files below and related assets.
- Reduce the number of files to the core minimum needed for a single source of truth.
- Ensure all files are up to date and consistent with each other.

##### Search Rules & Instructions

**Grep/Regex Patterns:**

- `source-of-truth.*` - Match all SOT-related files
- `SOURCE-OF-TRUTH\.(md|yaml|json)$` - Match core SOT files
- `^source-of-truth-[a-z0-9]{3,4}$` - Match versioned/backup files

**Semantic Search:**

- Search for: "source of truth", "SOT", "single source"
- Look for: duplicate metadata, conflicting configurations, outdated references

**Indexing Reference:**

- [#SOT-Cleanup](#sot-cleanup-operation) - Main Operation
- [Todo's List](#todos-list) - Tasks Overview
- [Files/Paths](#filepaths--core-sot-files) - Indexed Locations

##### Files/Paths: Core SOT Files

**Primary Location:**

- `D:\home\byte\cfg\SOURCE-OF-TRUTH.md` — canonical authority
- `D:\home\byte\cfg\SOURCE-OF-TRUTH.meta.yaml` — minimal metadata companion
- `D:\home\byte\cfg\SOURCE-OF-TRUTH.index.json` — machine-readable section index
- `D:\SOURCE-OF-TRUTH.md` — root redirect only, not a second authority

**Backup/Legacy Location:**
`D:\home\byte\backups\windsurf-archive\plans\`

- source-of-truth-cleanup-70e16a.md
- source-of-truth-separation-a7cd22.md
- source-of-truth-config-audit-7834a0.md
- source-of-truth-status-cleanup-a7cd22.md
- source-of-truth-first-enforcement-183a03.md
- smart-dev-source-of-truth-70e16a.md
- k-opencode-source-of-truth-db8334.md
- opencode-source-of-truth-consolidation-983787.md

**Cleanup Archive Target:**
`D:\home\byte\backups\safe-cleanup\2026-05-10-sot-cleanup\`

**Execution Note:**
This harness note tracks the operation only. It is not itself a source of truth and must always defer to `D:\home\byte\cfg\SOURCE-OF-TRUTH.md`.
