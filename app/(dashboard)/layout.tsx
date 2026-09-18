import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { headers } from "next/headers";



export default async function DashboardLayout({ children }:{children:React.ReactNode}) {
   const session = await auth.api.getSession({ headers: await headers() })
   console.log(session)
  return (


    <>

        <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        user={{
          name: session!.user.name,
          email: session!.user.email,
          avatar: session!.user.image ?? undefined,
        }}
      />
    {children}

      <SidebarInset>
    
      </SidebarInset>
    </SidebarProvider>
    
    
    </>
  );
}
