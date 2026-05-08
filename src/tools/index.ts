export { fileReadTool, type ByteTool } from "./file-read.js";
export { fileWriteTool } from "./file-write.js";
export { bashTool } from "./bash.js";
export { searchTool } from "./search.js";

import { fileReadTool } from "./file-read.js";
import { fileWriteTool } from "./file-write.js";
import { bashTool } from "./bash.js";
import { searchTool } from "./search.js";
import type { ByteTool } from "./file-read.js";

export const allTools: ByteTool[] = [fileReadTool, fileWriteTool, bashTool, searchTool];
