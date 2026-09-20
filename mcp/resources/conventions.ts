import { McpServer } from "@modelcontextprotocol/server"

export const conventions = `# App workflow

Follow this order when creating and working on an app:

1. Call create-app first. Keep the returned app id for subsequent tool calls.
2. Call create-sandbox with that appId. Wait for success and keep the returned containerId. Do not read or write files or run commands before the sandbox is initialized.
3. Use list-files and get-file to inspect the sandbox, including package.json and any project instructions, before making changes. Paths are relative to the app workspace; list-files defaults to ".".
4. Use add-or-update-file to create or write files, edit-file to replace a unique string, and delete-file to remove files. Always use the same appId. File changes happen in the sandbox and are not automatically committed or pushed.
   When the app requires environment variables, register their names with create-env-keys using { "appId": "<app UUID>", "keys": [{ "key": "DATABASE_URL" }, { "key": "API_KEY" }] }. Send a nonempty array of unique names, starting with a letter or underscore and containing only letters, numbers, and underscores. The tool verifies app ownership on each call and stores names only; do not send values or secrets. It does not configure the sandbox environment, and hasValue remains false. An existing key rejects the entire batch, so do not blindly retry successful batches. Verify the result before reporting that keys were created.
5. Run commands through the available sandbox command tools, using the containerId returned by create-sandbox. Run them in /workspace. Use the project's package manager and scripts for dependency installation, migrations, tests, and builds.
   Use pnpm-install-and-build with the appId after making file changes to verify the app still installs and builds. Read the tool result's exitCode and output; fix any failures before continuing to the next change.
6. When database changes require it, generate and run the project's migrations BEFORE running pnpm-install-and-build. A build must reflect the current schema, not a stale one. Run the relevant checks and build, inspect their output and exit codes, and fix failures before continuing.
7. Use git-status and git-diff to review changes, then call git-push with appId and a descriptive message to stage all changes, commit, and push. Do not include secrets or unrelated files. Verify the tool result before reporting completion; a clean workspace results in no commit or push.
8. Once you have finished writing code for this session, call git-push to commit and push your changes, then immediately call destroy-sandbox with the same appId to tear down the sandbox container and its workspace. Do this even if git-push made no commit. Do not leave a sandbox running once you are done with an app for the session.
9. For final deployment, call deploy-app with { "appId": "<app UUID>" }. It verifies ownership, clones the configured repository's latest pushed commit into a separate build workspace, builds the app, and starts its production container. It returns containerId, port, and imageTag; do not invent a public URL or claim application health was checked. Existing running deployments are not replaced. Report success only after the tool succeeds.

Use only tools exposed by the MCP server. If command execution is unavailable or a command is blocked by missing dependencies, credentials, or network access, report the blocker. Do not claim migrations, builds, commits, pushes, or sandbox destruction ran unless tool results confirm they succeeded.
`

export function registerConventionsResource(server: McpServer) {
  server.registerResource(
    "conventions",
    "shipsmall://template/conventions",
    {
      description: "Required app creation, environment key registration, sandbox, file, command, and Git workflow",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: conventions }],
    })
  )
}
