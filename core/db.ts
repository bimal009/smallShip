import Docker from "dockerode";
import { Writable } from "node:stream";

const docker = new Docker();

export const generate = async (
  containerId: string
): Promise<{ exitCode: number; output: string }> => {
  const container = docker.getContainer(containerId);

  const exec = await container.exec({
    Cmd: ["pnpm", "generate"],
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
        const { ExitCode } = await exec.inspect();

        resolve({
          exitCode: ExitCode ?? 1,
          output,
        });
      } catch (error) {
        reject(error);
      }
    });

    stream.on("error", reject);
  });
};

export const migrate = async (
  containerId: string
): Promise<{ exitCode: number; output: string }> => {
  const container = docker.getContainer(containerId);

  const exec = await container.exec({
    Cmd: ["pnpm", "migrate"],
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
        const { ExitCode } = await exec.inspect();

        resolve({
          exitCode: ExitCode ?? 1,
          output,
        });
      } catch (error) {
        reject(error);
      }
    });

    stream.on("error", reject);
  });
};