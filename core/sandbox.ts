
import Docker from "dockerode"
import fs from "node:fs/promises"
import { cloneRepo } from "./clone"
import { buildWorkspacePath, sandboxWorkspacePath } from "./constants"

import getPort from "get-port"
import { eq } from "drizzle-orm"
import { db } from "@/lib/database"
import { apps } from "@/lib/database/schema"

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

    stage = "saving container ID"
    await db.update(apps).set({ sandboxContainerId: container.id }).where(eq(apps.id, appId))
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
  const [app] = await db.select({ containerId: apps.sandboxContainerId })
    .from(apps).where(eq(apps.id, appId)).limit(1)

  if (app?.containerId) {
    const container = docker.getContainer(app.containerId)
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

    await db.update(apps).set({ sandboxContainerId: null }).where(eq(apps.id, appId))
  }

  await fs.rm(sandboxWorkspacePath(appId), { recursive: true, force: true })
}

export async function getSandboxContainerId(appId: string): Promise<string | null> {
  const [app] = await db.select({ containerId: apps.sandboxContainerId })
    .from(apps).where(eq(apps.id, appId)).limit(1)
  if (!app?.containerId) return null
  const container = docker.getContainer(app.containerId)

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
  const [app] = await db.select({ containerId: apps.buildContainerId })
    .from(apps).where(eq(apps.id, appId)).limit(1)

  if (app?.containerId) {
    const container = docker.getContainer(app.containerId)
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

    await db.update(apps).set({ buildContainerId: null }).where(eq(apps.id, appId))
  }

  await fs.rm(buildWorkspacePath(appId), { recursive: true, force: true })
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

    await db.update(apps).set({ buildContainerId: container.id }).where(eq(apps.id, appId))
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
