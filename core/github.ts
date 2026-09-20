import simpleGit from "simple-git"
import { SANDBOX_ROOT } from "./sandbox"
import { github } from "@/lib/github"
import { getOwnedApp } from "@/mcp/core/apps"

export const gitStatus = async (appId: string) => {
  const workspacePath = `${SANDBOX_ROOT}/${appId}`

  try {
    const git = simpleGit(workspacePath)
    const status = await git.status()

    return {
      current: status.current,
      ahead: status.ahead,
      behind: status.behind,
      staged: status.staged,
      modified: status.modified,
      created: status.created,
      deleted: status.deleted,
      not_added: status.not_added,
      conflicted: status.conflicted,
      isClean: status.isClean(),
    }
  } catch (error) {
    throw new Error(`Failed to get git status for app ${appId}: ${(error as Error).message}`)
  }
}

export const getDiff = async (appId: string, filePath?: string) => {
  const workspacePath = `${SANDBOX_ROOT}/${appId}`

  try {
    const git = simpleGit(workspacePath)
    const diff = filePath
      ? await git.diff(["HEAD", "--", filePath])
      : await git.diff(["HEAD"])

    return diff
  } catch (error) {
    throw new Error(`Failed to get diff for app ${appId}: ${(error as Error).message}`)
  }
}


export const gitPush = async (appId: string, message: string, userId: string) => {
  const workspacePath = `${SANDBOX_ROOT}/${appId}`

  const app = await getOwnedApp(appId, userId)
  if (!app) throw new Error("App not found")

  const repoFullName = app.githubRepoFullName

  try {
    const git = simpleGit(workspacePath)

    const status = await git.status()
    if (status.isClean()) {
      return { pushed: false, reason: "No changes to commit" }
    }

    const installationId = Number(process.env.GITHUB_APP_INSTALLATION_ID)
    const { token: installationToken } = (await github.octokit.auth({
      type: "installation",
      installationId,
    })) as { token: string }

    await git.remote([
      "set-url",
      "origin",
      `https://x-access-token:${installationToken}@github.com/${repoFullName}.git`,
    ])

    await git.add(".")
    await git.commit(message)
    await git.push()

    return { pushed: true, commit: (await git.log({ maxCount: 1 })).latest?.hash }
  } catch (error) {
    throw new Error(`Failed to push for app ${appId}: ${(error as Error).message}`)
  } finally {
    const git = simpleGit(workspacePath)
    await git
      .remote(["set-url", "origin", `https://github.com/${repoFullName}.git`])
      .catch(() => {})
  }
}