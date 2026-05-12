import React from "react";
import { Box, Text } from "ink";
import type { RuntimeState } from "../runtime.js";
import { symbolFor } from "../runtime.js";

export function Tools({ items }: { items: RuntimeState["tools"] }): React.ReactElement {
  return (
    <Box paddingX={1} flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>TOOLS</Text>
      {items.length === 0
        ? <Text dimColor>○ none called</Text>
        : items.slice(-4).map((item) => (
            <Text key={item.id} dimColor={item.status === "done"}>
              {symbolFor(item.status)} {item.name}{item.target ? ` → ${item.target}` : ""}
            </Text>
          ))
      }
    </Box>
  );
}
