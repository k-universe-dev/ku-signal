// demo/tui/Header.tsx
import React from "react";
import { Box, Text } from "ink";
import type { RuntimeMode, RuntimePhase } from "./runtime.js";
import { formatRuntime } from "./runtime.js";

interface HeaderProps {
  model: string;
  provider: string;
  mode: RuntimeMode;
  phase: RuntimePhase;
  runtimeMs: number;
  status: "idle" | "active" | "blocked" | "error" | "complete";
}

export function Header({ model, provider, mode, phase, runtimeMs, status }: HeaderProps): React.ReactElement {
  const statusColor = status === "active" ? "green" : status === "error" ? "red" : status === "blocked" ? "yellow" : "white";
  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Box>
        <Text color="blueBright" bold>KU·Signal</Text>
        <Text dimColor>  {model} @ {provider}</Text>
      </Box>
      <Box>
        <Text dimColor>{mode} · {phase} · {formatRuntime(runtimeMs)} </Text>
        <Text color={statusColor}>●</Text>
      </Box>
    </Box>
  );
}
