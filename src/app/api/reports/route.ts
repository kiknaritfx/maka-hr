import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const companyId = searchParams.get("companyId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const coFilter = companyId
      ? { companyId: Number(companyId) }
      : session!.companies !== "all"
        ? { companyId: { in: session!.companies.split(",").map((s: string) => Number(s)) } }
        : {};

    if (companyId && !canAccessCompany(session!, Number(companyId))) return forbidden();

    switch (type) {
      case "payroll_summary": {
        const runs = await prisma.payrollRun.findMany({
          where: { ...coFilter, ...(month && year ? { month: Number(month), year: Number(year) } : {}) },
          include: { company: true, _count: { select: { items: true } } },
          orderBy: [{ year:"desc" }, { month:"desc" }],
        });
        return ok(runs);
      }
      case "headcount": {
        const emps = await prisma.employee.findMany({
          where: coFilter,
          include: { company: { select:{id:true,code:true,name:true} }, department: true, position: true },
        });
        return ok(emps);
      }
      case "payroll_detail": {
        const items = await prisma.payrollItem.findMany({
          where: { payrollRun: { ...coFilter, ...(month && year ? { month:Number(month), year:Number(year) } : {}) } },
          include: { employee: { include:{ department:true, position:true, company:{select:{code:true,name:true}} } }, payrollRun: true },
        });
        return ok(items);
      }
      default:
        return err("ระบุประเภทรายงาน: payroll_summary | headcount | payroll_detail");
    }
  });
}
