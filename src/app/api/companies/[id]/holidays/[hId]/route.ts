import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, forbidden } from "@/lib/response";

export async function DELETE(req: NextRequest, { params }: { params: { id: string; hId: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session || !["ADMIN","HR"].includes(session.role)) return forbidden();
    if (!canAccessCompany(session, Number(params.id))) return forbidden();
    await prisma.holiday.delete({ where: { id: Number(params.hId) } });
    return ok({ deleted: true });
  });
}
