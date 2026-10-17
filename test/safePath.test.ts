import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveSafe } from "../src/safePath.js";

let base: string, root: string;

beforeAll(async () => {
  base = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-"));
  root = path.join(base, "sandbox");
  await fs.mkdir(root);
  await fs.mkdir(path.join(base, "sandbox2"));
  await fs.writeFile(path.join(root, "ok.txt"), "hi");
  try {
    await fs.symlink(path.join(base, "sandbox2"), path.join(root, "link"), "junction");
  } catch {}
});

afterAll(() => fs.rm(base, { recursive: true, force: true }));

describe("resolveSafe", () => {
  it("allows a normal file", async () => {
    await expect(resolveSafe("ok.txt", root)).resolves.toContain("ok.txt");
  });
  it("allows a file that does not exist yet", async () => {
    await expect(resolveSafe("new/file.txt", root)).resolves.toBeTruthy();
  });
  it("blocks ../ traversal", async () => {
    await expect(resolveSafe("../secret.txt", root)).rejects.toThrow();
  });
  it("blocks absolute paths", async () => {
    await expect(resolveSafe("C:\\Windows\\win.ini", root)).rejects.toThrow();
  });
  it("blocks the sibling folder with a similar name", async () => {
    await expect(resolveSafe("..\\sandbox2\\x.txt", root)).rejects.toThrow();
  });
  it("blocks a link that points outside", async () => {
    await expect(resolveSafe("link/x.txt", root)).rejects.toThrow();
  });
  it("blocks null bytes and empty input", async () => {
    await expect(resolveSafe("a\0b", root)).rejects.toThrow();
    await expect(resolveSafe("", root)).rejects.toThrow();
  });
});