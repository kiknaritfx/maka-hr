export interface Company {
  id: number; code: string; name: string; nameTH: string;
  color: string; textColor: string; payrollCycle: string;
  departments: Department[]; positions: Position[];
  _count?: { employees: number };
}
export interface Department { id: number; companyId: number; name: string; }
export interface Position   { id: number; companyId: number; name: string; }
export interface Employee {
  id: number; empCode: string; companyId: number;
  firstName: string; lastName: string; nickname?: string;
  phone: string; email: string; status: string;
  contractType: string; hireDate: string; baseSalary: number;
  department?: Department; position?: Position;
  benefits: { id:number; name:string; amount:number }[];
}
export interface Shift {
  id: number; companyId: number; name: string; code: string;
  startTime: string; endTime: string; breakMins: number;
  hoursPerDay: number; workDays: number[]; shiftType: string;
  color: string; textColor: string;
}
export interface PayrollRun {
  id: number; companyId: number; month: number; year: number;
  status: "DRAFT"|"REVIEW"|"APPROVED"|"PAID";
  totalGross: number; totalBenefits: number; totalBonus: number;
  totalTax: number; totalSso: number; totalNet: number;
  paidAt?: string; approvedAt?: string;
  company?: Company;
}
export interface SessionUser {
  sub: string; email: string; role: string; name: string; companies: string;
}
