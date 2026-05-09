import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";
import { homedir, platform } from "os";
import { ExtensionManifestSchema, type ExtensionManifest } from "./manifest.js";

export function extensionsDir(): string {
  if (platform() === "win32") {
    return join(homedir(), "AppData", "Roaming", "ku-signal", "extensions");
  }
  return join(homedir(), ".config", "ku-signal", "extensions");
}

export async function discoverExtensions(): Promise<ExtensionManifest[]> {
  const dir = extensionsDir();
  const results: ExtensionManifest[] = [];

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }

  for (const entry of entries) {
    const entryPath = join(dir, entry);
    try {
      const s = await stat(entryPath);
      if (!s.isDirectory()) continue;

      const manifestPath = join(entryPath, "byte.extension.json");
      const raw = await readFile(manifestPath, "utf8");
      const parsed = ExtensionManifestSchema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        results.push(parsed.data);
      }
    } catch {
      continue;
    }
  }

  return results;
}
