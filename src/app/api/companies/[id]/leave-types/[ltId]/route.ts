import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden, notFound } from "@/lib/response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; ltId: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session || !["ADMIN","HR"].includes(session.role)) return forbidden();
    const companyId = Number(params.id);
    if (!canAccessCompany(session, companyId)) return forbidden();
    const data = await req.json();
    const lt = await prisma.leaveType.update({
      where: { id: Number(params.ltId) },
      data: { ...data, maxDaysPerYear: data.noLimit ? null : (data.maxDaysPerYear||null) }
    });
    return ok(lt);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; ltId: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session || !["ADMIN","HR"].includes(session.role)) return forbidden();
    const companyId = Number(params.id);
    if (!canAccessCompany(session, companyId)) return forbidden();
    await prisma.leaveType.delete({ where: { id: Number(params.ltId) } });
    return ok({ deleted: true });
  });
}
