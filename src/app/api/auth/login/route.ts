import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { ok, err } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return err("กรุณากรอกอีเมลและรหัสผ่าน");

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { companies: { select: { companyId: true } } },
    });

    if (!user || user.status === "INACTIVE")
      return err("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return err("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);

    const companies =
      user.role === "ADMIN"
        ? "all"
        : user.companies.map((c: { companyId: number }) => c.companyId).join(",");

    const token = await signToken({
      sub: String(user.id),
      email: user.email,
      role: user.role,
      name: user.name,
      companies,
    });

    const res = ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role, companies } });
    res.cookies.set("maka_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error(e);
    return err("เกิดข้อผิดพลาด", 500);
  }
}
