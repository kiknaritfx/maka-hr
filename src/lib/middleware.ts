import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, session: Awaited<ReturnType<typeof verifyToken>>) => Promise<NextResponse>,
  requiredRoles?: string[]
): Promise<NextResponse> {
  const token = req.cookies.get("maka_token")?.value;
  if (!token) return NextResponse.json({ success:false, message:"Unauthorized" }, { status:401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ success:false, message:"Invalid token" }, { status:401 });

  if (requiredRoles && !requiredRoles.includes(session.role)) {
    return NextResponse.json({ success:false, message:"Forbidden" }, { status:403 });
  }

  return handler(req, session);
}

export function canAccessCompany(session: { companies: string }, companyId: number): boolean {
  if (session.companies === "all") return true;
  return session.companies.split(",").map(Number).includes(companyId);
}
