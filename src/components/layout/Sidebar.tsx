"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, Wallet, Clock,
  BarChart3, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { key:"dashboard",  href:"/dashboard",  Icon:LayoutDashboard, label:"ภาพรวม" },
  { key:"companies",  href:"/companies",  Icon:Building2,       label:"บริษัท" },
  { key:"employees",  href:"/employees",  Icon:Users,           label:"พนักงาน" },
  { key:"payroll",    href:"/payroll",    Icon:Wallet,          label:"เงินเดือน" },
  { key:"shifts",     href:"/shifts",     Icon:Clock,           label:"กะการทำงาน" },
  { key:"reports",    href:"/reports",    Icon:BarChart3,       label:"รายงาน" },
  { key:"settings",   href:"/settings",   Icon:Settings,        label:"ตั้งค่า" },
];

const TEAL="#00B4A9"; const CORAL="#FF6B6B";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside style={{ width:200, background:"#fff", borderRight:"1px solid #eaecef", display:"flex", flexDirection:"column", flexShrink:0, fontFamily:"'Prompt','Kanit',sans-serif" }}>
      {/* Logo */}
      <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid #eaecef" }}>
        <div style={{ fontSize:21, fontWeight:500, color:TEAL, letterSpacing:-0.5 }}>
          MA<span style={{ color:CORAL }}>KA</span>
        </div>
        <div style={{ fontSize:10, color:"#9aaab8", marginTop:1 }}>HR Management</div>
      </div>
      {/* Nav */}
      <nav style={{ flex:1, padding:"8px 0" }}>
        {NAV.map(({ href, Icon, label }) => {
          const active = pathname.startsWith(href);
          if (user?.role === "VIEW" && ["/payroll","/settings"].includes(href)) return null;
          return (
            <Link key={href} href={href} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", fontSize:13, color: active?TEAL:"#5a6a78", background: active?"#e6faf9":"transparent", fontWeight: active?500:400, borderRight: active?`3px solid ${TEAL}`:"3px solid transparent", textDecoration:"none" }}>
              <Icon size={16} strokeWidth={1.8}/>{label}
            </Link>
          );
        })}
      </nav>
      {/* User */}
      <div style={{ borderTop:"1px solid #eaecef", padding:"10px 14px", display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:32, height:32, borderRadius:10, background:"#e6faf9", color:TEAL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:500, flexShrink:0 }}>
          {user?.name?.slice(0,2)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:500, color:"#1C2833", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</div>
          <div style={{ fontSize:10, color:"#9aaab8" }}>{user?.role}</div>
        </div>
        <button onClick={logout} title="ออกจากระบบ" style={{ width:28, height:28, borderRadius:8, background:"transparent", border:"1px solid #eaecef", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#9aaab8" }}>
          <LogOut size={13} strokeWidth={1.8}/>
        </button>
      </div>
    </aside>
  );
}
