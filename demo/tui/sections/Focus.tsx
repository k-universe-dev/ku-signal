import React from "react";
import { Box, Text } from "ink";
import type { RuntimeState } from "../runtime.js";

export function Focus({ focus }: { focus: RuntimeState["focus"] }): React.ReactElement {
  return (
    <Box paddingX={1} flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>FOCUS</Text>
      {focus
        ? <Text color={focus.blocked ? "yellow" : "white"}>{focus.blocked ? "⚠ " : "◉ "}{focus.title}</Text>
        : <Text dimColor>◌ no active objective</Text>
      }
      {focus?.reason ? <Text dimColor>  {focus.reason}</Text> : null}
    </Box>
  );
}
