import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, forbidden, notFound } from "@/lib/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    const run = await prisma.payrollRun.findUnique({
      where: { id: Number(params.id) },
      include: {
        company: { select: { id:true, code:true, name:true, color:true, textColor:true } },
        items: {
          include: {
            employee: {
              select: {
                id:true, empCode:true, firstName:true, lastName:true,
                contractType:true, baseSalary:true, profileColor:true, profileTextColor:true,
                department: { select: { name:true } },
                position:   { select: { name:true } },
              }
            }
          }
        }
      }
    });
    if (!run) return notFound();
    if (!canAccessCompany(session!, run.companyId)) return forbidden();
    return ok(run);
  });
}
