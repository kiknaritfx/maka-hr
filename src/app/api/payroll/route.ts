import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";
import { calcWHT, calcSSO } from "@/lib/tax";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const where: Record<string, unknown> = {};
    if (companyId) {
      const cid = Number(companyId);
      if (!canAccessCompany(session!, cid)) return forbidden();
      where.companyId = cid;
    } else {
      if (session!.companies !== "all")
        where.companyId = { in: session!.companies.split(",").map((s: string) => Number(s)) };
    }
    const runs = await prisma.payrollRun.findMany({
      where,
      include: { company: { select: { id:true, code:true, name:true, color:true, textColor:true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return ok(runs);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    if (!["ADMIN","HR"].includes(session!.role)) return forbidden();
    const { companyId, month, year, overrides } = await req.json();
    if (!canAccessCompany(session!, companyId)) return forbidden();

    const existing = await prisma.payrollRun.findUnique({ where: { companyId_month_year: { companyId, month, year } } });
    if (existing) return err("มีรอบเงินเดือนนี้แล้ว");

    const employees = await prisma.employee.findMany({
      where: { companyId, status: { in: ["ACTIVE","PROBATION"] } },
      include: { benefits: true },
    });

    let totalGross=0, totalBenefits=0, totalBonus=0, totalTax=0, totalSso=0, totalNet=0;
    const items = employees.map((emp: typeof employees[0]) => {
      const ov = overrides?.[emp.id] || {};
      const isPartTime = emp.contractType === "PARTTIME";
      const hoursWorked = ov.hoursWorked ? Number(ov.hoursWorked) : null;
      const gross = isPartTime && hoursWorked
        ? Number(emp.baseSalary) * hoursWorked
        : Number(emp.baseSalary);
      const benefits = ov.benefits !== undefined ? Number(ov.benefits) : emp.benefits.reduce((s,b) => s+Number(b.amount), 0);
      const bonus = ov.bonus !== undefined ? Number(ov.bonus) : 0;
      const sso = isPartTime ? 0 : calcSSO(Number(emp.baseSalary));
      const tax = isPartTime ? 0 : (ov.tax !== undefined ? Number(ov.tax) : calcWHT(Number(emp.baseSalary), sso));
      const otherDeduct = ov.otherDeduct ? Number(ov.otherDeduct) : 0;
      const net = gross + benefits + bonus - tax - sso - otherDeduct;

      totalGross += gross; totalBenefits += benefits; totalBonus += bonus;
      totalTax += tax; totalSso += sso; totalNet += net;

      return { employeeId:emp.id, baseAmount:gross, benefits, bonus, tax, sso, otherDeduct, netAmount:net, hoursWorked };
    });

    const run = await prisma.payrollRun.create({
      data: {
        companyId, month, year, status: "REVIEW",
        totalGross, totalBenefits, totalBonus, totalTax, totalSso, totalNet,
        items: { create: items },
      },
      include: { items: true },
    });
    return ok(run, 201);
  });
}
