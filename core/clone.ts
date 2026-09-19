import simpleGit from "simple-git"
import path from "path"
import fs from "fs/promises"
import { github } from "@/lib/github"

const BUILD_ROOT = process.env.BUILD_ROOT ?? "/var/shipsmall/builds"

export async function cloneRepo(appId: string, repoFullName: string, branch: string="main") {
  const buildPath = path.join(BUILD_ROOT, appId)

  await fs.rm(buildPath, { recursive: true, force: true })
  await fs.mkdir(buildPath, { recursive: true })

  const installationId = Number(process.env.GITHUB_APP_INSTALLATION_ID)

  const { token: installationToken } = await github.octokit.auth({
    type: "installation",
    installationId,
  }) as { token: string }

  const cloneUrl = `https://x-access-token:${installationToken}@github.com/${repoFullName}.git`

  const git = simpleGit()
  await git.clone(cloneUrl, buildPath, ["--branch", branch, "--depth", "1"])

  return buildPath
}