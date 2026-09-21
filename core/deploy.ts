import { buildImage } from "./build"
import { installPnpm, buildPnpm } from "./pnpm"
import { createBuildContainer, destroyBuildContainer, runContainer } from "./sandbox"

export async function buildApp(
  appId: string,
  repoFullName: string,
  branch: string,
  onLog: (line: string) => void
): Promise<string> {
  onLog("Cloning latest commit and starting build container...")
  const { containerId, workspacePath } = await createBuildContainer(appId, repoFullName, branch)

  onLog("Installing and building...")
  try {
    const installResult = await installPnpm(containerId)
    onLog(installResult.output)
    if (installResult.exitCode !== 0) throw new Error("Dependency installation failed")

    const { exitCode, output } = await buildPnpm(containerId)
    onLog(output)
    if (exitCode !== 0) throw new Error("Build failed")

    onLog("Building final image...")
    const imageTag = await buildImage(appId, workspacePath, onLog)
    onLog(`Image built: ${imageTag}`)
    return imageTag
  } finally {
    onLog("Removing build container and build workspace...")
    await destroyBuildContainer(appId)
  }
}

export async function deployApp(
  appId: string,
  repoFullName: string,
  branch: string,
  onLog: (line: string) => void
) {
  const imageTag = await buildApp(appId, repoFullName, branch, onLog)

  onLog("Starting container...")
  const { containerId, port } = await runContainer(appId, imageTag)

  onLog(`Deployed, running on port ${port}`)
  return { containerId, port, imageTag }
}
