import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden, notFound } from "@/lib/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    const emp = await prisma.employee.findUnique({
      where: { id: Number(params.id) },
      include: {
        department: true, position: true, shift: true,
        manager: { select: { id:true, firstName:true, lastName:true, empCode:true, position:{ select:{name:true} } } },
        subordinates: { select: { id:true, firstName:true, lastName:true, empCode:true } },
        benefits: true,
      },
    });
    if (!emp) return notFound();
    if (!canAccessCompany(session!, emp.companyId)) return forbidden();
    return ok(emp);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (!["ADMIN","HR"].includes(session!.role)) return forbidden();
    const emp = await prisma.employee.findUnique({ where: { id: Number(params.id) } });
    if (!emp) return notFound();
    if (!canAccessCompany(session!, emp.companyId)) return forbidden();

    const { benefits, ...data } = await req.json();
    const updated = await prisma.employee.update({
      where: { id: Number(params.id) },
      data: {
        ...data,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        baseSalary: data.baseSalary !== undefined ? Number(data.baseSalary) : undefined,
        benefits: benefits !== undefined ? {
          deleteMany: {},
          create: benefits,
        } : undefined,
      },
      include: { department:true, position:true, shift:true, benefits:true },
    });
    return ok(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async (_req, session) => {
    if (session!.role !== "ADMIN") return forbidden();
    await prisma.employee.delete({ where: { id: Number(params.id) } });
    return ok({ deleted: true });
  });
}
