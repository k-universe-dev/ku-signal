// src/tui/SidePanel.tsx
import React from "react";
import { Box, Text } from "ink";

interface SidePanelProps {
  messageCount: number;
  tools: string[];
  provider: string;
}

export function SidePanel({ messageCount, tools, provider }: SidePanelProps): React.ReactElement {
  void provider;
  return (
    <Box
      flexDirection="column"
      width={16}
      borderStyle="single"
      paddingX={1}
      flexShrink={0}
    >
      <Text bold color="blueBright">SESSION</Text>
      <Text dimColor>{"─".repeat(12)}</Text>
      <Text dimColor>#0  {messageCount} msgs</Text>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="blueBright">TOOLS</Text>
        <Text dimColor>{"─".repeat(12)}</Text>
        {tools.map((t, i) => (
          <Text key={i} dimColor>○ {t}</Text>
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold color="blueBright">CMDS</Text>
        <Text dimColor>{"─".repeat(12)}</Text>
        {["/model", "/clear", "/tools", "/history", "/exit"].map((cmd) => (
          <Text key={cmd} dimColor>{cmd}</Text>
        ))}
      </Box>
    </Box>
  );
}
