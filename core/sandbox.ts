
import Docker from "dockerode"
import fs from "node:fs/promises"
import { cloneRepo } from "./clone"


const docker = new Docker()
export const SANDBOX_ROOT = process.env.SANDBOX_ROOT ?? "/var/shipsmall/sandboxes"

export const workSpacePath=(appId:string)=> `${SANDBOX_ROOT}/${appId}`

interface SandboxResult {
  containerId: string
  workspacePath: string
}

export async function initSandbox(
  appId: string,
  repoFullName: string,
  branch: string
): Promise<SandboxResult> {
  const workspacePath = workSpacePath(appId)

  try {
    await cloneRepo(appId, repoFullName, branch, SANDBOX_ROOT)
  } catch (error) {
    throw new Error(`Failed to clone repo for app ${appId}: ${(error as Error).message}`)
  }

  try {
    const container = await docker.createContainer({
      Image: "node:24-slim",
      name: `sandbox-${appId}`,
      Cmd: ["sleep", "infinity"],
      User: "1000:1000",
      HostConfig: {
        // Runtime: "runsc", // enable in prod
        SecurityOpt: ["no-new-privileges"],
        CapDrop: ["ALL"],
        Memory: 512 * 1024 * 1024,
        CpuQuota: 100000,
        PidsLimit: 128,
        Binds: [`${workspacePath}:/workspace`],
        NetworkMode: "none",
      },
      WorkingDir: "/workspace",
    })

    await container.start()
    return { containerId: container.id, workspacePath }
  } catch (error) {
    throw new Error(`Failed to start container for app ${appId}: ${(error as Error).message}`)
  }
}



export async function destroySandbox(appId: string) {
  const container = docker.getContainer(`sandbox-${appId}`)

  try {
    await container.stop()
  } catch (err: unknown) {
    if (
      typeof err !== "object" || err === null || !("statusCode" in err) ||
      (err.statusCode !== 304 && err.statusCode !== 404)
    ) throw err
  }

  try {
    await container.remove()
  } catch (err: unknown) {
    if (
      typeof err !== "object" || err === null || !("statusCode" in err) ||
      err.statusCode !== 404
    ) throw err
  }

  await fs.rm(workSpacePath(appId), { recursive: true, force: true })
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
