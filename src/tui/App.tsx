import React, { useState, useCallback } from "react";
import { Box, useApp } from "ink";
import { ConversationPane } from "./ConversationPane.js";
import { StatusBar } from "./StatusBar.js";
import { InputBox } from "./InputBox.js";
import type { Runner, RunnerMessage } from "../core/runner.js";

interface AppProps {
  runner: Runner;
  model: string;
  providerName: string;
}

export function App({ runner, model, providerName }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const [messages, setMessages] = useState<RunnerMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (content: string) => {
      if (content === "/exit" || content === "/quit") {
        exit();
        return;
      }

      if (content === "/clear") {
        runner.clearHistory();
        setMessages([]);
        return;
      }

      const userMsg: RunnerMessage = { role: "user", content };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const response = await runner.sendMessage(content);
        setMessages((prev) => [...prev, response]);
      } catch (err) {
        const errMsg: RunnerMessage = {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [runner, exit]
  );

  return (
    <Box flexDirection="column" height="100%">
      <StatusBar model={model} provider={providerName} messageCount={messages.length} />
      <ConversationPane messages={messages} loading={loading} />
      <InputBox onSubmit={handleSubmit} disabled={loading} />
    </Box>
  );
}
