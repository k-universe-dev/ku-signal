import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";

export interface TUIMessage {
  role: "user" | "assistant";
  content: string;
}

export function typewriterChars(text: string, frameCount: number, charsPerFrame: number): string {
  const count = Math.min(text.length, frameCount * charsPerFrame);
  return text.slice(0, count);
}

interface AssistantMessageProps {
  content: string;
  animate: boolean;
}

function AssistantMessage({ content, animate }: AssistantMessageProps): React.ReactElement {
  const [frame, setFrame] = useState(animate ? 0 : content.length);

  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => {
      setFrame((f) => {
        if (f >= content.length) {
          clearInterval(id);
          return f;
        }
        return f + 4;
      });
    }, 60);
    return () => clearInterval(id);
  }, [content, animate]);

  const visible = typewriterChars(content, frame, 1);

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="greenBright" bold>ku-signal</Text>
      <Text wrap="wrap">{visible}{animate && frame < content.length ? "▌" : ""}</Text>
    </Box>
  );
}

interface MessageListProps {
  messages: TUIMessage[];
  loading: boolean;
}

export function MessageList({ messages, loading }: MessageListProps): React.ReactElement {
  if (messages.length === 0) {
    return (
      <Box flexGrow={1} paddingX={1} paddingTop={1}>
        <Text dimColor>Start typing to talk to KU-Signal...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} paddingTop={1}>
      {messages.map((msg, i) => {
        const isLastAssistant = msg.role === "assistant" && i === messages.length - 1;

        if (msg.role === "user") {
          return (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Text color="cyan" bold>you</Text>
              <Text wrap="wrap">{msg.content}</Text>
            </Box>
          );
        }

        return (
          <AssistantMessage
            key={i}
            content={msg.content}
            animate={isLastAssistant && !loading}
          />
        );
      })}
      {loading && (
        <Box>
          <Text color="yellow" dimColor>ku-signal is thinking...</Text>
        </Box>
      )}
    </Box>
  );
}
