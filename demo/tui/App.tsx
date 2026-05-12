// demo/tui/App.tsx
import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { Header } from "./Header.js";
import { Focus } from "./sections/Focus.js";
import { Activity } from "./sections/Activity.js";
import { Reasoning } from "./sections/Reasoning.js";
import { Operations } from "./sections/Operations.js";
import { Tools } from "./sections/Tools.js";
import { computeContext, sectionVisibility, VALID_MODES } from "./runtime.js";
import type { RuntimeState } from "./runtime.js";

interface AppProps {
  initialState: RuntimeState;
}

export function App({ initialState }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const [state, setState] = useState<RuntimeState>(initialState);
  const [modeIndex, setModeIndex] = useState(VALID_MODES.indexOf(initialState.identity.mode));
  const startMs = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => ({
        ...s,
        identity: { ...s.identity, runtimeMs: Date.now() - startMs.current },
      }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useInput((input, key) => {
    if (input === "q") { exit(); return; }
    if (key.rightArrow) {
      setModeIndex((i) => {
        const next = (i + 1) % VALID_MODES.length;
        setState((s) => ({ ...s, identity: { ...s.identity, mode: VALID_MODES[next] } }));
        return next;
      });
    }
    if (key.leftArrow) {
      setModeIndex((i) => {
        const prev = (i - 1 + VALID_MODES.length) % VALID_MODES.length;
        setState((s) => ({ ...s, identity: { ...s.identity, mode: VALID_MODES[prev] } }));
        return prev;
      });
    }
  });

  // suppress unused warning — modeIndex drives setState side effect above
  void modeIndex;

  const ctx = computeContext(state, {
    width: process.stdout.columns ?? 80,
    height: process.stdout.rows ?? 24,
    unicode: true,
    color: true,
  });
  const vis = sectionVisibility(ctx.mode, ctx.density);

  return (
    <Box flexDirection="column">
      <Header
        model={state.identity.model}
        provider="demo"
        mode={state.identity.mode}
        phase={state.identity.phase}
        runtimeMs={state.identity.runtimeMs}
        status={state.identity.status}
      />
      <Box flexDirection="column" paddingY={1}>
        {vis.focus !== "H" && <Focus focus={state.focus} />}
        {vis.activity !== "H" && <Activity items={state.activity} />}
        {vis.reasoning !== "H" && <Reasoning nodes={state.reasoning} />}
        {vis.operations !== "H" && <Operations items={state.operations} />}
        {vis.tools !== "H" && <Tools items={state.tools} />}
      </Box>
      <Box paddingX={1} borderStyle="single">
        <Text dimColor>← → cycle mode  ·  q quit  ·  density: {ctx.density}</Text>
      </Box>
    </Box>
  );
}
