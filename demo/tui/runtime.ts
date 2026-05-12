// demo/tui/runtime.ts

export type RuntimeMode =
  | "compact" | "expanded" | "reasoning" | "build"
  | "swarm" | "debug" | "watch" | "timeline"
  | "diff" | "intervention" | "recovery";

export type RuntimeDensity = "compact" | "normal" | "verbose";

export type RuntimePhase =
  | "thinking" | "executing" | "validating"
  | "waiting" | "blocked" | "reviewing" | "finalizing";

export type Severity = "info" | "low" | "med" | "high" | "critical";

export type SectionLevel = "P" | "S" | "H";

export interface SectionVisibility {
  focus: SectionLevel;
  activity: SectionLevel;
  reasoning: SectionLevel;
  operations: SectionLevel;
  next: SectionLevel;
  tools: SectionLevel;
  warnings: SectionLevel;
}

export interface RuntimeState {
  identity: {
    app: string;
    mode: RuntimeMode;
    phase: RuntimePhase;
    role: string;
    model: string;
    runtimeMs: number;
    tokenUsage: number;
    status: "idle" | "active" | "blocked" | "error" | "complete";
  };
  focus?: { title: string; blocked?: boolean; severity?: Severity; reason?: string };
  activity: Array<{ id: string; label: string; status: "pending" | "running" | "done" | "failed"; progress?: number }>;
  reasoning: Array<{ id: string; text: string; status: "pending" | "running" | "done"; discoveredAt: number }>;
  operations: Array<{ id: string; label: string; status: "done" | "failed"; severity?: Severity }>;
  next: Array<{ id: string; label: string; kind: "plan" | "risk" | "followup" }>;
  tools: Array<{ id: string; name: string; target?: string; status: "queued" | "running" | "done" | "error"; startedAt: number; endedAt?: number }>;
  warnings: Array<{ id: string; message: string; severity: Severity }>;
  prompt: { text: string; quickActions: string[] };
}

export interface RenderCapabilities {
  width: number;
  height: number;
  unicode: boolean;
  color: boolean;
}

export interface RenderContext {
  mode: RuntimeMode;
  density: RuntimeDensity;
  capabilities: RenderCapabilities;
}

export function computeContext(state: RuntimeState, caps: RenderCapabilities): RenderContext {
  const density: RuntimeDensity =
    caps.width < 80 ? "compact"
    : state.warnings.length > 0 || state.identity.phase === "reviewing" ? "verbose"
    : "normal";
  return { mode: state.identity.mode, density, capabilities: caps };
}

type ModeMatrix = Partial<Record<RuntimeDensity, SectionVisibility>>;

const DEFAULT_VIS: SectionVisibility = {
  focus: "P", activity: "P", reasoning: "S", operations: "S", next: "S", tools: "S", warnings: "S",
};

const MATRIX: Record<RuntimeMode, ModeMatrix> = {
  compact: {
    compact: { focus: "P", activity: "S", reasoning: "H", operations: "S", next: "H", tools: "H", warnings: "S" },
    normal:  { focus: "P", activity: "S", reasoning: "S", operations: "S", next: "S", tools: "H", warnings: "S" },
  },
  expanded: {
    compact: { focus: "P", activity: "P", reasoning: "S", operations: "S", next: "S", tools: "S", warnings: "S" },
    normal:  { focus: "P", activity: "P", reasoning: "P", operations: "S", next: "S", tools: "S", warnings: "S" },
    verbose: { focus: "P", activity: "P", reasoning: "P", operations: "S", next: "S", tools: "S", warnings: "P" },
  },
  reasoning: {
    compact: { focus: "P", activity: "S", reasoning: "P", operations: "H", next: "S", tools: "H", warnings: "S" },
    normal:  { focus: "P", activity: "S", reasoning: "P", operations: "S", next: "S", tools: "S", warnings: "S" },
    verbose: { focus: "P", activity: "S", reasoning: "P", operations: "S", next: "S", tools: "S", warnings: "P" },
  },
  build: {
    compact: { focus: "P", activity: "P", reasoning: "H", operations: "S", next: "S", tools: "S", warnings: "S" },
    normal:  { focus: "P", activity: "P", reasoning: "S", operations: "S", next: "S", tools: "S", warnings: "S" },
  },
  debug: {
    normal: { focus: "P", activity: "S", reasoning: "S", operations: "S", next: "H", tools: "S", warnings: "P" },
  },
  swarm: {
    normal: { focus: "P", activity: "S", reasoning: "H", operations: "S", next: "S", tools: "S", warnings: "S" },
  },
  watch: {
    normal: { focus: "P", activity: "P", reasoning: "H", operations: "S", next: "S", tools: "S", warnings: "P" },
  },
  timeline: {
    normal: { focus: "P", activity: "P", reasoning: "H", operations: "H", next: "H", tools: "H", warnings: "S" },
  },
  diff: {
    normal: { focus: "P", activity: "S", reasoning: "H", operations: "P", next: "S", tools: "S", warnings: "S" },
  },
  intervention: {
    normal: { focus: "P", activity: "H", reasoning: "P", operations: "H", next: "S", tools: "S", warnings: "P" },
  },
  recovery: {
    normal: { focus: "P", activity: "S", reasoning: "H", operations: "P", next: "P", tools: "H", warnings: "S" },
  },
};

export function sectionVisibility(mode: RuntimeMode, density: RuntimeDensity): SectionVisibility {
  return MATRIX[mode]?.[density] ?? MATRIX[mode]?.["normal"] ?? DEFAULT_VIS;
}

export const VALID_MODES: RuntimeMode[] = [
  "compact", "expanded", "reasoning", "build", "swarm",
  "debug", "watch", "timeline", "diff", "intervention", "recovery",
];

export function symbolFor(status: string): string {
  if (status === "done" || status === "complete") return "✓";
  if (status === "running" || status === "active") return "◉";
  if (status === "failed" || status === "blocked" || status === "error") return "⚠";
  return "○";
}

export function formatRuntime(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
