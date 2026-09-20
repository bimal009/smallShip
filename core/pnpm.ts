import Docker from "dockerode";
import { Writable } from "node:stream";

const docker = new Docker();

export const installAndBuildPnpm = async (
  containerId: string
): Promise<{ exitCode: number; output: string }> => {
  const container = docker.getContainer(containerId);

  const exec = await container.exec({
    Cmd: ["sh", "-c", "pnpm install && pnpm build"],
    WorkingDir: "/workspace",
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
  });

  const stream = await exec.start({
    hijack: true,
    stdin: false,
  });

  let output = "";

  const stdout = new Writable({
    write(chunk, _enc, cb) {
      const text = chunk.toString();

      output += text;

      cb();
    },
  });

  const stderr = new Writable({
    write(chunk, _enc, cb) {
      const text = chunk.toString();

      output += text;

      cb();
    },
  });

  container.modem.demuxStream(stream, stdout, stderr);

  return new Promise((resolve, reject) => {
    stream.on("end", async () => {
      try {
        const inspect = await exec.inspect();

        const exitCode = inspect.ExitCode ?? 1;

        if (exitCode !== 0) {
          console.error(
            `[build:${containerId}] Build failed with exit code ${exitCode}`
          );
        }

        resolve({
          exitCode,
          output,
        });
      } catch (error) {
        console.error(`[build:${containerId}] Failed to inspect exec`, error);
        reject(error);
      }
    });

    stream.on("error", (error) => {
      console.error(`[build:${containerId}] Stream error`, error);
      reject(error);
    });
  });
};