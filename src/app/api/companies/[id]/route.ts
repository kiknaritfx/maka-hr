import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden, notFound } from "@/lib/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    const id = Number(params.id);
    if (!canAccessCompany(session!, id)) return forbidden();
    const company = await prisma.company.findUnique({
      where: { id },
    });
    if (!company) return notFound();
    return ok(company);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!["ADMIN","HR"].includes(session!.role)) return forbidden();
    const id = Number(params.id);
    if (!canAccessCompany(session!, id)) return forbidden();
    const data = await req.json();
    const company = await prisma.company.update({ where: { id }, data });
    return ok(company);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (session!.role !== "ADMIN") return forbidden();
    await prisma.company.delete({ where: { id: Number(params.id) } });
    return ok({ deleted: true });
  });
}
