import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";

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
      if (session!.companies !== "all") {
        where.companyId = { in: session!.companies.split(",").map((s: string) => Number(s)) };
      }
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        position: true,
        shift: true,
        manager: { select: { id: true, firstName: true, lastName: true, empCode: true } },
        benefits: true,
      },
      orderBy: { empCode: "asc" },
    });
    return ok(employees);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    if (!["ADMIN","HR"].includes(session!.role)) return forbidden();
    const data = await req.json();
    if (!canAccessCompany(session!, data.companyId)) return forbidden();

    const { benefits, ...empData } = data;
    const employee = await prisma.employee.create({
      data: {
        ...empData,
        hireDate: new Date(empData.hireDate),
        birthDate: empData.birthDate ? new Date(empData.birthDate) : undefined,
        baseSalary: Number(empData.baseSalary),
        benefits: benefits?.length
          ? { create: benefits }
          : undefined,
      },
      include: { department: true, position: true, benefits: true },
    });
    return ok(employee, 201);
  });
}
