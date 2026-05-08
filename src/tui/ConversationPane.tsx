import React from "react";
import { Box, Text } from "ink";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationPaneProps {
  messages: Message[];
  loading: boolean;
}

export function ConversationPane({ messages, loading }: ConversationPaneProps): React.ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {messages.length === 0 && (
        <Text dimColor>Start typing to talk to BYTE...</Text>
      )}
      {messages.map((msg, i) => (
        <Box key={i} flexDirection="column" marginBottom={1}>
          <Text color={msg.role === "user" ? "cyan" : "greenBright"} bold>
            {msg.role === "user" ? "you" : "byte"}
          </Text>
          <Text wrap="wrap">{msg.content}</Text>
        </Box>
      ))}
      {loading && <Text color="yellow" dimColor>thinking...</Text>}
    </Box>
  );
}
