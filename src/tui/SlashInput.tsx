import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { slashHints } from "./commands.js";

interface SlashInputProps {
  onSubmit(value: string): void;
  disabled?: boolean;
}

export default function SlashInput({
  onSubmit,
  disabled,
}: SlashInputProps): React.ReactElement {
  const [input, setInput] = useState("");

  useInput((char, key) => {
    if (disabled) return;

    if (key.return) {
      const val = input.trim();
      if (val) {
        onSubmit(val);
        setInput("");
      }
      return;
    }

    if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    if (!key.ctrl && !key.meta && char) {
      setInput((prev) => prev + char);
    }
  });

  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Box>
        <Text color="cyan" bold>
          {">"}{" "}
        </Text>
        <Text>{input}</Text>
        {!disabled && <Text color="blueBright">▌</Text>}
        {disabled && <Text dimColor> waiting...</Text>}
      </Box>
      <Text dimColor>{slashHints()}</Text>
    </Box>
  );
}
