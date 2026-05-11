import type { ByteConfig } from "./config.js";

export type PermissionDecision = "yes" | "no" | "always";
export type RequestPermission = (tool: string, summary: string) => Promise<PermissionDecision>;

export function isAlwaysAllowed(tool: string, cfg: Pick<ByteConfig, "permissions">): boolean {
  return cfg.permissions.some((p) => p.tool === tool && p.decision === "always");
}

export function addAlwaysPermission(
  tool: string,
  cfg: ByteConfig
): ByteConfig {
  const already = cfg.permissions.some((p) => p.tool === tool);
  if (already) return cfg;
  return {
    ...cfg,
    permissions: [...cfg.permissions, { tool, decision: "always" as const }],
  };
}

export function summarizeTool(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "file_write") {
    const path = String(args.path ?? "");
    const bytes = String(args.content ?? "").length;
    return `Write ${bytes} bytes → ${path}`;
  }
  if (toolName === "bash") {
    const cmd = String(args.command ?? "");
    return cmd.length > 80 ? cmd.slice(0, 77) + "..." : cmd;
  }
  return toolName;
}

import type { ByteTool } from "./tools/index.js";

const GUARDED_TOOLS = new Set(["file_write", "bash"]);

export function wrapWithPermission(
  tools: ByteTool[],
  requestPermission: RequestPermission,
  cfg: Pick<ByteConfig, "permissions">
): ByteTool[] {
  return tools.map((tool) => {
    if (!GUARDED_TOOLS.has(tool.definition.name)) return tool;
    return {
      ...tool,
      async execute(args: Record<string, unknown>): Promise<string> {
        if (isAlwaysAllowed(tool.definition.name, cfg)) {
          return tool.execute(args);
        }
        const summary = summarizeTool(tool.definition.name, args);
        const decision = await requestPermission(tool.definition.name, summary);
        if (decision === "no") {
          throw new Error(`Permission denied for ${tool.definition.name}`);
        }
        return tool.execute(args);
      },
    };
  });
}
