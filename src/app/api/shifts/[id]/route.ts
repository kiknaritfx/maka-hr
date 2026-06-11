import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, forbidden, notFound } from "@/lib/response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!["ADMIN","HR"].includes(session!.role)) return forbidden();
    const shift = await prisma.shift.findUnique({ where: { id: Number(params.id) } });
    if (!shift) return notFound();
    if (!canAccessCompany(session!, shift.companyId)) return forbidden();
    const updated = await prisma.shift.update({ where: { id: Number(params.id) }, data: await req.json() });
    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!["ADMIN","HR"].includes(session!.role)) return forbidden();
    const shift = await prisma.shift.findUnique({ where: { id: Number(params.id) } });
    if (!shift) return notFound();
    if (!canAccessCompany(session!, shift.companyId)) return forbidden();
    await prisma.shift.delete({ where: { id: Number(params.id) } });
    return ok({ deleted: true });
  });
}
