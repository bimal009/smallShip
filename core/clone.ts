import simpleGit from "simple-git"
import fs from "fs/promises"
import { github } from "@/lib/github"


export async function cloneRepo(appId: string, repoFullName: string, branch: string = "main",sandboxRoot:string) {
  const workspacePath = `${sandboxRoot}/${appId}`
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