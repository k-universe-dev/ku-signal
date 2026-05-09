import { z } from "zod";

export const ExtensionPermissionSchema = z.enum([
  "file_read",
  "file_write",
  "bash",
  "network",
]);

export type ExtensionPermission = z.infer<typeof ExtensionPermissionSchema>;

export const ExtensionManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+/, "must start with semver digits"),
  description: z.string(),
  byteVersion: z.string(),
  entry: z.string().min(1),
  tools: z.array(z.string()).default([]),
  commands: z.array(z.string()).default([]),
  permissions: z.array(ExtensionPermissionSchema).default([]),
});

export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;
