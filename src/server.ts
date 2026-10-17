import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerFileTools } from "./tools/files.js";
import { registerGitTools } from "./tools/git.js";

const server = new McpServer({ name: "file-server", version: "1.0.0" });

registerFileTools(server);
registerGitTools(server);

await server.connect(new StdioServerTransport());
console.error("file-server is running");