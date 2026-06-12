import React, { useState, useEffect } from "react";
import { Box, Text, Static } from "ink";

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

function MessageItem({ msg, animate }: { msg: TUIMessage; animate: boolean }): React.ReactElement {
  if (msg.role === "user") {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text color="cyan" bold>you</Text>
        <Text wrap="wrap">{msg.content}</Text>
      </Box>
    );
  }
  return <AssistantMessage content={msg.content} animate={animate} />;
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

  const lastMsg = messages[messages.length - 1];
  // Last assistant message animates only when we're not already loading the next one
  const lastIsAnimating = !loading && lastMsg.role === "assistant";

  // Completed messages → Static (flushed to scrollback, never re-rendered)
  const staticMessages = lastIsAnimating ? messages.slice(0, -1) : messages;

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1} paddingTop={1} overflow="hidden">
      <Static items={staticMessages}>
        {(msg, i) => <MessageItem key={i} msg={msg} animate={false} />}
      </Static>
      {lastIsAnimating && <MessageItem msg={lastMsg} animate={true} />}
      {loading && (
        <Box>
          <Text color="yellow" dimColor>ku-signal is thinking...</Text>
        </Box>
      )}
    </Box>
  );
}
