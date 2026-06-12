import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; deptId: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session || !["ADMIN","HR"].includes(session.role)) return forbidden();
    if (!canAccessCompany(session, Number(params.id))) return forbidden();
    const { name } = await req.json();
    if (!name?.trim()) return err("กรุณาระบุชื่อแผนก");
    const dept = await prisma.department.update({ where: { id: Number(params.deptId) }, data: { name: name.trim() } });
    return ok(dept);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; deptId: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session || !["ADMIN","HR"].includes(session.role)) return forbidden();
    if (!canAccessCompany(session, Number(params.id))) return forbidden();
    const empCount = await prisma.employee.count({ where: { departmentId: Number(params.deptId) } });
    if (empCount > 0) return err("ไม่สามารถลบได้ มีพนักงาน " + empCount + " คนในแผนกนี้");
    await prisma.department.delete({ where: { id: Number(params.deptId) } });
    return ok({ deleted: true });
  });
}
