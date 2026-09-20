import simpleGit from "simple-git"
import fs from "fs/promises"
import { github } from "@/lib/github"
import { buildWorkspacePath, sandboxWorkspacePath } from "./constants"

export async function cloneRepo(
  appId: string,
  repoFullName: string,
  isSandbox: boolean,
  branch: string = "main"
) {
  const workspacePath = isSandbox ? sandboxWorkspacePath(appId) : buildWorkspacePath(appId)

  await fs.rm(workspacePath, { recursive: true, force: true })
  await fs.mkdir(workspacePath, { recursive: true })

  const installationId = Number(process.env.GITHUB_APP_INSTALLATION_ID)
  const { token: installationToken } = await github.octokit.auth({
    type: "installation",
    installationId,
  }) as { token: string }

  const cloneUrl = `https://x-access-token:${installationToken}@github.com/${repoFullName}.git`

  const git = simpleGit()
  await git.clone(cloneUrl, workspacePath, ["--branch", branch, "--depth", "1"])

  await simpleGit(workspacePath).remote(["set-url", "origin", `https://github.com/${repoFullName}.git`])

  return workspacePath
}