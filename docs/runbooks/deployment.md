# Deployment Runbook

**K-Universe Agent Harness**

---

## Pre-Deploy Checks

- [ ] `npm run build` passes with zero errors
- [ ] `npm run verify` reports all K-Wire checks PASS
- [ ] All tests pass: `npm test`
- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated
- [ ] No `console.log` left in production code
- [ ] Environment variables documented in `.env.example`

## Deploy Steps

1. **Build:** `npm run build`
2. **Verify:** `npm run verify`
3. **Tag:** `git tag v$(node -p "require('./package.json').version")`
4. **Push:** `git push origin main --tags`
5. **Publish:** `npm publish` (if public package)

## Post-Deploy Verification

- [ ] Install in clean directory: `npm install k2-agent-harness`
- [ ] Run `bash scripts/install.sh` on fresh clone
- [ ] Run `npm run verify` in installed package
- [ ] Test CLI adapter: `echo '{"type":"CreateSession","protocolVersion":"1.0","config":{"modelId":"test"}}' | npx ts-node src/adapters/cli.ts`
- [ ] Check WebSocket adapter starts: `npm run socket`

## Rollback Plan

1. Identify last known good version from git tags
2. `git checkout vX.Y.Z`
3. `npm install && npm run build`
4. Update deployment target to previous version
5. Verify rollback with same post-deploy checks

---

## Emergency Contacts

- K-Ops on-call: `#k-ops-alerts` (Discord)
- Escalation: K-Universe maintainer
