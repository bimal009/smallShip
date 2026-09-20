import Docker from "dockerode"
import fs from "node:fs/promises"
import path from "node:path"
const docker = new Docker()

const runnerDefinition = `FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
`

export async function buildImage(
  appId: string,
  buildPath: string,
  onLog: (line: string) => void
): Promise<string> {
  const imageTag = `shipsmall-app-${appId}:latest`
  // Docker's image-build API requires a Dockerfile in its build context.
  // Generate it from code instead of depending on a checked-in runner file.
  const dockerfile = ".shipsmall-runner.Dockerfile"
  await fs.writeFile(path.join(buildPath, dockerfile), runnerDefinition)

  const stream = await docker.buildImage(
    { context: buildPath, src: ["."] },
    { t: imageTag, dockerfile }
  )

  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (err) => (err ? reject(err) : resolve()),
      (event) => {
        if (event.stream?.trim()) onLog(event.stream.trim())
        if (event.error) reject(new Error(event.error))
      }
    )
  })

  return imageTag
}
