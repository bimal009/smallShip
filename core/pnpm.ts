import Docker from 'dockerode'
import { Writable } from 'node:stream';

const docker = new Docker()

export const installAndBuildPnpm = async (
  appId: string
): Promise<{ exitCode: number; output: string }> => {
  const container = docker.getContainer(`sandbox-${appId}`)

  const exec = await container.exec({
    Cmd: ['sh', '-c', 'pnpm install && pnpm build'],
    WorkingDir: '/workspace',
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
  })

  const stream = await exec.start({ hijack: true, stdin: false })

  let output = ''
  const collect = new Writable({
    write(chunk, _enc, cb) {
      output += chunk.toString()
      cb()
    },
  })
  container.modem.demuxStream(stream, collect, collect)

  return new Promise((resolve, reject) => {
    stream.on('end', async () => {
      try {
        const { ExitCode } = await exec.inspect()
        resolve({ exitCode: ExitCode ?? 1, output })
      } catch (err) {
        reject(err)
      }
    })
    stream.on('error', reject)
  })
}