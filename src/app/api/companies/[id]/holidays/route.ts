import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session) return forbidden();
    const companyId = Number(params.id);
    if (!canAccessCompany(session, companyId)) return forbidden();
    const year = new URL(req.url).searchParams.get("year");
    const holidays = await prisma.holiday.findMany({
      where: { companyId, ...(year ? { year: Number(year) } : {}) },
      orderBy: { date: "asc" },
    });
    return ok(holidays);
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!session || !["ADMIN","HR"].includes(session.role)) return forbidden();
    const companyId = Number(params.id);
    if (!canAccessCompany(session, companyId)) return forbidden();
    const { name, date, isNational } = await req.json();
    if (!name?.trim() || !date) return err("กรุณาระบุชื่อวันหยุดและวันที่");
    const d = new Date(date);
    const holiday = await prisma.holiday.create({
      data: { companyId, name: name.trim(), date: d, year: d.getFullYear()+543, isNational: !!isNational },
    });
    return ok(holiday, 201);
  });
}
