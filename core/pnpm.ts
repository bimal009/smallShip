import Docker from "dockerode";
import { Writable } from "node:stream";

const docker = new Docker();

export const installPnpm = async (
  containerId: string
): Promise<{ exitCode: number; output: string }> => {
  const container = docker.getContainer(containerId);

  const exec = await container.exec({
    Cmd: ["pnpm", "install"],
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
      output += chunk.toString();
      cb();
    },
  });

  const stderr = new Writable({
    write(chunk, _enc, cb) {
      output += chunk.toString();
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
            `[install:${containerId}] pnpm install failed with exit code ${exitCode}`
          );
        }

        resolve({
          exitCode,
          output,
        });
      } catch (error) {
        console.error(
          `[install:${containerId}] Failed to inspect exec`,
          error
        );
        reject(error);
      }
    });

    stream.on("error", (error) => {
      console.error(`[install:${containerId}] Stream error`, error);
      reject(error);
    });
  });
};

export const buildPnpm = async (
  containerId: string
): Promise<{ exitCode: number; output: string }> => {
  const container = docker.getContainer(containerId);

  const exec = await container.exec({
    Cmd: ["pnpm", "build"],
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
      output += chunk.toString();
      cb();
    },
  });

  const stderr = new Writable({
    write(chunk, _enc, cb) {
      output += chunk.toString();
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
            `[build:${containerId}] pnpm build failed with exit code ${exitCode}`
          );
        }

        resolve({
          exitCode,
          output,
        });
      } catch (error) {
        console.error(
          `[build:${containerId}] Failed to inspect exec`,
          error
        );
        reject(error);
      }
    });

    stream.on("error", (error) => {
      console.error(`[build:${containerId}] Stream error`, error);
      reject(error);
    });
  });
};