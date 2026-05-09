# Systematic Debugging Runbook

**K-Universe Agent Harness**

---

## Phase 1: Root Cause Trace

1. Reproduce the bug reliably — find the minimal trigger
2. Check logs for the exact error message and stack trace
3. Trace backwards from the error to the first invalid state
4. Identify which invariant was violated (protocol, state, job)

## Phase 2: Defense-in-Depth

1. Add validation at the boundary where the bug entered
2. Add assertions in the core logic that should have caught it
3. Add monitoring/telemetry to detect similar issues early

## Phase 3: Condition-Based Waiting

1. Identify the async boundary where the race occurred
2. Add proper synchronization (mutex, queue, or state check)
3. Ensure cancellation is cooperative, not forced

## Phase 4: Verification-Before-Completion

1. Write a test that reproduces the exact bug
2. Run the test — it must fail before the fix
3. Apply the fix
4. Run the test — it must pass
5. Run the full test suite — no regressions
6. Run `npm run verify` — all K-Wire checks pass

---

## Checklist

- [ ] Bug reproduced with minimal steps
- [ ] Root cause identified (not just symptom)
- [ ] Fix applied at the correct layer (protocol, core, adapter)
- [ ] Test added that catches this specific bug
- [ ] Full test suite passes
- [ ] K-Wire Verification passes
- [ ] No silent failures — all errors emit `JobCompleteEvent(successful: false)`
