"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/useApi";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PayrollRun } from "@/types";

const MONTHS = ["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PayrollRun[]>("/api/payroll")
      .then(r => { if (r.data) setRuns(r.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding:"20px 28px", fontFamily:"'Prompt','Kanit',sans-serif" }}>
      <div style={{ fontSize:20, fontWeight:500, color:"#1C2833", marginBottom:20 }}>เงินเดือน</div>
      <Card style={{ padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ background:"#F4F6F8" }}>
            {["บริษัท","รอบ","Gross","Net Pay","สถานะ"].map(h => (
              <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:11, color:"#9aaab8", fontWeight:500 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding:32, textAlign:"center", color:"#9aaab8" }}>กำลังโหลด...</td></tr>
            ) : runs.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:32, textAlign:"center", color:"#9aaab8" }}>ยังไม่มีรอบเงินเดือน</td></tr>
            ) : runs.map(r => (
              <tr key={r.id} style={{ borderTop:"1px solid #f0f2f5" }}>
                <td style={{ padding:"11px 16px" }}>
                  <div style={{ fontWeight:500, color:"#1C2833" }}>{r.company?.name}</div>
                  <div style={{ fontSize:11, color:"#9aaab8" }}>{r.company?.code}</div>
                </td>
                <td style={{ padding:"11px 16px", fontSize:12, color:"#5a6a78" }}>{MONTHS[r.month]} {r.year}</td>
                <td style={{ padding:"11px 16px", fontSize:12, color:"#1C2833" }}>฿{Number(r.totalGross).toLocaleString()}</td>
                <td style={{ padding:"11px 16px", fontSize:13, fontWeight:500, color:"#FF6B6B" }}>฿{Number(r.totalNet).toLocaleString()}</td>
                <td style={{ padding:"11px 16px" }}><StatusBadge status={r.status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
