import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    const companies = await prisma.company.findMany({
      where: session!.companies === "all"
        ? {}
        : { id: { in: session!.companies.split(",").map(Number) } },
      include: {
        departments: true,
        positions: true,
        _count: { select: { employees: true } },
      },
      orderBy: { id: "asc" },
    });
    return ok(companies);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    if (session!.role !== "ADMIN") return forbidden();
    const data = await req.json();
    const company = await prisma.company.create({ data });
    return ok(company, 201);
  });
}
