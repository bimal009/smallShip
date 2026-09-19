import { AppsList } from "@/features/apps/components/AppsPage"

export default function AppsPage() {
  return (
    <div className="mx-auto space-y-6 px-4 py-5">
      <div>
        <h1 className="text-xl font-semibold">Apps</h1>
        <p className="text-sm text-muted-foreground">
          Your apps and their deployment status.
        </p>
      </div>
      <AppsList />
    </div>
  )
}
