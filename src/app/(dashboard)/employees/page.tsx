"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Download } from "lucide-react";
import { apiFetch } from "@/hooks/useApi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Employee, Company } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selCo, setSelCo] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Company[]>("/api/companies").then(r => {
      if (r.data) { setCompanies(r.data); if (r.data[0]) setSelCo(r.data[0].id); }
    });
  }, []);

  useEffect(() => {
    if (!selCo) return;
    setLoading(true);
    apiFetch<Employee[]>("/api/employees", { params: { companyId: selCo } })
      .then(r => { if (r.data) setEmployees(r.data); })
      .finally(() => setLoading(false));
  }, [selCo]);

  const filtered = employees.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || e.empCode.toLowerCase().includes(q);
  });

  const co = companies.find(c => c.id === selCo);

  return (
    <div style={{ padding:"20px 28px", fontFamily:"'Prompt','Kanit',sans-serif" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:500, color:"#1C2833" }}>จัดการพนักงาน</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:12, color:"#9aaab8" }}>บริษัท:</span>
          <select value={selCo ?? ""} onChange={e => setSelCo(Number(e.target.value))}
            style={{ fontSize:13, fontWeight:500, padding:"7px 12px", borderRadius:9, border:"1px solid #00B4A9", fontFamily:"'Prompt','Kanit',sans-serif", background:"#e6faf9", color:"#00B4A9", cursor:"pointer", outline:"none" }}>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Button variant="ghost"><Download size={13} strokeWidth={1.8}/> Export</Button>
        <Button variant="teal"><Plus size={13} strokeWidth={2.5}/> เพิ่มพนักงาน</Button>
      </div>
      {/* Search */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fff", border:"1px solid #dde2e8", borderRadius:10, padding:"0 12px", height:38, marginBottom:16, maxWidth:360 }}>
        <Search size={14} strokeWidth={1.8} color="#9aaab8"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรือรหัสพนักงาน..."
          style={{ border:"none", background:"transparent", outline:"none", fontSize:13, color:"#1C2833", fontFamily:"'Prompt','Kanit',sans-serif", flex:1 }}/>
      </div>
      {/* Table */}
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ background:"#F4F6F8" }}>
            {["พนักงาน","แผนก / ตำแหน่ง","วันเริ่มงาน","เงินเดือน","สถานะ"].map(h => (
              <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:11, color:"#9aaab8", fontWeight:500 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding:32, textAlign:"center", color:"#9aaab8" }}>กำลังโหลด...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:32, textAlign:"center", color:"#9aaab8" }}>ไม่พบพนักงาน</td></tr>
            ) : filtered.map(emp => (
              <tr key={emp.id} style={{ borderTop:"1px solid #f0f2f5" }}>
                <td style={{ padding:"11px 16px" }}>
                  <div style={{ fontWeight:500, color:"#1C2833" }}>{emp.firstName} {emp.lastName}</div>
                  <div style={{ fontSize:11, color:"#9aaab8" }}>{emp.empCode}</div>
                </td>
                <td style={{ padding:"11px 16px" }}>
                  <div style={{ fontSize:12, color:"#1C2833" }}>{emp.department?.name}</div>
                  <div style={{ fontSize:11, color:"#9aaab8" }}>{emp.position?.name}</div>
                </td>
                <td style={{ padding:"11px 16px", fontSize:12, color:"#5a6a78" }}>
                  {new Date(emp.hireDate).toLocaleDateString("th-TH")}
                </td>
                <td style={{ padding:"11px 16px", fontSize:12, fontWeight:500, color:"#1C2833" }}>
                  ฿{Number(emp.baseSalary).toLocaleString()}
                </td>
                <td style={{ padding:"11px 16px" }}><StatusBadge status={emp.status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding:"9px 16px", borderTop:"1px solid #f0f2f5", fontSize:12, color:"#9aaab8" }}>
          แสดง {filtered.length} จาก {employees.length} คน
        </div>
      </Card>
    </div>
  );
}
