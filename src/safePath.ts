import fs from "node:fs/promises";
import path from "node:path";

export const SANDBOX_ROOT = path.resolve(
  process.env.SANDBOX_ROOT ?? path.join(process.cwd(), "sandbox")
);

function isInside(root: string, target: string): boolean {
  const rel = path.relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export async function resolveSafe(
  input: string,
  root: string = SANDBOX_ROOT
): Promise<string> {
  if (typeof input !== "string" || input.length === 0) {
    throw new Error("Path must be a non-empty string");
  }
  if (input.includes("\0")) throw new Error("Invalid path");

  const realRoot = await fs.realpath(root);
  const target = path.resolve(realRoot, input);

  let existing = target;
  const tail: string[] = [];
  while (true) {
    try {
      await fs.lstat(existing);
      break;
    } catch {
      const parent = path.dirname(existing);
      if (parent === existing) throw new Error("Path escapes sandbox");
      tail.unshift(path.basename(existing));
      existing = parent;
    }
  }

  const realExisting = await fs.realpath(existing);
  const finalPath = path.join(realExisting, ...tail);

  if (!isInside(realRoot, finalPath)) {
    throw new Error("Path escapes sandbox");
  }
  return finalPath;
}