import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface InputBoxProps {
  onSubmit(value: string): void;
  disabled?: boolean;
}

export function InputBox({ onSubmit, disabled }: InputBoxProps): React.ReactElement {
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
    <Box borderStyle="round" paddingX={1}>
      <Text color="cyan">{">"} </Text>
      <Text>{input}</Text>
      {!disabled && <Text color="blueBright">▌</Text>}
      {disabled && <Text dimColor> (waiting...)</Text>}
    </Box>
  );
}
