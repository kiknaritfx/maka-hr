import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware";
import { ok } from "@/lib/response";
export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, session) => ok(session));
}
