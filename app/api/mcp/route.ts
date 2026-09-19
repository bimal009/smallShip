import { createMcpHandler, withMcpAuth } from "mcp-handler"
import { registerMcpTools } from "@/mcp"
import { verifyApiKeyToken } from "@/mcp/core/auth"

export const runtime = "nodejs"

const handler = createMcpHandler(registerMcpTools, {
  serverInfo: { name: "small-ship", version: "1.0.0" },
})

const authedHandler = withMcpAuth(handler, verifyApiKeyToken)

export { authedHandler as GET, authedHandler as POST }