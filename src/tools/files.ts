import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveSafe, SANDBOX_ROOT } from "../safePath.js";

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

export function registerFileTools(server: McpServer) {
  server.registerTool(
    "list_directory",
    {
      description: "List files and folders inside the sandbox",
      inputSchema: { path: z.string().default(".") },
    },
    async ({ path: p }) => {
      try {
        const dir = await resolveSafe(p);
        const items = await fs.readdir(dir, { withFileTypes: true });
        const lines = items.map(
          (i) => `${i.isDirectory() ? "[dir] " : "[file]"} ${i.name}`
        );
        return ok(lines.join("\n") || "(empty)");
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "read_file",
    {
      description: "Read a text file inside the sandbox",
      inputSchema: { path: z.string().min(1) },
    },
    async ({ path: p }) => {
      try {
        const file = await resolveSafe(p);
        const stat = await fs.stat(file);
        if (stat.size > 1_000_000) throw new Error("File is too big (over 1 MB)");
        return ok(await fs.readFile(file, "utf8"));
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "write_file",
    {
      description: "Write text to a file inside the sandbox (makes it if missing)",
      inputSchema: {
        path: z.string().min(1),
        content: z.string().max(1_000_000),
      },
    },
    async ({ path: p, content }) => {
      try {
        const file = await resolveSafe(p);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, content, "utf8");
        return ok(`Wrote ${content.length} characters to ${p}`);
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "search_files",
    {
      description: "Find files by name, or by text inside them",
      inputSchema: {
        query: z.string().min(1),
        mode: z.enum(["name", "content"]).default("name"),
        directory: z.string().default("."),
      },
    },
    async ({ query, mode, directory }) => {
      try {
        const start = await resolveSafe(directory);
        const realRoot = await fs.realpath(SANDBOX_ROOT);
        const found: string[] = [];
        const q = query.toLowerCase();

        async function walk(dir: string) {
          if (found.length >= 100) return;
          const items = await fs.readdir(dir, { withFileTypes: true });
          for (const item of items) {
            if (item.isSymbolicLink()) continue;
            const full = path.join(dir, item.name);
            if (item.isDirectory()) {
              await walk(full);
            } else if (mode === "name") {
              if (item.name.toLowerCase().includes(q)) {
                found.push(path.relative(realRoot, full));
              }
            } else {
              const stat = await fs.stat(full);
              if (stat.size > 1_000_000) continue;
              const text = await fs.readFile(full, "utf8");
              if (text.toLowerCase().includes(q)) {
                found.push(path.relative(realRoot, full));
              }
            }
          }
        }

        await walk(start);
        return ok(found.join("\n") || "No matches");
      } catch (e) {
        return fail(e);
      }
    }
  );

  server.registerTool(
    "delete_file",
    {
      description: "Delete one file inside the sandbox (not folders)",
      inputSchema: { path: z.string().min(1) },
    },
    async ({ path: p }) => {
      try {
        const file = await resolveSafe(p);
        const stat = await fs.lstat(file);
        if (stat.isDirectory()) throw new Error("Folders cannot be deleted");
        await fs.unlink(file);
        return ok(`Deleted ${p}`);
      } catch (e) {
        return fail(e);
      }
    }
  );
}