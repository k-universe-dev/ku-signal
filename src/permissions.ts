import type { ByteConfig } from "./config.js";

export type PermissionDecision = "yes" | "no" | "always";
export type RequestPermission = (tool: string, summary: string) => Promise<PermissionDecision>;

export function isAlwaysAllowed(tool: string, cfg: Pick<ByteConfig, "permissions">): boolean {
  return cfg.permissions.some((p) => p.tool === tool && p.decision === "always");
}

export function saveAlwaysPermission(
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
