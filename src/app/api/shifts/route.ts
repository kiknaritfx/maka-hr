import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, forbidden } from "@/lib/response";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    const companyId = new URL(req.url).searchParams.get("companyId");
    const where: Record<string, unknown> = {};
    if (companyId) {
      const cid = Number(companyId);
      if (!canAccessCompany(session!, cid)) return forbidden();
      where.companyId = cid;
    } else {
      if (session!.companies !== "all")
        where.companyId = { in: session!.companies.split(",").map(Number) };
    }
    const shifts = await prisma.shift.findMany({ where, include: { _count: { select: { employees: true } } }, orderBy: { id: "asc" } });
    return ok(shifts);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    if (!["ADMIN","HR"].includes(session!.role)) return forbidden();
    const data = await req.json();
    if (!canAccessCompany(session!, data.companyId)) return forbidden();
    const shift = await prisma.shift.create({ data });
    return ok(shift, 201);
  });
}
