
import Docker from "dockerode"
import fs from "node:fs/promises"
import { cloneRepo } from "./clone"
import { buildWorkspacePath, sandboxWorkspacePath } from "./constants"

import getPort from "get-port"
import { and, eq, isNull } from "drizzle-orm"
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
  const [app] = await db.select({ containerId: apps.sandboxContainerId })
    .from(apps).where(eq(apps.id, appId)).limit(1)
  if (!app) throw new Error("App not found")
  if (app.containerId) throw new Error("An existing sandbox must be destroyed before creating another")

  let container: Docker.Container | undefined
  let cloningStarted = false
  try {
    container = await docker.createContainer({
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
    const [saved] = await db.update(apps).set({ sandboxContainerId: container.id, rootDir: workspacePath })
      .where(and(eq(apps.id, appId), isNull(apps.sandboxContainerId))).returning({ id: apps.id })
    if (!saved) throw new Error("App state changed while creating the sandbox")

    cloningStarted = true
    await cloneRepo(appId, repoFullName, true, branch)
    await container.start()
    return { containerId: container.id, workspacePath }
  } catch (error) {
    if (container) {
      try {
        try {
          await container.remove({ force: true })
        } catch (removeError: unknown) {
          if (typeof removeError !== "object" || removeError === null || !("statusCode" in removeError) ||
            removeError.statusCode !== 404) throw removeError
        }
        if (cloningStarted) await fs.rm(workspacePath, { recursive: true, force: true })
        await db.update(apps).set({ sandboxContainerId: null, rootDir: "/" })
          .where(and(eq(apps.id, appId), eq(apps.sandboxContainerId, container.id)))
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "Failed to create and clean up the sandbox; cleanup must be retried")
      }
    }
    throw error
  }
}

export async function destroySandbox(appId: string) {
  const [app] = await db.select({ containerId: apps.sandboxContainerId })
    .from(apps).where(eq(apps.id, appId)).limit(1)
  if (!app) throw new Error("App not found")

  let containerId = app.containerId
  if (!containerId) {
    try {
      const info = await docker.getContainer(`sandbox-${appId}`).inspect()
      containerId = info.Id
    } catch (error: unknown) {
      if (typeof error !== "object" || error === null || !("statusCode" in error) ||
        error.statusCode !== 404) throw error
    }
    if (containerId) {
      const [saved] = await db.update(apps).set({ sandboxContainerId: containerId })
        .where(and(eq(apps.id, appId), isNull(apps.sandboxContainerId))).returning({ id: apps.id })
      if (!saved) throw new Error("App state changed; retry sandbox cleanup")
    }
  }

  if (containerId) {
    // The old shared field may contain this sandbox ID, but never clear a hosted ID.
    await db.update(apps).set({ containerId: null })
      .where(and(eq(apps.id, appId), eq(apps.containerId, containerId)))
    const container = docker.getContainer(containerId)
    try {
      await container.stop()
    } catch (error: unknown) {
      if (typeof error !== "object" || error === null || !("statusCode" in error) ||
        (error.statusCode !== 304 && error.statusCode !== 404)) throw error
    }
    try {
      await container.remove()
    } catch (error: unknown) {
      if (typeof error !== "object" || error === null || !("statusCode" in error) ||
        error.statusCode !== 404) throw error
    }
  }

  await fs.rm(sandboxWorkspacePath(appId), { recursive: true, force: true })
  await db.update(apps).set({ sandboxContainerId: null, rootDir: "/" })
    .where(and(eq(apps.id, appId), containerId ? eq(apps.sandboxContainerId, containerId) : isNull(apps.sandboxContainerId)))
}

