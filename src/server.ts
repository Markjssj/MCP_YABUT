import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerFileTools } from "./tools/files.js";
import { registerGitTools } from "./tools/git.js";
import { SANDBOX_ROOT } from "./safePath.js";

await fs.mkdir(SANDBOX_ROOT, { recursive: true });
await promisify(execFile)("git", ["init"], { cwd: SANDBOX_ROOT });

const server = new McpServer({ name: "file-server", version: "1.0.0" });

registerFileTools(server);
registerGitTools(server);

await server.connect(new StdioServerTransport());
console.error("file-server is running");