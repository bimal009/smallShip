import { createMcpHandler, withMcpAuth } from "mcp-handler"
import { registerMcpTools } from "@/mcp/apps"
import { registerFileTools } from "@/mcp/files"
import { registerSandboxTools } from "@/mcp/sandbox"
import { registerGithubTools } from "@/mcp/github"
import { registerDbTools } from "@/mcp/db"
import { registerPnpmTools } from "@/mcp/pnpm"
import { conventions, registerConventionsResource } from "@/mcp/resources/conventions"
import { verifyApiKeyToken } from "@/mcp/core/auth"

export const runtime = "nodejs"

const handler = createMcpHandler((server) => {
  registerMcpTools(server)
  registerFileTools(server)
  registerSandboxTools(server)
  registerGithubTools(server)
  registerDbTools(server)
  registerPnpmTools(server)
  registerConventionsResource(server)
}, {
  serverInfo: { name: "small-ship", version: "1.0.0" },
  instructions: conventions,
})

const authedHandler = withMcpAuth(handler, verifyApiKeyToken)

export { authedHandler as GET, authedHandler as POST }
