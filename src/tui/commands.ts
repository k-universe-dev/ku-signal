export interface SlashCommand {
  name: string;
  hint: string;
  args: string;
}

export const SLASH_COMMANDS: Record<string, { hint: string }> = {
  exit:    { hint: "quit byte" },
  clear:   { hint: "clear conversation" },
  model:   { hint: "switch model: /model <name>" },
  tools:   { hint: "list available tools" },
  history: { hint: "show session history" },
};

export function parseSlashCommand(input: string): SlashCommand | null {
  if (!input.startsWith("/")) return null;
  const [nameRaw, ...rest] = input.slice(1).split(" ");
  const name = nameRaw.toLowerCase();
  if (!(name in SLASH_COMMANDS)) return null;
  return { name, hint: SLASH_COMMANDS[name].hint, args: rest.join(" ") };
}

export function slashHints(): string {
  return Object.keys(SLASH_COMMANDS)
    .map((n) => `/${n}`)
    .join("  ");
}
