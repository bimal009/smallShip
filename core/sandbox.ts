import Docker from "dockerode"
import { cloneRepo } from "./clone"

const docker = new Docker()
const SANDBOX_ROOT = process.env.SANDBOX_ROOT ?? "/var/shipsmall/sandboxes"

export async function initSandbox(appId: string, repoFullName: string, branch: string) {
  const workspacePath = `${SANDBOX_ROOT}/${appId}`
  await cloneRepo(appId, repoFullName, branch,SANDBOX_ROOT)

  const container = await docker.createContainer({
    Image: "node:24-slim",
    name: `sandbox-${appId}`,
    Cmd: ["sleep", "infinity"],
    User: "1000:1000",
    HostConfig: {
      // Runtime: "runsc", enable in prod
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
  return container.id
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