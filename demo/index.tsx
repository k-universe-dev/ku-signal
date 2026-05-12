#!/usr/bin/env tsx
// demo/index.tsx — renders the runtime surface with the golden fixture
import React from "react";
import { render } from "ink";
import { App } from "./tui/App.js";
import type { RuntimeState } from "./tui/runtime.js";

const FIXTURE: RuntimeState = {
  identity: {
    app: "ku-signal",
    mode: "expanded",
    phase: "executing",
    role: "architect",
    model: "claude-sonnet-4-6",
    runtimeMs: 138000,
    tokenUsage: 84000,
    status: "active",
  },
  focus: { title: "permission middleware" },
  activity: [
    { id: "a1", label: "running integration tests", status: "running", progress: 0.42 },
    { id: "a2", label: "validating sandbox recursion", status: "running" },
  ],
  reasoning: [
    { id: "r1", text: "build escalation policy tree", status: "running", discoveredAt: Date.now() - 60000 },
    { id: "r2", text: "verify permission cascade", status: "done", discoveredAt: Date.now() - 120000 },
  ],
  operations: [
    { id: "o1", label: "extension host initialized", status: "done" },
    { id: "o2", label: "ipc bridge connected", status: "done" },
    { id: "o3", label: "sandbox validation stable", status: "done" },
  ],
  next: [
    { id: "n1", label: "audit logging", kind: "followup" },
    { id: "n2", label: "rollback guards", kind: "plan" },
  ],
  tools: [
    { id: "t1", name: "read_file", target: "src/runtime/ipc.ts", status: "done", startedAt: Date.now() - 5000, endedAt: Date.now() - 4877 },
    { id: "t2", name: "run_tests", status: "running", startedAt: Date.now() - 1000 },
  ],
  warnings: [],
  prompt: { text: "continue", quickActions: ["/step", "/debug", "/export"] },
};

const modeArg = process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1];
if (modeArg) {
  FIXTURE.identity.mode = modeArg as RuntimeState["identity"]["mode"];
}

render(<App initialState={FIXTURE} />);
