import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session) return forbidden();
    const companyId = Number(params.id);
    if (!canAccessCompany(session, companyId)) return forbidden();
    const positions = await prisma.position.findMany({ where: { companyId }, orderBy: { name: "asc" } });
    return ok(positions);
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session || !["ADMIN","HR"].includes(session.role)) return forbidden();
    const companyId = Number(params.id);
    if (!canAccessCompany(session, companyId)) return forbidden();
    const { name } = await req.json();
    if (!name?.trim()) return err("กรุณาระบุชื่อตำแหน่ง");
    const existing = await prisma.position.findUnique({ where: { companyId_name: { companyId, name: name.trim() } } });
    if (existing) return err("มีตำแหน่งนี้แล้ว");
    const pos = await prisma.position.create({ data: { companyId, name: name.trim() } });
    return ok(pos, 201);
  });
}
