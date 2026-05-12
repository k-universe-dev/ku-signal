import React from "react";
import { Box, Text } from "ink";
import type { RuntimeState } from "../runtime.js";
import { symbolFor } from "../runtime.js";

export function Operations({ items }: { items: RuntimeState["operations"] }): React.ReactElement {
  const visible = items.slice(-5);
  return (
    <Box paddingX={1} flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>OPERATIONS</Text>
      {visible.length === 0
        ? <Text dimColor>✓ nothing completed yet</Text>
        : visible.map((item) => (
            <Text key={item.id} dimColor>
              {symbolFor(item.status)} {item.label}
            </Text>
          ))
      }
    </Box>
  );
}
