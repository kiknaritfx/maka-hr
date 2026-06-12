import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";

export async function DELETE(req: NextRequest, { params }: { params: { id: string; posId: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session || !["ADMIN","HR"].includes(session.role)) return forbidden();
    if (!canAccessCompany(session, Number(params.id))) return forbidden();
    const empCount = await prisma.employee.count({ where: { positionId: Number(params.posId) } });
    if (empCount > 0) return err("ไม่สามารถลบได้ มีพนักงาน " + empCount + " คนในตำแหน่งนี้");
    await prisma.position.delete({ where: { id: Number(params.posId) } });
    return ok({ deleted: true });
  });
}
