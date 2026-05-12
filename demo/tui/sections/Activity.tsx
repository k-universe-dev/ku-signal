import React from "react";
import { Box, Text } from "ink";
import type { RuntimeState } from "../runtime.js";
import { symbolFor } from "../runtime.js";

export function Activity({ items }: { items: RuntimeState["activity"] }): React.ReactElement {
  return (
    <Box paddingX={1} flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>ACTIVITY</Text>
      {items.length === 0
        ? <Text dimColor>◌ idle</Text>
        : items.map((item) => (
            <Box key={item.id}>
              <Text dimColor={item.status !== "running"}>
                {symbolFor(item.status)} {item.label}
              </Text>
              {item.progress !== undefined
                ? <Text color="cyan"> {Math.round(item.progress * 100)}%</Text>
                : null}
            </Box>
          ))
      }
    </Box>
  );
}
