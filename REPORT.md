# Report

## Technology stack
I used Node.js and TypeScript because the official MCP SDK supports them well and TypeScript catches mistakes early. Zod checks every tool input. Vitest runs the tests. The server talks over stdio.

## Tool design
There are 8 small tools that each do one job: list_directory, read_file, write_file, search_files, delete_file, git_status, git_diff, git_commit. Each tool validates its input with Zod and returns a clear error instead of crashing.

## Security tradeoffs
- All paths go through one function (`resolveSafe`) that follows symlinks first and then checks the real path is inside the sandbox.
- Seven tests prove it blocks `../`, absolute paths, sibling folders, symlinks and null bytes.
- Git tools use `execFile`, not a shell, so input cannot inject commands.
- Risks left: `write_file` and `delete_file` can change files inside the sandbox. File size is limited to 1 MB.
- If this server were exposed over HTTPS with ngrok, anyone with the URL could call the tools. It would need a bearer token first. I did not expose it for this assignment.