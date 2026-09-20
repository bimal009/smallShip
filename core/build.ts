import Docker from "dockerode"
const docker=new Docker()
export async function buildImage(
  appId: string,
  buildPath: string,
  onLog: (line: string) => void
): Promise<string> {
  const imageTag = `shipsmall-app-${appId}:latest`

  const stream = await docker.buildImage(
    { context: buildPath, src: ["."] },
    { t: imageTag }
  )

  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (err) => (err ? reject(err) : resolve()),
      (event) => {
        if (event.stream?.trim()) onLog(event.stream.trim())
        if (event.error) onLog(`ERROR: ${event.error}`)
      }
    )
  })

  return imageTag
}