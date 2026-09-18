import { github } from "@/lib/gtihub"

async function getOctokit() {
  return github.getInstallationOctokit(
    Number(process.env.GITHUB_APP_INSTALLATION_ID)
  )
}

function parseRepo(repoFullName: string) {
  const [owner, repo] = repoFullName.split("/")
  return { owner, repo }
}

export async function getFile(
  repoFullName: string,
  path: string,
  branch = "main"
) {
  const octokit = await getOctokit()
  const { owner, repo } = parseRepo(repoFullName)

  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    { owner, repo, path, ref: branch }
  )

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`${path} is not a file`)
  }

  return {
    content: Buffer.from(data.content, "base64").toString("utf8"),
    sha: data.sha,
  }
}

export async function upsertFile(
  repoFullName: string,
  path: string,
  content: string,
  branch = "main",
  message?: string
) {
  const octokit = await getOctokit()
  const { owner, repo } = parseRepo(repoFullName)

  let sha: string | undefined
  try {
    const existing = await getFile(repoFullName, path, branch)
    sha = existing.sha
  } catch {
    sha = undefined
  }

  const { data } = await octokit.request(
    "PUT /repos/{owner}/{repo}/contents/{path}",
    {
      owner,
      repo,
      path,
      message: message ?? `Update ${path}`,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha,
      branch,
    }
  )

  return data
}

export async function deleteFile(
  repoFullName: string,
  path: string,
  branch = "main",
  message?: string
) {
  const octokit = await getOctokit()
  const { owner, repo } = parseRepo(repoFullName)

  const existing = await getFile(repoFullName, path, branch)

  await octokit.request("DELETE /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
    path,
    message: message ?? `Delete ${path}`,
    sha: existing.sha,
    branch,
  })
}

export async function listFiles(repoFullName: string, branch = "main") {
  const octokit = await getOctokit()
  const { owner, repo } = parseRepo(repoFullName)

  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    { owner, repo, tree_sha: branch, recursive: "1" }
  )

  return data.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
}