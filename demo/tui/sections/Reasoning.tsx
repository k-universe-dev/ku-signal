import React from "react";
import { Box, Text } from "ink";
import type { RuntimeState } from "../runtime.js";
import { symbolFor } from "../runtime.js";

export function Reasoning({ nodes }: { nodes: RuntimeState["reasoning"] }): React.ReactElement {
  return (
    <Box paddingX={1} flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>REASONING</Text>
      {nodes.length === 0
        ? <Text dimColor>◌ no active reasoning</Text>
        : nodes.slice(0, 4).map((node) => (
            <Text key={node.id} dimColor={node.status !== "running"}>
              {symbolFor(node.status)} {node.text}
            </Text>
          ))
      }
    </Box>
  );
}
