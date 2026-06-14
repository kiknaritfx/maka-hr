import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden, notFound } from "@/lib/response";

// ── HTML Payslip template ──
function buildPayslipHTML(emp: any, item: any, run: any, company: any): string {
  const fmt = (n: number) => Number(n || 0).toLocaleString("th-TH");
  const MONTHS = ["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const gross = Number(item.baseAmount);
  const ben   = Number(item.benefits);
  const bonus = Number(item.bonus);
  const tax   = Number(item.tax);
  const sso   = Number(item.sso);
  const other = Number(item.otherDeduct);
  const net   = Number(item.netAmount);

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{font-family:'Prompt','Sarabun',sans-serif;background:#f4f6f8;margin:0;padding:20px;color:#1C2833;}
  .card{background:#fff;border-radius:16px;max-width:520px;margin:0 auto;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,.08);}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:1px solid #eaecef;margin-bottom:18px;}
  .company{font-size:18px;font-weight:500;color:#00B4A9;letter-spacing:-0.5px;}
  .period{font-size:12px;color:#9aaab8;margin-top:3px;}
  .emp-name{font-size:16px;font-weight:500;color:#1C2833;}
  .emp-sub{font-size:12px;color:#9aaab8;margin-top:2px;}
  .section-title{font-size:11px;font-weight:500;color:#9aaab8;text-transform:uppercase;letter-spacing:.5px;margin:14px 0 8px;}
  .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f4f6f8;font-size:13px;}
  .row:last-child{border-bottom:none;}
  .label{color:#5a6a78;}
  .value-add{color:#00B4A9;font-weight:500;}
  .value-ded{color:#cc4444;font-weight:500;}
  .value-def{color:#1C2833;font-weight:500;}
  .net-row{display:flex;justify-content:space-between;padding:14px 0 0;margin-top:8px;border-top:2px solid #eaecef;}
  .net-label{font-size:15px;font-weight:500;color:#1C2833;}
  .net-value{font-size:22px;font-weight:500;color:#FF6B6B;}
  .badge{display:inline-block;background:#e6faf9;color:#007d75;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:500;}
  .footer{margin-top:20px;padding-top:14px;border-top:1px solid #eaecef;font-size:11px;color:#9aaab8;text-align:center;}
</style></head>
<body>
<div class="card">
  <div class="header">
    <div>
      <div class="company">${company.name}</div>
      <div class="period">สลิปเงินเดือน · ${MONTHS[run.month]} ${run.year + 543}</div>
    </div>
    <span class="badge">จ่ายแล้ว</span>
  </div>
  <div class="emp-name">${emp.firstName} ${emp.lastName}</div>
  <div class="emp-sub">${emp.empCode} · ${emp.position?.name || ""} · ${emp.department?.name || ""}</div>

  <div class="section-title">รายรับ</div>
  <div class="row"><span class="label">เงินเดือนฐาน</span><span class="value-def">฿${fmt(gross)}</span></div>
  ${ben > 0 ? `<div class="row"><span class="label">สวัสดิการ</span><span class="value-add">+฿${fmt(ben)}</span></div>` : ""}
  ${bonus > 0 ? `<div class="row"><span class="label">โบนัส</span><span class="value-add">+฿${fmt(bonus)}</span></div>` : ""}

  <div class="section-title">รายการหัก</div>
  ${tax > 0 ? `<div class="row"><span class="label">ภาษีเงินได้หัก ณ ที่จ่าย</span><span class="value-ded">-฿${fmt(tax)}</span></div>` : ""}
  ${sso > 0 ? `<div class="row"><span class="label">ประกันสังคม</span><span class="value-ded">-฿${fmt(sso)}</span></div>` : ""}
  ${other > 0 ? `<div class="row"><span class="label">หักอื่นๆ</span><span class="value-ded">-฿${fmt(other)}</span></div>` : ""}

  <div class="net-row">
    <span class="net-label">เงินเดือนสุทธิ</span>
    <span class="net-value">฿${fmt(net)}</span>
  </div>
  <div class="footer">เอกสารนี้ออกโดยระบบ MAKA HR · ${new Date().toLocaleDateString("th-TH", {year:"numeric",month:"long",day:"numeric"})}</div>
</div>
</body></html>`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!["ADMIN","HR"].includes(session!.role)) return forbidden();

    const { employeeIds, sendAll } = await req.json();

    const run = await prisma.payrollRun.findUnique({
      where: { id: Number(params.id) },
      include: {
        company: true,
        items: {
          include: {
            employee: {
              include: {
                department: { select: { name: true } },
                position:   { select: { name: true } },
              }
            }
          },
          ...((!sendAll && employeeIds?.length) ? { where: { employeeId: { in: employeeIds } } } : {})
        }
      }
    });

    if (!run) return notFound();
    if (!canAccessCompany(session!, run.companyId)) return forbidden();
    if (run.status !== "PAID") return err("ต้องยืนยันการจ่ายก่อนส่ง Payslip");

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) return err("ยังไม่ได้ตั้งค่า RESEND_API_KEY");

    const results: { name: string; email: string; success: boolean; error?: string }[] = [];

    for (const item of run.items) {
      const emp = item.employee;
      if (!emp?.email) {
        results.push({ name: `${emp?.firstName} ${emp?.lastName}`, email: "", success: false, error: "ไม่มีอีเมล" });
        continue;
      }

      const html = buildPayslipHTML(emp, item, run, run.company);

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || "MAKA HR <payslip@yourdomain.com>",
            to: [emp.email],
            subject: `สลิปเงินเดือน ${run.company.name} — ${run.month}/${run.year + 543}`,
            html,
          })
        });
        const data = await res.json();
        if (res.ok) {
          results.push({ name: `${emp.firstName} ${emp.lastName}`, email: emp.email, success: true });
        } else {
          results.push({ name: `${emp.firstName} ${emp.lastName}`, email: emp.email, success: false, error: data.message });
        }
      } catch (e: any) {
        results.push({ name: `${emp.firstName} ${emp.lastName}`, email: emp.email, success: false, error: e.message });
      }
    }

    const sent = results.filter(r => r.success).length;
    return ok({ sent, total: results.length, results });
  });
}
