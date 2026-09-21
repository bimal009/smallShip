
import Docker from "dockerode"
import fs from "node:fs/promises"
import { cloneRepo } from "./clone"
import { buildWorkspacePath, sandboxWorkspacePath } from "./constants"

import getPort from "get-port"

const docker = new Docker()
interface SandboxResult {
  containerId: string
  workspacePath: string
}

export async function initSandbox(
  appId: string,
  repoFullName: string,
  branch: string
): Promise<SandboxResult> {
  const workspacePath = sandboxWorkspacePath(appId)
  const logPrefix = `[sandbox:${appId}]`
  const startedAt = Date.now()

  try {
    await cloneRepo(appId, repoFullName,true, branch)
  } catch (error) {
    console.error(`${logPrefix} Repository clone failed`, { elapsedMs: Date.now() - startedAt })
    throw new Error(`Failed to clone repo for app ${appId}: ${(error as Error).message}`)
  }

  let stage = "creating container"
  try {
  const container = await docker.createContainer({
  Image: "shipsmall-sandbox-base:latest",
  name: `sandbox-${appId}`,
  Cmd: ["sleep", "infinity"],
  User: "1000:1000",
  HostConfig: {
    // Runtime: "runsc", // enable in prod
    SecurityOpt: ["no-new-privileges"],
    CapDrop: ["ALL"],
  Memory: 1024 * 1024 * 1024,
    CpuQuota: 100000,
    PidsLimit: 128,
    Binds: [`${workspacePath}:/workspace`],
  },
  WorkingDir: "/workspace",
})

    stage = "starting container"
    await container.start()
    return { containerId: container.id, workspacePath }
  } catch (error) {
    console.error(`${logPrefix} Failed while ${stage}`, {
      elapsedMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : "Unknown Docker error",
    })
    throw new Error(`Failed to start container for app ${appId}: ${(error as Error).message}`)
  }
}



export async function destroySandbox(appId: string) {
  await destroyWorkspaceContainer(appId, "sandbox")
}

export async function getSandboxContainerId(appId: string): Promise<string | null> {
  const container = docker.getContainer(`sandbox-${appId}`)

  try {
    const info = await container.inspect()
    if (!info.State.Running) return null
    return info.Id
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "statusCode" in err && err.statusCode === 404) {
      return null
    }
    throw err
  }
}

export async function destroyBuildContainer(appId: string) {
  await destroyWorkspaceContainer(appId, "build")
}

async function destroyWorkspaceContainer(appId: string, kind: "sandbox" | "build") {
  const containerName = `${kind}-${appId}`
  const workspacePath = kind === "sandbox" ? sandboxWorkspacePath(appId) : buildWorkspacePath(appId)

  const container = docker.getContainer(containerName)

  try {
    await container.stop()
  } catch (err: unknown) {
    if (typeof err !== "object" || err === null || !("statusCode" in err) ||
      (err.statusCode !== 304 && err.statusCode !== 404)) throw err
  }

  try {
    await container.remove()
  } catch (err: unknown) {
    if (typeof err !== "object" || err === null || !("statusCode" in err) ||
      err.statusCode !== 404) throw err
  }

  await fs.rm(workspacePath, { recursive: true, force: true })
}

export async function execInSandbox(containerId: string, cmd: string[]) {
  const container = docker.getContainer(containerId)
  const exec = await container.exec({
    Cmd: cmd,
    AttachStdout: true,
    AttachStderr: true,
  })
  const stream = await exec.start({})

  return new Promise<{ output: string; exitCode: number }>((resolve, reject) => {
    let output = ""
    stream.on("data", (chunk) => (output += chunk.toString()))
    stream.on("end", async () => {
      const { ExitCode } = await exec.inspect()
      resolve({ output, exitCode: ExitCode ?? 1 })
    })
    stream.on("error", reject)
  })
}



interface BuildContainerResult {
  containerId: string
  workspacePath: string
}

export async function createBuildContainer(
  appId: string,
  repoFullName: string,
  branch: string
): Promise<BuildContainerResult> {
  const workspacePath = buildWorkspacePath(appId)

  try {
    await cloneRepo(appId, repoFullName, false, branch)
  } catch (error) {
    throw new Error(`Failed to clone repo for app ${appId}: ${(error as Error).message}`)
  }

  try {
const container = await docker.createContainer({
  Image: "shipsmall-sandbox-base:latest",
  name: `build-${appId}`,
  Cmd: ["sleep", "infinity"],
  User: "1000:1000",
  HostConfig: {
    // Runtime: "runsc", // enable in prod
    SecurityOpt: ["no-new-privileges"],
    CapDrop: ["ALL"],
   Memory: 1024 * 1024 * 1024,
    CpuQuota: 100000,
    PidsLimit: 128,
    Binds: [`${workspacePath}:/workspace`],
  },
  WorkingDir: "/workspace",
})

    await container.start()
    return { containerId: container.id, workspacePath }
  } catch (error) {
    throw new Error(`Failed to start build container for app ${appId}: ${(error as Error).message}`)
  }
}



const DATA_ROOT = process.env.DATA_ROOT ?? "/data"

interface RunContainerResult {
  containerId: string
  port: number
}

export async function runContainer(
  appId: string,
  imageTag: string
): Promise<RunContainerResult> {
  const hostDataPath = `${DATA_ROOT}/${appId}`
  const port = await getPort()

  try {
    const container = await docker.createContainer({
      Image: imageTag,
      name: `app-${appId}`,
      Env: [
        `APP_ID=${appId}`,
        `BETTER_AUTH_SECRET=dev-secret-change-me`, 
        `APP_TOKEN=dev-token-change-me`, 
      ],
      ExposedPorts: { "3000/tcp": {} },
      HostConfig: {
        // Runtime: "runsc", // enable in prod
        SecurityOpt: ["no-new-privileges"],
        CapDrop: ["ALL"],
        Memory: 256 * 1024 * 1024,
        MemorySwap: 256 * 1024 * 1024,
        CpuQuota: 50000,
        CpuPeriod: 100000,
        PidsLimit: 128,
        Binds: [`${hostDataPath}:/app/data`],
        PortBindings: { "3000/tcp": [{ HostPort: String(port) }] },
        RestartPolicy: { Name: "unless-stopped" },
      },
    })

    await container.start()
    return { containerId: container.id, port }
  } catch (error) {
    throw new Error(`Failed to run container for app ${appId}: ${(error as Error).message}`)
  }
}
