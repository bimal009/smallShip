import { createMcpHandler, withMcpAuth } from "mcp-handler"
import { registerMcpTools } from "@/mcp/apps"
import { registerFileTools } from "@/mcp/files"
import { registerSandboxTools } from "@/mcp/sandbox"
import { verifyApiKeyToken } from "@/mcp/core/auth"

export const runtime = "nodejs"

const handler = createMcpHandler((server) => {
  registerMcpTools(server)
  registerFileTools(server)
  registerSandboxTools(server)
}, {
  serverInfo: { name: "small-ship", version: "1.0.0" },
})

const authedHandler = withMcpAuth(handler, verifyApiKeyToken)

export { authedHandler as GET, authedHandler as POST }
