# ZIP Script Audit — `script.py` and `script_1.py`

**Source ZIP:** `C:\Users\Byte\Downloads\k2-agent-harness-assets.zip`
**Audit date:** 2026-05-08
**Status:** Both scripts read-only audited. **Not executed.** Safe but unnecessary — the canonical files were extracted directly from the nested ZIP.

---

## Manifest (outer ZIP)

| File                                   | Size  | SHA256                                          |
| -------------------------------------- | ----- | ----------------------------------------------- |
| `script.py`                            | 47198 | `2820E8DB7AB6957265535AC9D36D5568E7084BE8DD10…` |
| `script_1.py`                          | 1735  | `6023E5743073C1ED1FE26FA17F2A9A5BD6BC7272E589…` |
| `k2-agent-harness-assets.zip` (nested) | 19163 | `BECF2A4786AD324C0B2A056102984515DFBA6C4EA9ED…` |

---

## `script.py` — Asset Bundle Generator

**Purpose:** Builds the nested `k2-agent-harness-assets.zip` from a Python `dict` of inline file content.

**Behavior:**

- Creates `output/` directory (relative to CWD).
- Writes 19 files (docs, src, scripts, notes) into `output/k2-agent-harness-assets/`.
- Zips that folder into `output/k2-agent-harness-assets.zip`.
- No network, no shell-out, no eval, no destructive ops outside `output/`.

**Verdict:** Safe. Pure file emitter. Useful as a **regeneration template** if the bundle ever needs to be re-emitted from edits to the inline strings.

**Disposition:** Kept in `_incoming/outer/` for reference. **Do not run** — the real files are already extracted to project root and may have diverged.

---

## `script_1.py` — K-Wire Verification Script

**Purpose:** Reads the generated ZIP and prints the K-Wire invariant checks.

**Behavior:**

- Opens `output/k2-agent-harness-assets.zip` (read-only).
- Decodes 5 specific `.ts` files.
- Greps for invariant strings (`SessionStateSnapshotSchema`, `protocolVersion: z.literal("1.0")`, the 5 `AgentCore` methods, banned provider imports).
- Prints PASS/FAIL.

**Verdict:** Safe. Pure read + string-match. No mutation.

**Disposition:** Kept in `_incoming/outer/`. **Superseded by `scripts/verify.ts`** (the real TypeScript verifier in the bundle), which is the canonical version.

---

## Why Neither Was Executed

1. The nested ZIP was already a complete asset payload — extraction directly produced the canonical `src/`, `docs/`, `scripts/`, `notes/` tree.
2. Running `script.py` would have written to `output/` in CWD, polluting the project root.
3. `script_1.py` expects a specific relative path (`output/k2-agent-harness-assets.zip`) and is a Python rewrite of `scripts/verify.ts` — the TS version is canonical.

The K-Wire invariant checks were instead run inline via PowerShell against the extracted files. All checks pass — see `notes/kwire-verification-report.md`.
