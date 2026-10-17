import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SANDBOX_ROOT } from "../safePath.js";

const run = promisify(execFile);

async function git(args: string[]) {
  const { stdout, stderr } = await run("git", args, {
    cwd: SANDBOX_ROOT,
    timeout: 10000,
    maxBuffer: 1_000_000,
  });
  return (stdout + stderr).trim() || "(no output)";
}

const ok = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

const fail = (e: unknown) => ({
  isError: true,
  content: [
    {
      type: "text" as const,
      text: `Error: ${e instanceof Error ? e.message : String(e)}`,
    },
  ],
});

export function registerGitTools(server: McpServer) {
  server.registerTool(
    "git_status",
    { description: "Show git status of the sandbox", inputSchema: {} },
    async () => {
      try {
        return ok(await git(["status", "--short", "--branch"]));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "git_diff",
    {
      description: "Show changes in the sandbox",
      inputSchema: { staged: z.boolean().default(false) },
    },
    async ({ staged }) => {
      try {
        return ok(await git(staged ? ["diff", "--staged"] : ["diff"]));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "git_commit",
    {
      description: "Stage all changes in the sandbox and commit them",
      inputSchema: { message: z.string().min(1).max(200) },
    },
    async ({ message }) => {
      try {
        await git(["add", "-A"]);
        return ok(
          await git([
            "-c", "user.name=mcp-server",
            "-c", "user.email=mcp@example.com",
            "commit", "-m", message,
          ])
        );
      } catch (e) {
        return fail(e);
      }
    }
  );
}