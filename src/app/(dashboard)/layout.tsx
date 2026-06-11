import { AuthProvider } from "@/components/layout/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div style={{ display:"flex", height:"100vh", background:"#F4F6F8" }}>
        <Sidebar/>
        <main style={{ flex:1, overflow:"auto" }}>{children}</main>
      </div>
    </AuthProvider>
  );
}