export async function getSandboxContainerId(appId: string): Promise<string | null> {
  const [app] = await db.select({ containerId: apps.sandboxContainerId })
    .from(apps).where(eq(apps.id, appId)).limit(1)
  if (!app) return null

  let info: Docker.ContainerInspectInfo
  try {
    info = await docker.getContainer(app.containerId ?? `sandbox-${appId}`).inspect()
  } catch (error: unknown) {
    if (typeof error !== "object" || error === null || !("statusCode" in error) ||
      error.statusCode !== 404) throw error
    if (app.containerId) {
      await db.update(apps).set({ sandboxContainerId: null, rootDir: "/" })
        .where(and(eq(apps.id, appId), eq(apps.sandboxContainerId, app.containerId)))
    }
    return null
  }

  if (!app.containerId) {
    const [saved] = await db.update(apps).set({ sandboxContainerId: info.Id, rootDir: sandboxWorkspacePath(appId) })
      .where(and(eq(apps.id, appId), isNull(apps.sandboxContainerId))).returning({ id: apps.id })
    if (!saved) throw new Error("App state changed; retry the sandbox operation")
  }
  await db.update(apps).set({ containerId: null })
    .where(and(eq(apps.id, appId), eq(apps.containerId, info.Id)))
  return info.State.Running ? info.Id : null
}

export async function destroyBuildContainer(appId: string) {
  const [app] = await db.select({ containerId: apps.buildContainerId })
    .from(apps).where(eq(apps.id, appId)).limit(1)
  if (!app) throw new Error("App not found")

  let containerId = app.containerId
  if (!containerId) {
    try {
      const info = await docker.getContainer(`build-${appId}`).inspect()
      containerId = info.Id
    } catch (error: unknown) {
      if (typeof error !== "object" || error === null || !("statusCode" in error) ||
        error.statusCode !== 404) throw error
    }
    if (containerId) {
      const [saved] = await db.update(apps).set({ buildContainerId: containerId })
        .where(and(eq(apps.id, appId), isNull(apps.buildContainerId))).returning({ id: apps.id })
      if (!saved) throw new Error("App state changed; retry build cleanup")
    }
  }

  if (containerId) {
    const container = docker.getContainer(containerId)
    try {
      await container.stop()
    } catch (error: unknown) {
      if (typeof error !== "object" || error === null || !("statusCode" in error) ||
        (error.statusCode !== 304 && error.statusCode !== 404)) throw error
    }
    try {
      await container.remove()
    } catch (error: unknown) {
      if (typeof error !== "object" || error === null || !("statusCode" in error) ||
        error.statusCode !== 404) throw error
    }
  }

  await fs.rm(buildWorkspacePath(appId), { recursive: true, force: true })
  await db.update(apps).set({ buildContainerId: null })
    .where(and(eq(apps.id, appId), containerId ? eq(apps.buildContainerId, containerId) : isNull(apps.buildContainerId)))
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
      try {
        const { ExitCode } = await exec.inspect()
        resolve({ output, exitCode: ExitCode ?? 1 })
      } catch (error) {
        reject(error)
      }
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
  const [app] = await db.select({ containerId: apps.buildContainerId })
    .from(apps).where(eq(apps.id, appId)).limit(1)
  if (!app) throw new Error("App not found")
  if (app.containerId) throw new Error("An existing build must be destroyed before creating another")

  let container: Docker.Container | undefined
  let cloningStarted = false
  try {
    container = await docker.createContainer({
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
    const [saved] = await db.update(apps).set({ buildContainerId: container.id })
      .where(and(eq(apps.id, appId), isNull(apps.buildContainerId))).returning({ id: apps.id })
    if (!saved) throw new Error("App state changed while creating the build")

    cloningStarted = true
    await cloneRepo(appId, repoFullName, false, branch)
    await container.start()
    return { containerId: container.id, workspacePath }
  } catch (error) {
    if (container) {
      try {
        try {
          await container.remove({ force: true })
        } catch (removeError: unknown) {
          if (typeof removeError !== "object" || removeError === null || !("statusCode" in removeError) ||
            removeError.statusCode !== 404) throw removeError
        }
        if (cloningStarted) await fs.rm(workspacePath, { recursive: true, force: true })
        await db.update(apps).set({ buildContainerId: null })
          .where(and(eq(apps.id, appId), eq(apps.buildContainerId, container.id)))
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "Failed to create and clean up the build; cleanup must be retried")
      }
    }
    throw error
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

  let container: Docker.Container | undefined
  try {
    container = await docker.createContainer({
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
    if (container) {
      try {
        await container.remove({ force: true })
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "Hosted container failed to start and cleanup failed")
      }
    }
    throw new Error(`Failed to run container for app ${appId}: ${(error as Error).message}`)
  }
}
