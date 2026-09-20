import { McpServer } from "@modelcontextprotocol/server"

export const conventions = `# App workflow

Follow this order when creating and working on an app:

1. Call create-app first. Keep the returned app id for subsequent tool calls.
2. Call create-sandbox with that appId. Wait for success and keep the returned containerId. Do not read or write files or run commands before the sandbox is initialized.
3. Use list-files and get-file to inspect the sandbox, including package.json and any project instructions, before making changes. Paths are relative to the app workspace; list-files defaults to ".".
4. Use add-or-update-file to create or write files, edit-file to replace a unique string, and delete-file to remove files. Always use the same appId. File changes happen in the sandbox and are not automatically committed or pushed.
5. Run commands through the available sandbox command tools, using the containerId returned by create-sandbox. Run them in /workspace. Use the project's package manager and scripts for dependency installation, migrations, tests, and builds.
6. When database changes require it, generate and run the project's migrations. Run the relevant checks and build, inspect their output and exit codes, and fix failures before continuing.
7. Use git-status and git-diff to review changes, then call git-push with appId and a descriptive message to stage all changes, commit, and push. Do not include secrets or unrelated files. Verify the tool result before reporting completion; a clean workspace results in no commit or push.

Use only tools exposed by the MCP server. If command execution is unavailable or a command is blocked by missing dependencies, credentials, or network access, report the blocker. Do not claim migrations, builds, commits, or pushes ran unless tool results confirm they succeeded.
`

export function registerConventionsResource(server: McpServer) {
  server.registerResource(
    "conventions",
    "shipsmall://template/conventions",
    {
      description: "Required app creation, sandbox, file, command, and Git workflow",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: conventions }],
    })
  )
}
