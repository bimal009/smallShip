import fs from "fs/promises"
import path from "path"

const SANDBOX_ROOT = process.env.SANDBOX_ROOT ?? "/var/shipsmall/sandboxes"

function resolveSafePath(appId: string, relativePath: string): string {
  const workspacePath = path.resolve(SANDBOX_ROOT, appId)
  const target = path.resolve(workspacePath, relativePath)

  if (!target.startsWith(workspacePath + path.sep) && target !== workspacePath) {
    throw new Error(`path traversal blocked: ${relativePath}`)
  }
  return target
}

export async function readFile(appId: string, relativePath: string) {
  const target = resolveSafePath(appId, relativePath)
  return fs.readFile(target, "utf-8")
}

export async function writeFile(appId: string, relativePath: string, content: string) {
  const target = resolveSafePath(appId, relativePath)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, content, "utf-8")
}

export async function deleteFile(appId: string, relativePath: string) {
  const target = resolveSafePath(appId, relativePath)
  await fs.rm(target, { recursive: true, force: true })
}

export async function listFiles(appId: string, relativePath: string = ".") {
  const target = resolveSafePath(appId, relativePath)
  const entries = await fs.readdir(target, { withFileTypes: true })
  return entries.map((e) => ({
    name: e.name,
    type: e.isDirectory() ? "dir" : "file",
  }))
}

export async function editFile(appId: string, relativePath: string, oldStr: string, newStr: string) {
  const target = resolveSafePath(appId, relativePath)
  const content = await fs.readFile(target, "utf-8")

  const matches = content.split(oldStr).length - 1
  if (matches === 0) throw new Error("no match found for oldStr")
  if (matches > 1) throw new Error(`oldStr matches ${matches} times, must be unique`)

  const updated = content.replace(oldStr, () => newStr)
  await fs.writeFile(target, updated, "utf-8")
}
