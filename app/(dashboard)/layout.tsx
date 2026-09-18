import { auth } from "@/auth";
import { DashboardShell } from "@/components/app-sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return (
    <DashboardShell user={{ name: session.user.name, email: session.user.email, avatar: session.user.image ?? undefined }}>
      {children}
    </DashboardShell>
  );
}
