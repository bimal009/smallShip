import { KeysForm } from "@/features/keys/components/KeysForm"
import { KeysList } from "@/features/keys/components/KeysPage"

export default function KeysPage() {
  return (
    <div className=" mx-auto py-5 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">API keys</h1>
          <p className="text-sm text-muted-foreground">
            Used by your coding agent to call ShipSmall&apos;s MCP server.
          </p>
        </div>
        <KeysForm />
      </div>

      <KeysList />
    </div>
  )
}
