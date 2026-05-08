// src/tui/App.tsx
import React, { useState, useCallback } from "react";
import { Box, useApp } from "ink";
import Header from "./Header.js";
import { SidePanel } from "./SidePanel.js";
import { MessageList, type TUIMessage } from "./MessageList.js";
import SlashInput from "./SlashInput.js";
import { parseSlashCommand } from "./commands.js";
import { allTools } from "../tools/index.js";
import type { Runner } from "../core/runner.js";

interface AppProps {
  runner: Runner;
  model: string;
  providerName: string;
}

const TOOL_NAMES = allTools.map((t) => t.definition.name);

export function App({ runner, model, providerName }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const [messages, setMessages] = useState<TUIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState(model);

  const handleSubmit = useCallback(
    async (input: string) => {
      const slash = parseSlashCommand(input);

      if (slash) {
        switch (slash.name) {
          case "exit":
            exit();
            return;
          case "clear":
            runner.clearHistory();
            setMessages([]);
            return;
          case "model":
            if (slash.args.trim()) {
              setCurrentModel(slash.args.trim());
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Model set to: ${slash.args.trim()} (restart to apply)` },
              ]);
            }
            return;
          case "tools":
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: `Available tools: ${TOOL_NAMES.join(", ")}` },
            ]);
            return;
          case "history": {
            const hist = runner.getHistory();
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: `${hist.length} messages in history.` },
            ]);
            return;
          }
        }
      }

      const userMsg: TUIMessage = { role: "user", content: input };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const response = await runner.sendMessage(input);
        setMessages((prev) => [...prev, { role: "assistant", content: response.content }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${err instanceof Error ? err.message : String(err)}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [runner, exit]
  );

  return (
    <Box flexDirection="column" height="100%">
      <Header model={currentModel} provider={providerName} messageCount={messages.length} />
      <Box flexDirection="row" flexGrow={1}>
        <SidePanel
          messageCount={messages.length}
          tools={TOOL_NAMES}
          provider={providerName}
        />
        <MessageList messages={messages} loading={loading} />
      </Box>
      <SlashInput onSubmit={handleSubmit} disabled={loading} />
    </Box>
  );
}
