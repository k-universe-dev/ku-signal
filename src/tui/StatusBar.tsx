import React from "react";
import { Box, Text } from "ink";

interface StatusBarProps {
  model: string;
  provider: string;
  messageCount: number;
}

export function StatusBar({ model, provider, messageCount }: StatusBarProps): React.ReactElement {
  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Text color="blueBright" bold>BYTE</Text>
      <Text dimColor>{provider} / {model}</Text>
      <Text dimColor>{messageCount} msgs · /exit to quit</Text>
    </Box>
  );
}
