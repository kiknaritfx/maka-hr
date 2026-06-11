"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/hooks/useApi";
import { Card } from "@/components/ui/Card";
import type { Company, PayrollRun } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);

  useEffect(() => {
    apiFetch<Company[]>("/api/companies").then(r => { if (r.data) setCompanies(r.data); });
    apiFetch<PayrollRun[]>("/api/payroll").then(r => { if (r.data) setRuns(r.data); });
  }, []);

  const totalEmps = companies.reduce((s, c) => s + (c._count?.employees ?? 0), 0);
  const pending = runs.filter(r => r.status === "REVIEW").length;

  return (
    <div style={{ padding:"24px 28px", fontFamily:"'Prompt','Kanit',sans-serif" }}>
      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:20, fontWeight:500, color:"#1C2833" }}>สวัสดี, {user?.name} 👋</div>
        <div style={{ fontSize:12, color:"#9aaab8", marginTop:3 }}>{user?.role} · MAKA HR System</div>
      </div>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          ["บริษัท", String(companies.length), "#00B4A9", "#e6faf9"],
          ["พนักงานรวม", String(totalEmps), "#FF6B6B", "#fff0f0"],
          ["รอ Approve", String(pending), "#854f0b", "#faeeda"],
          ["รอบเดือนนี้", "มิ.ย. 2568", "#534ab7", "#eeedfe"],
        ].map(([l,v,c,bg]) => (
          <Card key={l} style={{ background:bg, border:"none" }}>
            <div style={{ fontSize:11, color:"#5a6a78", marginBottom:6 }}>{l}</div>
            <div style={{ fontSize:22, fontWeight:500, color:c }}>{v}</div>
          </Card>
        ))}
      </div>
      {/* Companies */}
      <Card>
        <div style={{ fontSize:14, fontWeight:500, color:"#1C2833", marginBottom:12 }}>บริษัทที่ดูแล</div>
        {companies.length === 0 ? (
          <div style={{ color:"#9aaab8", fontSize:13, textAlign:"center", padding:20 }}>ยังไม่มีข้อมูล</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {companies.map(co => (
              <div key={co.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#F4F6F8", borderRadius:10 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:co.color, color:co.textColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:500 }}>{co.code}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:"#1C2833" }}>{co.name}</div>
                  <div style={{ fontSize:11, color:"#9aaab8" }}>{co._count?.employees ?? 0} คน</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
