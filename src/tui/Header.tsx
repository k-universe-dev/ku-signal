// src/tui/Header.tsx
import React from "react";
import { Box, Text } from "ink";

interface HeaderProps {
  model: string;
  provider: string;
  messageCount: number;
}

export default function Header({ model, provider, messageCount }: HeaderProps): React.ReactElement {
  return (
    <Box borderStyle="single" paddingX={1}>
      <Box flexGrow={1}>
        <Text color="blueBright" bold>KU</Text>
        <Text bold>·</Text>
        <Text bold>Signal</Text>
      </Box>
      <Box>
        <Text dimColor>{model} @ {provider}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text dimColor>{messageCount}</Text>
      </Box>
    </Box>
  );
}
