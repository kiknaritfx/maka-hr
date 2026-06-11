# MAKA HR Management System

ระบบจัดการทรัพยากรบุคคลสำหรับหลายบริษัท  
**Stack:** Next.js 14 App Router · Prisma ORM · Neon PostgreSQL · JWT

---

## 🚀 Setup Guide

### 1. Clone & Install
```bash
git clone <your-repo>
cd maka-hr
npm install
```

### 2. สร้าง Database บน Neon
1. ไปที่ [neon.tech](https://neon.tech) → New Project → ตั้งชื่อ `maka-hr`
2. Copy **Connection string** (pooled)

### 3. ตั้งค่า Environment Variables
```bash
cp .env.example .env
```
แก้ไข `.env`:
```env
DATABASE_URL="postgresql://..."          # จาก Neon
JWT_SECRET="run: openssl rand -base64 32"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Setup Database
```bash
npm run db:generate    # Generate Prisma Client
npm run db:push        # สร้าง tables ใน Neon
npm run db:seed        # เพิ่มข้อมูลตัวอย่าง
```

### 5. Run Development
```bash
npm run dev
# เปิด http://localhost:3000
```

---

## 🔑 Login Accounts (หลัง seed)

| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@maka.hr | Admin1234 | Admin | ทุกบริษัท |
| hr@alphagroup.co.th | Hr1234 | HR | AG, BR |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected pages
│   │   ├── dashboard/
│   │   ├── companies/
│   │   ├── employees/
│   │   ├── payroll/
│   │   ├── shifts/
│   │   ├── reports/
│   │   └── settings/
│   └── api/
│       ├── auth/              # login, logout, me
│       ├── companies/         # CRUD
│       ├── employees/         # CRUD
│       ├── payroll/           # Run, approve, pay
│       ├── shifts/            # CRUD
│       ├── reports/           # payroll_summary, headcount, detail
│       └── users/             # Admin only
├── components/
│   ├── layout/                # AuthProvider, Sidebar
│   └── ui/                    # Button, Card, StatusBadge
├── hooks/                     # useAuth, useApi
├── lib/                       # prisma, auth (JWT), tax, response
├── middleware.ts               # Route protection
└── types/                     # TypeScript interfaces
prisma/
├── schema.prisma              # Database schema
└── seed.ts                    # Initial data
```

---

## 🌐 Deploy บน Vercel

```bash
# 1. Push code ขึ้น GitHub
git add . && git commit -m "Initial MAKA HR" && git push

# 2. เปิด vercel.com → Import Repository → maka-hr

# 3. ตั้ง Environment Variables ใน Vercel:
#    DATABASE_URL  = Connection string จาก Neon
#    JWT_SECRET    = random secret

# 4. Deploy → Done! ✅
```

> **หมายเหตุ:** Neon รองรับ Vercel Edge Runtime โดยตรง ไม่ต้องตั้งค่าเพิ่ม

---

## 📡 API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → set cookie |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | Get current user |

### Companies
| Method | Path | Role |
|--------|------|------|
| GET | `/api/companies` | All |
| POST | `/api/companies` | Admin |
| GET | `/api/companies/[id]` | All (own) |
| PATCH | `/api/companies/[id]` | Admin, HR |
| DELETE | `/api/companies/[id]` | Admin |

### Employees
| Method | Path | Role |
|--------|------|------|
| GET | `/api/employees?companyId=1` | All |
| POST | `/api/employees` | Admin, HR |
| GET | `/api/employees/[id]` | All |
| PATCH | `/api/employees/[id]` | Admin, HR |
| DELETE | `/api/employees/[id]` | Admin |

### Payroll
| Method | Path | Role |
|--------|------|------|
| GET | `/api/payroll?companyId=1` | All |
| POST | `/api/payroll` | Admin, HR |
| POST | `/api/payroll/[id]/approve` | Admin |
| POST | `/api/payroll/[id]/pay` | Admin |

### Reports
| Method | Path | Params |
|--------|------|--------|
| GET | `/api/reports` | `type`, `companyId`, `month`, `year` |

**type options:** `payroll_summary` · `headcount` · `payroll_detail`

---

## 💡 Tax Calculation
ใช้สูตรกรมสรรพากร มาตรา 40(1) ใน `src/lib/tax.ts`
- หักค่าใช้จ่าย 50% (สูงสุด 100,000 บาท)
- ลดหย่อนส่วนตัว 60,000 บาท
- ปกส. สูงสุด 9,000 บาท/ปี
- คำนวณขั้นบันได → หาร 12

