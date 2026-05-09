import { describe, it, expect } from "vitest";
import {
  ExtensionManifestSchema,
  ExtensionPermissionSchema,
} from "../../src/extensions/manifest.js";
import { ByteConfigSchema } from "../../src/config.js";

describe("ExtensionManifest schema", () => {
  it("validates a minimal valid manifest", () => {
    const result = ExtensionManifestSchema.safeParse({
      name: "my-extension",
      version: "1.0.0",
      description: "A test extension",
      byteVersion: ">=0.1.0",
      entry: "dist/index.js",
    });
    expect(result.success).toBe(true);
  });

  it("defaults tools, commands, permissions to empty arrays", () => {
    const result = ExtensionManifestSchema.parse({
      name: "ext",
      version: "0.0.1",
      description: "desc",
      byteVersion: ">=0.1.0",
      entry: "index.js",
    });
    expect(result.tools).toEqual([]);
    expect(result.commands).toEqual([]);
    expect(result.permissions).toEqual([]);
  });

  it("rejects manifest with invalid semver version", () => {
    const result = ExtensionManifestSchema.safeParse({
      name: "ext",
      version: "not-semver",
      description: "desc",
      byteVersion: ">=0.1.0",
      entry: "index.js",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown permissions", () => {
    const result = ExtensionManifestSchema.safeParse({
      name: "ext",
      version: "1.0.0",
      description: "desc",
      byteVersion: ">=0.1.0",
      entry: "index.js",
      permissions: ["superuser"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid permission values", () => {
    const perms = ["file_read", "file_write", "bash", "network"];
    for (const perm of perms) {
      expect(ExtensionPermissionSchema.safeParse(perm).success).toBe(true);
    }
  });
});

describe("ByteConfig extensions field", () => {
  it("defaults to empty extensions array", () => {
    const result = ByteConfigSchema.parse({
      defaultModel: "claude-sonnet-4-6",
      defaultProvider: "anthropic",
      providers: {},
    });
    expect(result.extensions).toEqual([]);
  });

  it("accepts a valid extension entry", () => {
    const result = ByteConfigSchema.parse({
      defaultModel: "claude-sonnet-4-6",
      defaultProvider: "anthropic",
      providers: {},
      extensions: [{ name: "my-ext", enabled: true }],
    });
    expect(result.extensions[0].name).toBe("my-ext");
    expect(result.extensions[0].enabled).toBe(true);
  });
});
