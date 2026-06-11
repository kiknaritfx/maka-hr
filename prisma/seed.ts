import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Companies
  const companies = await Promise.all([
    prisma.company.upsert({ where:{code:"AG"}, update:{}, create:{code:"AG",name:"Alpha Group Co., Ltd.",nameTH:"อัลฟ่า กรุ๊ป จำกัด",color:"#fff0f0",textColor:"#cc4444",payrollCycle:"สิ้นเดือน"} }),
    prisma.company.upsert({ where:{code:"BR"}, update:{}, create:{code:"BR",name:"Beta Retail (Thailand)",nameTH:"เบต้า รีเทล ไทยแลนด์",color:"#e6faf9",textColor:"#007d75",payrollCycle:"วันที่ 25"} }),
    prisma.company.upsert({ where:{code:"GS"}, update:{}, create:{code:"GS",name:"Gamma Services Ltd.",nameTH:"แกมมา เซอร์วิสเซส จำกัด",color:"#eeedfe",textColor:"#534ab7",payrollCycle:"สิ้นเดือน"} }),
  ]);

  const [ag, br] = companies;

  // Departments & Positions
  const agDepts = await Promise.all([
    prisma.department.upsert({ where:{companyId_name:{companyId:ag.id,name:"Operations"}}, update:{}, create:{companyId:ag.id,name:"Operations"} }),
    prisma.department.upsert({ where:{companyId_name:{companyId:ag.id,name:"Technology"}}, update:{}, create:{companyId:ag.id,name:"Technology"} }),
    prisma.department.upsert({ where:{companyId_name:{companyId:ag.id,name:"Human Resources"}}, update:{}, create:{companyId:ag.id,name:"Human Resources"} }),
  ]);
  const agPos = await Promise.all([
    prisma.position.upsert({ where:{companyId_name:{companyId:ag.id,name:"Senior Manager"}}, update:{}, create:{companyId:ag.id,name:"Senior Manager"} }),
    prisma.position.upsert({ where:{companyId_name:{companyId:ag.id,name:"Software Engineer"}}, update:{}, create:{companyId:ag.id,name:"Software Engineer"} }),
    prisma.position.upsert({ where:{companyId_name:{companyId:ag.id,name:"HR Specialist"}}, update:{}, create:{companyId:ag.id,name:"HR Specialist"} }),
  ]);

  // Shift
  const shift = await prisma.shift.upsert({
    where:{companyId_code:{companyId:ag.id,code:"DAY"}}, update:{},
    create:{companyId:ag.id,name:"เวลาทำงานปกติ",code:"DAY",startTime:"08:30",endTime:"17:30",breakMins:60,hoursPerDay:8,workDays:[1,2,3,4,5],shiftType:"STANDARD",color:"#e6faf9",textColor:"#007d75"},
  });

  // Employees
  const emp1 = await prisma.employee.upsert({
    where:{empCode:"AG-001"}, update:{},
    create:{
      empCode:"AG-001",companyId:ag.id,departmentId:agDepts[0].id,positionId:agPos[0].id,shiftId:shift.id,
      firstName:"สมชาย",lastName:"ใจดี",phone:"081-000-0001",email:"somchai@alphagroup.co.th",
      contractType:"MONTHLY",hireDate:new Date("2020-03-01"),status:"ACTIVE",baseSalary:95000,
      benefits:{create:[{name:"ค่าโทรศัพท์",amount:1500},{name:"ค่าน้ำมัน",amount:3000}]},
    },
  });
  await prisma.employee.upsert({
    where:{empCode:"AG-002"}, update:{},
    create:{
      empCode:"AG-002",companyId:ag.id,departmentId:agDepts[2].id,positionId:agPos[2].id,shiftId:shift.id,
      firstName:"มินตรา",lastName:"สุขใส",phone:"081-000-0004",email:"mintra@alphagroup.co.th",
      contractType:"MONTHLY",hireDate:new Date("2019-01-01"),status:"ACTIVE",baseSalary:42000,
    },
  });

  // Admin user
  const adminHash = await bcrypt.hash("Admin1234", 10);
  const admin = await prisma.user.upsert({
    where:{email:"admin@maka.hr"}, update:{},
    create:{email:"admin@maka.hr",password:adminHash,name:"MAKA Admin",role:"ADMIN"},
  });

  // HR user with company access
  const hrHash = await bcrypt.hash("Hr1234", 10);
  const hrUser = await prisma.user.upsert({
    where:{email:"hr@alphagroup.co.th"}, update:{},
    create:{
      email:"hr@alphagroup.co.th",password:hrHash,name:"มินตรา สุขใส",role:"HR",
      companies:{create:[{companyId:ag.id},{companyId:br.id}]},
    },
  });

  console.log("✅ Seed complete!");
  console.log("   Admin login: admin@maka.hr / Admin1234");
  console.log("   HR login:    hr@alphagroup.co.th / Hr1234");
}

main().catch(console.error).finally(() => prisma.$disconnect());
