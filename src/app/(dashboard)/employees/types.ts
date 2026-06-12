export interface Company { id:number; code:string; name:string; nameTH:string; color:string; textColor:string; logoUrl?:string; _count?:{employees:number}; }
export interface Dept    { id:number; name:string; }
export interface Pos     { id:number; name:string; }
export interface Benefit { id?:number; name:string; amount:number; }
export interface Employee {
  id:number; empCode:string; companyId:number;
  firstName:string; lastName:string; firstNameEN?:string; lastNameEN?:string; nickname?:string;
  gender?:string; birthDate?:string; nationalId?:string; phone:string; email:string; address?:string;
  contractType:string; hireDate:string; status:string; baseSalary:number;
  bank?:string; bankAccount?:string; profileColor:string; profileTextColor:string;
  canApproveLeave:boolean; managerId?:number;
  department?:{id:number;name:string}; position?:{id:number;name:string};
  manager?:{id:number;firstName:string;lastName:string;empCode:string};
  subordinates?:{id:number;firstName:string;lastName:string;empCode:string}[];
  benefits:Benefit[];
  departmentId?:number; positionId?:number;
}
