import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    if (session!.role !== "ADMIN") return forbidden();
    const users = await prisma.user.findMany({
      include: { companies: { include: { company: { select:{id:true,code:true,name:true} } } } },
      orderBy: { id: "asc" },
    });
    return ok(users.map(u => ({ ...u, password: undefined })));
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    if (session!.role !== "ADMIN") return forbidden();
    const { email, password, name, role, companyIds } = await req.json();
    if (!email || !password || !name) return err("กรอกข้อมูลให้ครบ");
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(), password: hashed, name, role,
        companies: companyIds?.length ? { create: companyIds.map((id: number) => ({ companyId: id })) } : undefined,
      },
      include: { companies: true },
    });
    return ok({ ...user, password: undefined }, 201);
  });
}
