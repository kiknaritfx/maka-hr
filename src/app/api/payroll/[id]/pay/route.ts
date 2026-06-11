import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden, notFound } from "@/lib/response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (session!.role !== "ADMIN") return forbidden();
    const run = await prisma.payrollRun.findUnique({ where: { id: Number(params.id) } });
    if (!run) return notFound();
    if (!canAccessCompany(session!, run.companyId)) return forbidden();
    if (run.status !== "APPROVED") return err("ต้องอนุมัติก่อนยืนยันการจ่าย");
    const updated = await prisma.payrollRun.update({
      where: { id: Number(params.id) },
      data: { status: "PAID", paidAt: new Date() },
    });
    return ok(updated);
  });
}
