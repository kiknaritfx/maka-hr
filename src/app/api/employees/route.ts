import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, canAccessCompany } from "@/lib/middleware";
import { ok, err, forbidden } from "@/lib/response";

export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    const where: Record<string, unknown> = {};
    if (companyId) {
      const cid = Number(companyId);
      if (!canAccessCompany(session, cid)) return forbidden();
      where.companyId = cid;
    } else {
      if (session.companies !== "all") {
        where.companyId = { in: session.companies.split(",").map((s: string) => Number(s)) };
      }
    }

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true, empCode: true, companyId: true,
        firstName: true, lastName: true, nickname: true,
        gender: true, phone: true, email: true,
        contractType: true, hireDate: true, status: true,
        baseSalary: true, profileColor: true, profileTextColor: true,
        departmentId: true, positionId: true, shiftId: true, managerId: true,
        department: { select: { id: true, name: true } },
        position:   { select: { id: true, name: true } },
        shift:      { select: { id: true, name: true, code: true, color: true, textColor: true } },
        manager:    { select: { id: true, firstName: true, lastName: true, empCode: true } },
        benefits:   { select: { id: true, name: true, amount: true } },
      },
      orderBy: { empCode: "asc" },
    });
    return ok(employees);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (_req, session) => {
    if (!["ADMIN","HR"].includes(session.role)) return forbidden();
    const data = await req.json();
    if (!canAccessCompany(session, data.companyId)) return forbidden();

    const { benefits, ...raw } = data;

    // whitelist เฉพาะ fields ที่มีใน schema ป้องกัน unknown field error
    const employee = await prisma.employee.create({
      data: {
        companyId:        Number(raw.companyId),
        empCode:          raw.empCode,
        firstName:        raw.firstName,
        lastName:         raw.lastName,
        firstNameEN:      raw.firstNameEN || undefined,
        lastNameEN:       raw.lastNameEN  || undefined,
        nickname:         raw.nickname    || undefined,
        gender:           raw.gender      || undefined,
        birthDate:        raw.birthDate   ? new Date(raw.birthDate) : undefined,
        nationalId:       raw.nationalId  || undefined,
        phone:            raw.phone,
        email:            raw.email,
        address:          raw.address     || undefined,
        contractType:     raw.contractType,
        hireDate:         new Date(raw.hireDate),
        status:           raw.status,
        baseSalary:       Number(raw.baseSalary),
        bank:             raw.bank        || undefined,
        bankAccount:      raw.bankAccount || undefined,
        profileColor:     raw.profileColor     || "#e6faf9",
        profileTextColor: raw.profileTextColor || "#007d75",
        canApproveLeave:  raw.canApproveLeave ?? false,
        departmentId:     raw.departmentId ? Number(raw.departmentId) : undefined,
        positionId:       raw.positionId   ? Number(raw.positionId)   : undefined,
        shiftId:          raw.shiftId      ? Number(raw.shiftId)      : undefined,
        managerId:        raw.managerId    ? Number(raw.managerId)    : undefined,
        benefits: benefits?.length ? { create: benefits } : undefined,
      },
      select: {
        id: true, empCode: true, companyId: true,
        firstName: true, lastName: true, nickname: true,
        gender: true, phone: true, email: true,
        contractType: true, hireDate: true, status: true,
        baseSalary: true, profileColor: true, profileTextColor: true,
        departmentId: true, positionId: true, shiftId: true,
        department: { select: { id: true, name: true } },
        position:   { select: { id: true, name: true } },
        shift:      { select: { id: true, name: true, code: true, color: true, textColor: true } },
        benefits:   { select: { id: true, name: true, amount: true } },
      },
    });
    return ok(employee, 201);
  });
}
