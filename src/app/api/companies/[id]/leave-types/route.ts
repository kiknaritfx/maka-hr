import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session) return forbidden();
    const companyId = Number(params.id);
    if (!canAccessCompany(session, companyId)) return forbidden();
    const leaveTypes = await prisma.leaveType.findMany({ where: { companyId }, orderBy: { id: "asc" } });
    return ok(leaveTypes);
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session || !["ADMIN","HR"].includes(session.role)) return forbidden();
    const companyId = Number(params.id);
    if (!canAccessCompany(session, companyId)) return forbidden();
    const { name, icon, color, maxDaysPerYear, isPaid, requireApproval, isAccumulated, noLimit } = await req.json();
    if (!name?.trim()) return err("กรุณาระบุชื่อประเภทการลา");
    const lt = await prisma.leaveType.create({
      data: { companyId, name: name.trim(), icon: icon||"Umbrella", color: color||"#e6faf9",
               maxDaysPerYear: noLimit ? null : (maxDaysPerYear||null),
               isPaid: isPaid??true, requireApproval: requireApproval??true,
               isAccumulated: isAccumulated??false, noLimit: noLimit??false }
    });
    return ok(lt, 201);
  });
}
