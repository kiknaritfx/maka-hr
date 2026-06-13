import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, session: JWTPayload) => Promise<NextResponse>,
  requiredRoles?: string[]
): Promise<NextResponse> {
  // ใช้ session ที่ middleware.ts verify แล้วก่อน ไม่ต้อง verify ซ้ำ
  const sessionHeader = req.headers.get("x-session");
  let session: JWTPayload | null = null;

  if (sessionHeader) {
    try { session = JSON.parse(sessionHeader) as JWTPayload; } catch { session = null; }
  }

  // fallback: verify จาก token ถ้าไม่มี header (เช่น direct API call)
  if (!session) {
    const token = req.cookies.get("maka_token")?.value;
    if (!token) return NextResponse.json({ success:false, message:"Unauthorized" }, { status:401 });
    session = await verifyToken(token);
    if (!session) return NextResponse.json({ success:false, message:"Invalid token" }, { status:401 });
  }

  if (requiredRoles && !requiredRoles.includes(session.role)) {
    return NextResponse.json({ success:false, message:"Forbidden" }, { status:403 });
  }

  return handler(req, session);
}

export function canAccessCompany(session: { companies: string }, companyId: number): boolean {
  if (session.companies === "all") return true;
  return session.companies.split(",").map(Number).includes(companyId);
}
