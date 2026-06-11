import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden, notFound } from "@/lib/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session) return forbidden();
    const companyId = Number(params.id);
    if (!canAccessCompany(session, companyId)) return forbidden();
    const depts = await prisma.department.findMany({ where: { companyId }, orderBy: { name: "asc" } });
    return ok(depts);
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session || !["ADMIN","HR"].includes(session.role)) return forbidden();
    const companyId = Number(params.id);
    if (!canAccessCompany(session, companyId)) return forbidden();
    const { name } = await req.json();
    if (!name?.trim()) return err("กรุณาระบุชื่อแผนก");
    const existing = await prisma.department.findUnique({ where: { companyId_name: { companyId, name: name.trim() } } });
    if (existing) return err("มีแผนกนี้แล้ว");
    const dept = await prisma.department.create({ data: { companyId, name: name.trim() } });
    return ok(dept, 201);
  });
}
