# MCP File Server

A file-server MCP connector with 8 tools, built with Node.js, TypeScript, Zod and the MCP SDK (1.32.1).

## Tools
list_directory, read_file, write_file, search_files, delete_file, git_status, git_diff, git_commit

All file tools only work inside the `sandbox/` folder.

## Requirements
- Node.js 20 or newer
- Git

## Setup
```
npm install
npm run build
```
(On Windows PowerShell, use `npm.cmd` instead of `npm`.)

## Run
```
npm run dev
```

## Try it with the Inspector
```
npx @modelcontextprotocol/inspector npx tsx src/server.ts
```
Open the link it prints, click Connect, open the Tools tab.

## Run tests
```
npm test
```

## Security
- Every path goes through `resolveSafe` in `src/safePath.ts`.
- It blocks `../`, absolute paths, symlink escapes and sibling folders like `sandbox2`.
- Git commands use `execFile` (no shell) and run only inside `sandbox/`.