import React from "react";
import { Box, Text, useInput } from "ink";
import type { PermissionDecision } from "../permissions.js";

interface PermissionGateProps {
  tool: string;
  summary: string;
  onDecide: (decision: PermissionDecision) => void;
}

export default function PermissionGate({ tool, summary, onDecide }: PermissionGateProps): React.ReactElement {
  useInput((char) => {
    const c = char.toLowerCase();
    if (c === "y") onDecide("yes");
    else if (c === "n") onDecide("no");
    else if (c === "a") onDecide("always");
  });

  return (
    <Box
      borderStyle="double"
      borderColor="yellow"
      flexDirection="column"
      paddingX={2}
      paddingY={1}
    >
      <Text color="yellow" bold>
        ⚠  Permission Required
      </Text>
      <Text> </Text>
      <Text>
        Tool: <Text bold>{tool}</Text>
      </Text>
      <Text dimColor>{summary}</Text>
      <Text> </Text>
      <Text>
        <Text color="green" bold>[y]</Text>
        <Text> yes  </Text>
        <Text color="red" bold>[n]</Text>
        <Text> no  </Text>
        <Text color="cyan" bold>[a]</Text>
        <Text> always allow</Text>
      </Text>
    </Box>
  );
}
