"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Play, Download, Check, X, ArrowLeft, ChevronLeft, ChevronRight,
  Receipt, CreditCard, BarChart3, Users, Wallet, Send, Lock,
  AlertCircle, Info, Eye, TrendingUp, Minus, Plus, Clock
} from "lucide-react";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

const TEAL="#00B4A9"; const CORAL="#FF6B6B"; const YELLOW="#FFD93D";
const BG="#F4F6F8"; const INK="#1C2833"; const INK2="#5a6a78"; const INK3="#9aaab8"; const WHITE="#fff";
const F="'Prompt','Kanit',sans-serif";

const MONTHS=["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const TH_MONTHS_FULL=["","มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

const RUN_STATUS:Record<string,{bg:string;color:string;label:string}>={
  DRAFT:    {bg:"#f4f6f8",color:INK3,         label:"ยังไม่ Run"},
  REVIEW:   {bg:"#e6f1fb",color:"#185fa5",    label:"รอตรวจสอบ"},
  APPROVED: {bg:"#e6faf9",color:"#007d75",    label:"อนุมัติแล้ว"},
  PAID:     {bg:"#eeedfe",color:"#534ab7",    label:"จ่ายแล้ว"},
};

const fmt=(n:number|string|undefined)=>Number(n||0).toLocaleString();

// ── Tax/SSO calculation (client-side preview) ──
function calcWHT(monthlyBase:number, ssoMonthly=750):number{
  if(!monthlyBase||monthlyBase<=0) return 0;
  const annual=monthlyBase*12;
  const expense=Math.min(annual*0.5,100000);
  const personal=60000;
  const ssoDeduct=Math.min(ssoMonthly*12,9000);
  const net=annual-expense-personal-ssoDeduct;
  if(net<=0) return 0;
  const brackets=[150000,300000,500000,750000,1000000,2000000,5000000,Infinity];
  const rates=[0,0.05,0.10,0.15,0.20,0.25,0.30,0.35];
  let tax=0,prev=0;
  for(let i=0;i<brackets.length;i++){
    if(net<=prev) break;
    tax+=(Math.min(net,brackets[i])-prev)*rates[i];
    prev=brackets[i];
  }
  return Math.round(tax/12);
}
function calcSSO(base:number):number{ return Math.min(Math.floor(base*0.05),750); }

// ── Types ──
interface Company{id:number;code:string;name:string;nameTH:string;color:string;textColor:string;logoUrl?:string;payrollCycle?:string;_count?:{employees:number};}
interface Employee{id:number;empCode:string;firstName:string;lastName:string;contractType:string;baseSalary:number;profileColor:string;profileTextColor:string;department?:{name:string};position?:{name:string};benefits?:{id:number;name:string;amount:number}[];}
interface PayrollItem{id:number;employeeId:number;baseAmount:number;benefits:number;bonus:number;tax:number;sso:number;otherDeduct:number;netAmount:number;hoursWorked?:number;employee?:Employee;}
interface PayrollRun{id:number;companyId:number;month:number;year:number;status:string;totalGross:number;totalBenefits:number;totalBonus:number;totalTax:number;totalSso:number;totalNet:number;approvedAt?:string;paidAt?:string;company?:Company;items?:PayrollItem[];}

// ── Helpers ──
function initials(e:Employee){ return ((e.firstName||"")[0]||"")+((e.lastName||"")[0]||""); }
function Avatar({emp,size=32}:{emp:Employee;size?:number}){
  return <div style={{width:size,height:size,borderRadius:Math.round(size*.3),background:emp.profileColor,color:emp.profileTextColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*.36),fontWeight:500,flexShrink:0}}>{initials(emp)}</div>;
}
function StatusBadge({status}:{status:string}){
  const s=RUN_STATUS[status]||RUN_STATUS.DRAFT;
  return <span style={{background:s.bg,color:s.color,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{s.label}</span>;
}
function Btn({children,onClick,variant="ghost",disabled=false,style:sx={}}:{children:React.ReactNode;onClick?:()=>void;variant?:string;disabled?:boolean;style?:React.CSSProperties}){
  const v:Record<string,React.CSSProperties>={
    primary:{background:CORAL,color:WHITE,border:"none"},
    teal:{background:TEAL,color:WHITE,border:"none"},
    ghost:{background:WHITE,color:INK2,border:"1px solid #dde2e8"},
    danger:{background:"#fff0f0",color:"#cc4444",border:"1px solid #f5c4b3"},
  };
  return <button onClick={disabled?undefined:onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:500,cursor:disabled?"default":"pointer",border:"none",fontFamily:F,opacity:disabled?.45:1,...(v[variant]||v.ghost),...sx}}>{children}</button>;
}

// ════════════════════════════════════════
//  SCREEN 1: PAYROLL DASHBOARD
// ════════════════════════════════════════
function PayrollDashboard({onSelectCompany}:{onSelectCompany:(co:Company,month:number,year:number)=>void}){
  const today=new Date();
  const [companies,setCompanies]=useState<Company[]>([]);
  const [runs,setRuns]=useState<PayrollRun[]>([]);
  const [loading,setLoading]=useState(true);
  const [month,setMonth]=useState(today.getMonth()+1);
  const [year,setYear]=useState(today.getFullYear());

  useEffect(()=>{
    Promise.all([
      apiFetch<Company[]>("/api/companies"),
      apiFetch<PayrollRun[]>("/api/payroll"),
    ]).then(([cr,rr]:[any,any])=>{
      if(cr.data) setCompanies(cr.data);
      if(rr.data) setRuns(rr.data);
    }).finally(()=>setLoading(false));
  },[]);

  function getRunForMonth(companyId:number,m:number,y:number){
    return runs.find(r=>r.companyId===companyId&&r.month===m&&r.year===y);
  }
  function getStatus(companyId:number){ return getRunForMonth(companyId,month,year)?.status||"DRAFT"; }

  const paidRuns=runs.filter(r=>r.month===month&&r.year===year&&r.status==="PAID");
  const totalNet=paidRuns.reduce((s,r)=>s+Number(r.totalNet),0);
  const totalEmps=runs.filter(r=>r.month===month&&r.year===year).reduce((s,r)=>s+(r.company?._count?.employees||0),0);

  function navPrev(){ if(month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); }
  function navNext(){ if(month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); }

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:F}}>
      {/* Header */}
      <div style={{padding:"20px 28px 16px",borderBottom:"1px solid #eaecef",background:WHITE}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:20,fontWeight:500,color:INK}}>เงินเดือน</div>
            <div style={{fontSize:12,color:INK3,marginTop:2}}>จัดการและคำนวณเงินเดือนแยกตามบริษัท</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn variant="ghost"><Download size={14} strokeWidth={1.8}/> Export รวม</Btn>
          </div>
        </div>
      </div>

      <div style={{flex:1,overflow:"auto",padding:"20px 28px"}}>
        {/* Summary stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12,marginBottom:24}}>
          {([
            ["ยอดจ่ายสุทธิ",`฿${fmt(totalNet)}`,TEAL,"#e6faf9"],
            ["จ่ายแล้ว",`${paidRuns.length}/${companies.length} บริษัท`,CORAL,"#fff0f0"],
            ["พนักงานรวม",`${totalEmps} คน`,INK,"#f4f6f8"],
            ["รอบปัจจุบัน",`${TH_MONTHS_FULL[month]} ${year+543}`,INK2,"#fffbea"],
          ] as [string,string,string,string][]).map(([l,v,c,bg])=>(
            <div key={l} style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:"14px 16px"}}>
              <div style={{fontSize:11,color:INK3,marginBottom:6}}>{l}</div>
              <div style={{fontSize:18,fontWeight:500,color:c,lineHeight:1}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Period selector */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:500,color:INK}}>สถานะรอบเงินเดือน</div>
          <div style={{display:"flex",alignItems:"center",gap:8,background:WHITE,border:"1px solid #dde2e8",borderRadius:10,padding:"5px 12px"}}>
            <button onClick={navPrev} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",color:INK3}}><ChevronLeft size={15} strokeWidth={2}/></button>
            <span style={{fontSize:13,fontWeight:500,color:INK,minWidth:120,textAlign:"center"}}>{TH_MONTHS_FULL[month]} {year+543}</span>
            <button onClick={navNext} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",color:INK3}}><ChevronRight size={15} strokeWidth={2}/></button>
          </div>
        </div>

        {/* Company cards */}
        {loading?<div style={{textAlign:"center",padding:48,color:INK3,fontSize:13}}>กำลังโหลด...</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {companies.map(co=>{
              const run=getRunForMonth(co.id,month,year);
              const status=getStatus(co.id);
              const empCount=co._count?.employees||0;
              const steps=["DRAFT","REVIEW","APPROVED","PAID"];
              const stepIdx=Math.max(0,steps.indexOf(status));
              return(
                <div key={co.id} onClick={()=>onSelectCompany(co,month,year)}
                  style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:"16px 20px",cursor:"pointer",transition:"border-color .12s"}}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor=TEAL)}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor="#eaecef")}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                    {co.logoUrl
                      ?<img src={co.logoUrl} alt={co.code} style={{width:42,height:42,borderRadius:11,objectFit:"cover"}}/>
                      :<div style={{width:42,height:42,borderRadius:11,background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,flexShrink:0}}>{co.code}</div>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:500,fontSize:14,color:INK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.name}</div>
                      <div style={{fontSize:11,color:INK3}}>{empCount} คน · รอบ: {co.payrollCycle||"สิ้นเดือน"}</div>
                    </div>
                    <StatusBadge status={status}/>
                    {run&&<div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:CORAL}}>฿{fmt(Number(run.totalNet))}</div>
                      <div style={{fontSize:10,color:INK3}}>Net Pay</div>
                    </div>}
                    <ChevronRight size={15} strokeWidth={1.8} color={INK3}/>
                  </div>
                  {/* Progress steps */}
                  <div style={{display:"flex",alignItems:"center"}}>
                    {(["ยังไม่ Run","รอตรวจสอบ","อนุมัติแล้ว","จ่ายแล้ว"] as string[]).map((lbl,i)=>{
                      const done=stepIdx>i; const active=stepIdx===i;
                      return(
                        <div key={lbl} style={{display:"flex",alignItems:"center",flex:i<3?1:"none"}}>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                            <div style={{width:20,height:20,borderRadius:"50%",background:done||active?TEAL:"#eaecef",display:"flex",alignItems:"center",justifyContent:"center",border:active?"2.5px solid #00D4C8":"none"}}>
                              {done?<Check size={10} strokeWidth={2.5} color={WHITE}/>
                               :active?<div style={{width:7,height:7,borderRadius:"50%",background:WHITE}}/>
                               :<div style={{width:7,height:7,borderRadius:"50%",background:INK3}}/>}
                            </div>
                            <span style={{fontSize:9,color:done||active?TEAL:INK3,whiteSpace:"nowrap",fontWeight:active?500:400}}>{lbl}</span>
                          </div>
                          {i<3&&<div style={{flex:1,height:2,background:done?TEAL:"#eaecef",margin:"0 4px",marginBottom:14,borderRadius:1}}/>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  SCREEN 2: COMPANY PAYROLL HISTORY
// ════════════════════════════════════════
function PayrollHistory({company,initMonth,initYear,onBack,onRunNew,onViewRun}:{company:Company;initMonth:number;initYear:number;onBack:()=>void;onRunNew:(m:number,y:number)=>void;onViewRun:(r:PayrollRun)=>void}){
  const [runs,setRuns]=useState<PayrollRun[]>([]);
  const [loading,setLoading]=useState(true);
  const [month,setMonth]=useState(initMonth);
  const [year,setYear]=useState(initYear);

  const loadRuns=useCallback(()=>{
    setLoading(true);
    apiFetch<PayrollRun[]>(`/api/payroll?companyId=${company.id}`).then((r:any)=>{
      if(r.data) setRuns(r.data);
    }).finally(()=>setLoading(false));
  },[company.id]);

  useEffect(()=>{ loadRuns(); },[loadRuns]);

  const curRun=runs.find(r=>r.month===month&&r.year===year);
  const allMonths=Array.from(new Set(runs.map(r=>`${r.year}-${r.month}`))).sort((a,b)=>b.localeCompare(a));

  function navPrev(){ if(month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); }
  function navNext(){ if(month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); }

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:F}}>
      <div style={{padding:"14px 28px 12px",borderBottom:"1px solid #eaecef",background:WHITE}}>
        <button onClick={onBack} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:TEAL,background:"transparent",border:"none",cursor:"pointer",padding:"0 0 8px",fontFamily:F}}>
          <ArrowLeft size={13} strokeWidth={2}/> เงินเดือน
        </button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:0}}>
          {company.logoUrl
            ?<img src={company.logoUrl} alt={company.code} style={{width:44,height:44,borderRadius:12,objectFit:"cover"}}/>
            :<div style={{width:44,height:44,borderRadius:12,background:company.color,color:company.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:500,flexShrink:0}}>{company.code}</div>
          }
          <div style={{flex:1}}>
            <div style={{fontSize:17,fontWeight:500,color:INK}}>{company.name}</div>
            <div style={{fontSize:12,color:INK3,marginTop:1}}>{runs.length} รอบที่ผ่านมา · รอบจ่าย: {company.payrollCycle||"สิ้นเดือน"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,background:WHITE,border:"1px solid #dde2e8",borderRadius:10,padding:"5px 12px"}}>
            <button onClick={navPrev} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",color:INK3}}><ChevronLeft size={14} strokeWidth={2}/></button>
            <span style={{fontSize:13,fontWeight:500,color:INK,minWidth:110,textAlign:"center"}}>{TH_MONTHS_FULL[month]} {year+543}</span>
            <button onClick={navNext} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",color:INK3}}><ChevronRight size={14} strokeWidth={2}/></button>
          </div>
          {!curRun
            ?<Btn variant="primary" onClick={()=>onRunNew(month,year)}><Play size={13} strokeWidth={2}/> Run Payroll</Btn>
            :<Btn variant="ghost" onClick={()=>onViewRun(curRun)}><Eye size={13} strokeWidth={1.8}/> ดูรอบนี้</Btn>
          }
        </div>
      </div>

      <div style={{flex:1,overflow:"auto",padding:"16px 28px"}}>
        {/* Current month status */}
        {curRun?(
          <div onClick={()=>onViewRun(curRun)} style={{background:WHITE,borderRadius:14,border:`2px solid ${TEAL}`,padding:"16px 20px",marginBottom:20,cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <span style={{fontSize:14,fontWeight:500,color:INK}}>รอบ {TH_MONTHS_FULL[month]} {year+543}</span>
              <StatusBadge status={curRun.status}/>
              {curRun.paidAt&&<span style={{fontSize:11,color:INK3}}>จ่ายวันที่ {new Date(curRun.paidAt).toLocaleDateString("th-TH")}</span>}
            </div>
            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              {([["Gross",Number(curRun.totalGross),INK],["+ สวัสดิการ",Number(curRun.totalBenefits),TEAL],["+ โบนัส",Number(curRun.totalBonus),"#8a6d00"],["- ภาษี+ปกส.",Number(curRun.totalTax)+Number(curRun.totalSso),"#cc4444"],["= Net Pay",Number(curRun.totalNet),CORAL]] as [string,number,string][]).map(([l,v,c])=>(
                <div key={l}><div style={{fontSize:13,fontWeight:500,color:c}}>฿{fmt(v)}</div><div style={{fontSize:10,color:INK3}}>{l}</div></div>
              ))}
            </div>
          </div>
        ):(
          <div style={{background:"#fffbea",border:"1px solid #ffe9a0",borderRadius:14,padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
            <Info size={16} strokeWidth={2} color="#8a6d00"/>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:"#8a6d00"}}>ยังไม่มีรอบเงินเดือน {TH_MONTHS_FULL[month]} {year+543}</div>
              <div style={{fontSize:12,color:"#a07830",marginTop:2}}>กด Run Payroll เพื่อเริ่มคำนวณเงินเดือนรอบนี้</div>
            </div>
            <Btn variant="primary" onClick={()=>onRunNew(month,year)} style={{marginLeft:"auto"}}><Play size={13} strokeWidth={2}/> Run Payroll</Btn>
          </div>
        )}

        {/* History list */}
        <div style={{fontSize:13,fontWeight:500,color:INK,marginBottom:12}}>ประวัติรอบเงินเดือน</div>
        {loading?<div style={{textAlign:"center",padding:32,color:INK3}}>กำลังโหลด...</div>
        :runs.length===0?<div style={{textAlign:"center",padding:40,color:INK3,fontSize:13}}>ยังไม่มีรอบเงินเดือน</div>
        :(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {runs.map(run=>(
              <div key={run.id} onClick={()=>onViewRun(run)}
                style={{background:WHITE,borderRadius:12,border:"1px solid #eaecef",padding:"13px 16px",cursor:"pointer"}}
                onMouseEnter={e=>(e.currentTarget.style.borderColor=TEAL)}
                onMouseLeave={e=>(e.currentTarget.style.borderColor="#eaecef")}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <span style={{fontSize:13,fontWeight:500,color:INK}}>รอบ {MONTHS[run.month]} {run.year+543}</span>
                      <StatusBadge status={run.status}/>
                    </div>
                    <div style={{fontSize:11,color:INK3}}>{run.paidAt?`จ่ายวันที่ ${new Date(run.paidAt).toLocaleDateString("th-TH")}`:"ยังไม่ได้จ่าย"}</div>
                  </div>
                  <div style={{display:"flex",gap:16,flexShrink:0}}>
                    {([["Gross",Number(run.totalGross),INK],["Net Pay",Number(run.totalNet),CORAL]] as [string,number,string][]).map(([l,v,c])=>(
                      <div key={l} style={{textAlign:"right"}}>
                        <div style={{fontSize:12,fontWeight:500,color:c}}>฿{fmt(v)}</div>
                        <div style={{fontSize:10,color:INK3}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <ChevronRight size={14} strokeWidth={1.8} color={INK3}/>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  SCREEN 3: RUN PAYROLL WIZARD
// ════════════════════════════════════════
function RunPayrollPage({company,month,year,onBack,onComplete}:{company:Company;month:number;year:number;onBack:()=>void;onComplete:(run:PayrollRun)=>void}){
  const [step,setStep]=useState(1);
  const [emps,setEmps]=useState<Employee[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState<string|null>(null);
  const [ov,setOv]=useState<Record<number,{benefits:string;bonus:string;tax:string;sso:string;otherDeduct:string;hoursWorked:string}>>({});

  useEffect(()=>{
    apiFetch<Employee[]>(`/api/employees?companyId=${company.id}`).then((r:any)=>{
      if(r.data){
        const data=r.data as Employee[];
        setEmps(data);
        const init:typeof ov={};
        data.forEach((e:Employee)=>{
          const isPartTime=e.contractType==="PARTTIME";
          const base=Number(e.baseSalary);
          const sso=isPartTime?0:calcSSO(base);
          const tax=isPartTime?0:calcWHT(base,sso);
          const ben=e.benefits?.reduce((s,b)=>s+Number(b.amount),0)||0;
          init[e.id]={benefits:String(ben),bonus:"0",tax:String(tax),sso:String(sso),otherDeduct:"0",hoursWorked:"0"};
        });
        setOv(init);
      }
    }).finally(()=>setLoading(false));
  },[company.id]);

  function setField(id:number,field:string,val:string){ setOv(prev=>({...prev,[id]:{...prev[id],[field]:val}})); }

  function rowGross(e:Employee){
    const isPartTime=e.contractType==="PARTTIME";
    if(isPartTime) return Number(e.baseSalary)*(parseInt(ov[e.id]?.hoursWorked||"0")||0);
    return Number(e.baseSalary);
  }
  function rowNet(e:Employee){
    const g=rowGross(e);
    return g+(parseInt(ov[e.id]?.benefits)||0)+(parseInt(ov[e.id]?.bonus)||0)
      -(parseInt(ov[e.id]?.tax)||0)-(parseInt(ov[e.id]?.sso)||0)-(parseInt(ov[e.id]?.otherDeduct)||0);
  }

  const totalGross=emps.reduce((s,e)=>s+rowGross(e),0);
  const totalBen=emps.reduce((s,e)=>s+(parseInt(ov[e.id]?.benefits)||0),0);
  const totalBonus=emps.reduce((s,e)=>s+(parseInt(ov[e.id]?.bonus)||0),0);
  const totalTax=emps.reduce((s,e)=>s+(parseInt(ov[e.id]?.tax)||0),0);
  const totalSso=emps.reduce((s,e)=>s+(parseInt(ov[e.id]?.sso)||0),0);
  const totalOther=emps.reduce((s,e)=>s+(parseInt(ov[e.id]?.otherDeduct)||0),0);
  const totalNet=emps.reduce((s,e)=>s+rowNet(e),0);

  async function submit(){
    setSaving(true); setSaveError(null);
    const overrides:Record<number,unknown>={};
    emps.forEach(e=>{ overrides[e.id]={...ov[e.id]}; });
    const r:any=await apiFetch("/api/payroll",{method:"POST",body:JSON.stringify({companyId:company.id,month,year,overrides})});
    if(r.data){ onComplete(r.data as PayrollRun); }
    else { setSaveError(r.error||"เกิดข้อผิดพลาด"); setSaving(false); }
  }

  function numInput(id:number,field:string,color=INK,prefix=""){
    return(
      <div style={{display:"flex",alignItems:"center",gap:3}}>
        {prefix&&<span style={{fontSize:11,color,flexShrink:0}}>{prefix}</span>}
        <input type="number" value={ov[id]?.[field as keyof typeof ov[number]]||""}
          onChange={ev=>setField(id,field,ev.target.value)}
          style={{width:76,fontSize:12,padding:"4px 6px",borderRadius:7,border:"1px solid #dde2e8",fontFamily:F,color:INK,background:WHITE,outline:"none",textAlign:"right"}}
          onFocus={e=>(e.target.style.borderColor=TEAL)}
          onBlur={e=>(e.target.style.borderColor="#dde2e8")}/>
      </div>
    );
  }

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:F}}>
      <div style={{padding:"14px 28px 12px",borderBottom:"1px solid #eaecef",background:WHITE}}>
        <button onClick={onBack} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:TEAL,background:"transparent",border:"none",cursor:"pointer",padding:"0 0 8px",fontFamily:F}}>
          <ArrowLeft size={13} strokeWidth={2}/> {company.name}
        </button>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontSize:17,fontWeight:500,color:INK}}>Run Payroll — {TH_MONTHS_FULL[month]} {year+543}</div>
            <div style={{fontSize:12,color:INK3,marginTop:2}}>{company.name} · {emps.length} คน · รอบ: {company.payrollCycle||"สิ้นเดือน"}</div>
          </div>
          {/* Step indicator */}
          <div style={{display:"flex",alignItems:"center",gap:0}}>
            {(["ตรวจสอบข้อมูล","ยืนยันรอบ"] as string[]).map((lbl,i)=>{
              const done=step>i+1; const active=step===i+1;
              return(
                <div key={lbl} style={{display:"flex",alignItems:"center",flex:i<1?1:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,background:done||active?TEAL:"#eaecef",color:done||active?WHITE:INK3,flexShrink:0}}>{done?<Check size={11} strokeWidth={2.5}/>:i+1}</div>
                    <span style={{fontSize:12,fontWeight:active?500:400,color:active?INK:done?TEAL:INK3,whiteSpace:"nowrap"}}>{lbl}</span>
                  </div>
                  {i<1&&<div style={{width:40,height:1,background:done?"#9FE1CB":"#eaecef",margin:"0 10px"}}/>}
                </div>
              );
            })}
          </div>
        </div>
        {/* Live totals bar */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {([["Gross",totalGross,INK],["+ สวัสดิการ",totalBen,TEAL],["+ โบนัส",totalBonus,"#8a6d00"],["- ภาษี",totalTax,"#cc4444"],["- ปกส.",totalSso,"#854f0b"],["- หักอื่นๆ",totalOther,"#534ab7"],["= Net Pay",totalNet,CORAL]] as [string,number,string][]).map(([l,v,c])=>(
            <div key={l} style={{background:BG,borderRadius:9,padding:"6px 10px",textAlign:"center",minWidth:70}}>
              <div style={{fontSize:12,fontWeight:500,color:c,lineHeight:1}}>฿{fmt(v)}</div>
              <div style={{fontSize:9,color:INK3,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflow:"auto",padding:"16px 28px"}}>
        {loading?<div style={{textAlign:"center",padding:48,color:INK3}}>กำลังโหลดข้อมูลพนักงาน...</div>
        :step===1?(
          <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:BG}}>
                    <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,color:INK3,fontWeight:500,minWidth:180,position:"sticky",left:0,background:BG,zIndex:1}}>พนักงาน</th>
                    <th style={{padding:"10px 12px",textAlign:"right",fontSize:11,color:INK3,fontWeight:500,minWidth:110}}>เงินเดือนฐาน</th>
                    <th style={{padding:"10px 12px",textAlign:"center",fontSize:11,color:TEAL,fontWeight:500,minWidth:100}}>สวัสดิการ ✎</th>
                    <th style={{padding:"10px 12px",textAlign:"center",fontSize:11,color:"#8a6d00",fontWeight:500,minWidth:100}}>โบนัส ✎</th>
                    <th style={{padding:"10px 12px",textAlign:"center",fontSize:11,color:"#cc4444",fontWeight:500,minWidth:110}}>ภาษีหัก ณ ที่จ่าย ✎</th>
                    <th style={{padding:"10px 12px",textAlign:"center",fontSize:11,color:"#854f0b",fontWeight:500,minWidth:100}}>ประกันสังคม ✎</th>
                    <th style={{padding:"10px 12px",textAlign:"center",fontSize:11,color:"#534ab7",fontWeight:500,minWidth:100}}>หักอื่นๆ ✎</th>
                    <th style={{padding:"10px 12px",textAlign:"right",fontSize:11,color:CORAL,fontWeight:500,minWidth:110}}>Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {emps.map((e,ei)=>{
                    const isPartTime=e.contractType==="PARTTIME";
                    const gross=rowGross(e);
                    const net=rowNet(e);
                    return(
                      <tr key={e.id} style={{borderTop:"1px solid #f0f2f5",background:isPartTime?"#fffdf5":ei%2===0?WHITE:"#fafbfc"}}>
                        <td style={{padding:"11px 14px",position:"sticky",left:0,background:isPartTime?"#fffdf5":ei%2===0?WHITE:"#fafbfc",zIndex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <Avatar emp={e} size={30}/>
                            <div style={{minWidth:0}}>
                              <div style={{fontWeight:500,color:INK,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{e.firstName} {e.lastName}</div>
                              <div style={{display:"flex",alignItems:"center",gap:4}}>
                                <span style={{fontSize:10,color:INK3}}>{e.empCode}</span>
                                {isPartTime&&<span style={{fontSize:9,background:"#eeedfe",color:"#534ab7",borderRadius:20,padding:"1px 6px",fontWeight:500}}>พาร์ทไทม์</span>}
                              </div>
                              <div style={{fontSize:10,color:INK3,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{e.position?.name} · {e.department?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{padding:"11px 12px",textAlign:"right"}}>
                          {isPartTime?(
                            <div>
                              <div style={{fontSize:10,color:INK3,marginBottom:3}}>฿{fmt(Number(e.baseSalary))}/ชม. ×</div>
                              <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}>
                                <input type="number" value={ov[e.id]?.hoursWorked||""}
                                  onChange={ev=>setField(e.id,"hoursWorked",ev.target.value)}
                                  style={{width:56,fontSize:12,padding:"4px 6px",borderRadius:7,border:"1px solid #534ab7",fontFamily:F,color:INK,background:"#f5f3ff",outline:"none",textAlign:"right"}}/>
                                <span style={{fontSize:10,color:INK3}}>ชม.</span>
                              </div>
                              <div style={{fontSize:11,fontWeight:500,color:INK,marginTop:3}}>= ฿{fmt(gross)}</div>
                            </div>
                          ):(
                            <span style={{fontWeight:500,color:INK}}>฿{fmt(gross)}</span>
                          )}
                        </td>
                        <td style={{padding:"11px 12px",textAlign:"center"}}>{numInput(e.id,"benefits",TEAL,"+฿")}</td>
                        <td style={{padding:"11px 12px",textAlign:"center"}}>{numInput(e.id,"bonus","#8a6d00","+฿")}</td>
                        <td style={{padding:"11px 12px",textAlign:"center"}}>{numInput(e.id,"tax","#cc4444","-฿")}</td>
                        <td style={{padding:"11px 12px",textAlign:"center"}}>{numInput(e.id,"sso","#854f0b","-฿")}</td>
                        <td style={{padding:"11px 12px",textAlign:"center"}}>{numInput(e.id,"otherDeduct","#534ab7","-฿")}</td>
                        <td style={{padding:"11px 12px",textAlign:"right"}}>
                          <span style={{fontWeight:500,color:net<0?"#cc4444":CORAL,fontSize:13}}>฿{fmt(net)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{borderTop:"2px solid #eaecef",background:BG}}>
                    <td style={{padding:"10px 14px",fontWeight:500,fontSize:12,color:INK,position:"sticky",left:0,background:BG}}>รวม ({emps.length} คน)</td>
                    <td style={{padding:"10px 12px",textAlign:"right",fontWeight:500,color:INK}}>฿{fmt(totalGross)}</td>
                    <td style={{padding:"10px 12px",textAlign:"center",fontWeight:500,color:TEAL}}>+฿{fmt(totalBen)}</td>
                    <td style={{padding:"10px 12px",textAlign:"center",fontWeight:500,color:"#8a6d00"}}>+฿{fmt(totalBonus)}</td>
                    <td style={{padding:"10px 12px",textAlign:"center",fontWeight:500,color:"#cc4444"}}>-฿{fmt(totalTax)}</td>
                    <td style={{padding:"10px 12px",textAlign:"center",fontWeight:500,color:"#854f0b"}}>-฿{fmt(totalSso)}</td>
                    <td style={{padding:"10px 12px",textAlign:"center",fontWeight:500,color:"#534ab7"}}>-฿{fmt(totalOther)}</td>
                    <td style={{padding:"10px 12px",textAlign:"right",fontWeight:500,color:CORAL,fontSize:13}}>฿{fmt(totalNet)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ):(
          <div style={{maxWidth:560}}>
            <div style={{background:"#e6faf9",border:"1px solid #9FE1CB",borderRadius:14,padding:20,marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:500,color:"#007d75",marginBottom:14}}>สรุปรอบเงินเดือน {TH_MONTHS_FULL[month]} {year+543}</div>
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {([
                  ["บริษัท",company.name,"#007d75"],["จำนวนพนักงาน",`${emps.length} คน`,"#007d75"],["รอบจ่าย",company.payrollCycle||"สิ้นเดือน","#007d75"],
                  null,
                  ["เงินเดือนฐาน (Gross)",`฿${fmt(totalGross)}`,INK],["+ สวัสดิการ",`+฿${fmt(totalBen)}`,TEAL],["+ โบนัส",`+฿${fmt(totalBonus)}`,"#8a6d00"],
                  null,
                  ["- ภาษีหัก ณ ที่จ่าย",`-฿${fmt(totalTax)}`,"#cc4444"],["- ประกันสังคม",`-฿${fmt(totalSso)}`,"#854f0b"],["- หักอื่นๆ",`-฿${fmt(totalOther)}`,"#534ab7"],
                ] as ([string,string,string]|null)[]).map((row,i)=>row===null
                  ?<div key={i} style={{height:1,background:"#9FE1CB",margin:"8px 0"}}/>
                  :<div key={row[0]} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13}}>
                    <span style={{color:"#007d75"}}>{row[0]}</span>
                    <span style={{fontWeight:500,color:row[2]}}>{row[1]}</span>
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:500,marginTop:12,padding:"12px 0 0",borderTop:"2px solid #9FE1CB"}}>
                  <span style={{color:"#007d75"}}>ยอดจ่ายสุทธิ (Net Pay)</span>
                  <span style={{color:TEAL}}>฿{fmt(totalNet)}</span>
                </div>
              </div>
            </div>
            {saveError&&<div style={{background:"#fff0f0",border:"1px solid #f5c4b3",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",gap:7,fontSize:12,color:"#cc4444"}}><AlertCircle size={14} strokeWidth={2}/>{saveError}</div>}
            <div style={{background:"#fffbea",border:"1px solid #ffe9a0",borderRadius:10,padding:"10px 14px",display:"flex",gap:8}}>
              <Info size={14} strokeWidth={2} color="#8a6d00" style={{flexShrink:0,marginTop:1}}/>
              <div style={{fontSize:12,color:"#8a6d00"}}>หลัง Run แล้ว HR สามารถกลับมาแก้ไขได้ก่อนอนุมัติ ระบบจะสร้าง Payslip อัตโนมัติเมื่ออนุมัติเสร็จ</div>
            </div>
          </div>
        )}
      </div>

      <div style={{padding:"12px 28px",borderTop:"1px solid #eaecef",background:WHITE,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:12,color:INK3}}>ขั้นตอนที่ {step} จาก 2</div>
        <div style={{display:"flex",gap:8}}>
          {step>1&&<Btn variant="ghost" onClick={()=>setStep(1)}><ChevronLeft size={13} strokeWidth={2}/> แก้ไขข้อมูล</Btn>}
          <Btn variant="ghost" onClick={onBack}>ยกเลิก</Btn>
          {step<2
            ?<Btn variant="teal" onClick={()=>setStep(2)}>ตรวจสอบสรุป <ChevronRight size={13} strokeWidth={2}/></Btn>
            :<Btn variant="primary" onClick={submit} disabled={saving||emps.length===0}><Play size={13} strokeWidth={2}/> {saving?"กำลัง Run...":"ยืนยัน Run Payroll"}</Btn>
          }
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  SCREEN 4: PAYROLL DETAIL
// ════════════════════════════════════════
function PayrollDetail({run:initRun,company,onBack}:{run:PayrollRun;company:Company;onBack:()=>void}){
  const {user}=useAuth();
  const [run,setRun]=useState(initRun);
  const [items,setItems]=useState<PayrollItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<"summary"|"detail"|"payslip"|"bank">("summary");
  const [selItem,setSelItem]=useState<PayrollItem|null>(null);
  const [actioning,setActioning]=useState(false);

  useEffect(()=>{
    apiFetch<{items:PayrollItem[]}>(`/api/payroll/${run.id}`).then((r:any)=>{
      if(r.data?.items) setItems(r.data.items);
    }).finally(()=>setLoading(false));
  },[run.id]);

  async function approve(){
    setActioning(true);
    const r:any=await apiFetch(`/api/payroll/${run.id}/approve`,{method:"POST"});
    if(r.data) setRun(r.data as PayrollRun);
    setActioning(false);
  }
  async function markPaid(){
    setActioning(true);
    const r:any=await apiFetch(`/api/payroll/${run.id}/pay`,{method:"POST"});
    if(r.data) setRun(r.data as PayrollRun);
    setActioning(false);
  }

  const canApprove=run.status==="REVIEW"&&user?.role==="ADMIN";
  const canPay=run.status==="APPROVED"&&user?.role==="ADMIN";
  const isPaid=run.status==="PAID";

  const TABS=[
    {key:"summary",Icon:BarChart3,label:"สรุปรอบ"},
    {key:"detail", Icon:Users,   label:"รายคน"},
    {key:"payslip",Icon:Receipt, label:"Payslip"},
    {key:"bank",   Icon:CreditCard,label:"Bank File"},
  ];

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:F}}>
      <div style={{padding:"12px 28px 0",borderBottom:"1px solid #eaecef",background:WHITE}}>
        <button onClick={onBack} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:TEAL,background:"transparent",border:"none",cursor:"pointer",padding:"0 0 8px",fontFamily:F}}>
          <ArrowLeft size={13} strokeWidth={2}/> {company.name}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:17,fontWeight:500,color:INK}}>รอบ {MONTHS[run.month]} {run.year+543}</span>
              <StatusBadge status={run.status}/>
              {run.paidAt&&<span style={{fontSize:11,color:INK3}}>จ่ายวันที่ {new Date(run.paidAt).toLocaleDateString("th-TH")}</span>}
            </div>
            <div style={{fontSize:12,color:INK3,marginTop:2}}>{company.name}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn variant="ghost"><Download size={13} strokeWidth={1.8}/> Export</Btn>
            {canApprove&&<Btn variant="teal" onClick={approve} disabled={actioning}><Check size={13} strokeWidth={2.5}/> {actioning?"กำลังอนุมัติ...":"อนุมัติ Payroll"}</Btn>}
            {canPay&&<Btn variant="primary" onClick={markPaid} disabled={actioning}><Send size={13} strokeWidth={2}/> {actioning?"กำลังบันทึก...":"ยืนยันการจ่าย"}</Btn>}
            {isPaid&&<Btn variant="ghost" style={{color:TEAL,borderColor:"#9FE1CB"}}><Lock size={13} strokeWidth={1.8}/> Locked</Btn>}
          </div>
        </div>
        {/* Mini totals */}
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {([["Gross",Number(run.totalGross),INK],["+ สวัสดิการ",Number(run.totalBenefits),TEAL],["+ โบนัส",Number(run.totalBonus),"#8a6d00"],["- ภาษี+ปกส.",Number(run.totalTax)+Number(run.totalSso),"#cc4444"],["= Net Pay",Number(run.totalNet),CORAL]] as [string,number,string][]).map(([l,v,c])=>(
            <div key={l} style={{background:BG,borderRadius:9,padding:"6px 12px",display:"flex",alignItems:"center",gap:7}}>
              <div><div style={{fontSize:12,fontWeight:500,color:c}}>฿{fmt(v)}</div><div style={{fontSize:10,color:INK3}}>{l}</div></div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",overflowX:"auto"}}>
          {TABS.map(({key,Icon:Ic,label})=>(
            <div key={key} onClick={()=>{setTab(key as typeof tab);setSelItem(null);}}
              style={{padding:"9px 16px",fontSize:13,color:tab===key?TEAL:INK3,fontWeight:tab===key?500:400,borderBottom:tab===key?`2.5px solid ${TEAL}`:"2.5px solid transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
              <Ic size={13} strokeWidth={1.8}/>{label}
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflow:"auto",padding:"18px 28px"}}>
        {/* Summary tab */}
        {tab==="summary"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:800}}>
            <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:18}}>
              <div style={{fontSize:14,fontWeight:500,color:INK,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><Wallet size={15} strokeWidth={1.8} color={INK3}/> รายรับพนักงาน</div>
              {([["เงินเดือนฐาน",Number(run.totalGross),INK],["สวัสดิการรวม",Number(run.totalBenefits),TEAL],["โบนัส",Number(run.totalBonus),"#8a6d00"]] as [string,number,string][]).map(([l,v,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f2f5",fontSize:13}}>
                  <span style={{color:INK2}}>{l}</span><span style={{fontWeight:500,color:c}}>฿{fmt(v)}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 0",fontSize:14,fontWeight:500}}>
                <span style={{color:INK}}>รวมรับ (Gross)</span><span style={{color:TEAL}}>฿{fmt(Number(run.totalGross)+Number(run.totalBenefits)+Number(run.totalBonus))}</span>
              </div>
            </div>
            <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:18}}>
              <div style={{fontSize:14,fontWeight:500,color:INK,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><Receipt size={15} strokeWidth={1.8} color={INK3}/> รายการหัก</div>
              {([["ภาษีเงินได้หัก ณ ที่จ่าย",Number(run.totalTax),"#cc4444"],["ประกันสังคม",Number(run.totalSso),"#854f0b"]] as [string,number,string][]).map(([l,v,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f2f5",fontSize:13}}>
                  <span style={{color:INK2}}>{l}</span><span style={{fontWeight:500,color:c}}>-฿{fmt(v)}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 0",fontSize:14,fontWeight:500}}>
                <span style={{color:INK}}>หักรวม</span><span style={{color:"#cc4444"}}>-฿{fmt(Number(run.totalTax)+Number(run.totalSso))}</span>
              </div>
            </div>
            <div style={{gridColumn:"1/-1",background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:18}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontSize:16,fontWeight:500,color:INK}}>ยอดจ่ายสุทธิ (Net Pay)</div>
                <div style={{fontSize:24,fontWeight:500,color:CORAL}}>฿{fmt(Number(run.totalNet))}</div>
              </div>
              <div style={{marginTop:12,background:BG,borderRadius:10,padding:"12px 14px",display:"flex",gap:16,justifyContent:"space-around"}}>
                {([["รอบ",`${MONTHS[run.month]} ${run.year+543}`],["สถานะ",RUN_STATUS[run.status]?.label||run.status],["อนุมัติเมื่อ",run.approvedAt?new Date(run.approvedAt).toLocaleDateString("th-TH"):"ยังไม่อนุมัติ"]] as [string,string][]).map(([l,v])=>(
                  <div key={l} style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:500,color:INK}}>{v}</div><div style={{fontSize:11,color:INK3,marginTop:2}}>{l}</div></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detail tab */}
        {tab==="detail"&&(
          loading?<div style={{textAlign:"center",padding:32,color:INK3}}>กำลังโหลด...</div>
          :selItem?(
            <div style={{maxWidth:520}}>
              <button onClick={()=>setSelItem(null)} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:TEAL,background:"transparent",border:"none",cursor:"pointer",padding:"0 0 14px",fontFamily:F}}>
                <ArrowLeft size={13} strokeWidth={2}/> รายการพนักงาน
              </button>
              {selItem.employee&&(
                <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:18,marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,paddingBottom:14,borderBottom:"1px solid #f0f2f5",marginBottom:14}}>
                    <Avatar emp={selItem.employee} size={44}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:500,color:INK}}>{selItem.employee.firstName} {selItem.employee.lastName}</div>
                      <div style={{fontSize:12,color:INK3}}>{selItem.employee.empCode} · {selItem.employee.position?.name}</div>
                    </div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:18,fontWeight:500,color:CORAL}}>฿{fmt(Number(selItem.netAmount))}</div><div style={{fontSize:11,color:INK3}}>Net Pay</div></div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:500,color:INK,marginBottom:8,display:"flex",alignItems:"center",gap:5}}><TrendingUp size={13} strokeWidth={1.8} color={TEAL}/> รายรับ</div>
                    {([["เงินเดือนฐาน",Number(selItem.baseAmount),INK],["สวัสดิการ",Number(selItem.benefits),TEAL],["โบนัส",Number(selItem.bonus),"#8a6d00"]] as [string,number,string][]).map(([l,v,c])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f8f9fa",fontSize:13}}>
                        <span style={{color:INK2}}>{l}</span><span style={{color:c}}>฿{fmt(v)}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 0",fontSize:13,fontWeight:500}}><span style={{color:INK}}>รวมรับ</span><span style={{color:TEAL}}>฿{fmt(Number(selItem.baseAmount)+Number(selItem.benefits)+Number(selItem.bonus))}</span></div>
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:INK,marginBottom:8,display:"flex",alignItems:"center",gap:5}}><Minus size={13} strokeWidth={1.8} color="#cc4444"/> รายการหัก</div>
                    {([["ภาษีเงินได้หัก ณ ที่จ่าย",Number(selItem.tax)],["ประกันสังคม",Number(selItem.sso)],["หักอื่นๆ",Number(selItem.otherDeduct)]] as [string,number][]).map(([l,v])=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f8f9fa",fontSize:13}}>
                        <span style={{color:INK2}}>{l}</span><span style={{color:"#cc4444"}}>-฿{fmt(v)}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 0",fontSize:13,fontWeight:500}}><span style={{color:INK}}>หักรวม</span><span style={{color:"#cc4444"}}>-฿{fmt(Number(selItem.tax)+Number(selItem.sso)+Number(selItem.otherDeduct))}</span></div>
                  </div>
                  <div style={{marginTop:14,padding:"12px 0 0",borderTop:"2px solid #eaecef",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:15,fontWeight:500,color:INK}}>เงินเดือนสุทธิ</span>
                    <span style={{fontSize:20,fontWeight:500,color:CORAL}}>฿{fmt(Number(selItem.netAmount))}</span>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8}}>
                <Btn variant="ghost"><Eye size={13} strokeWidth={1.8}/> Preview Payslip</Btn>
                <Btn variant="ghost" style={{opacity:isPaid?1:.4}}><Download size={13} strokeWidth={1.8}/> Download PDF</Btn>
                {!isPaid&&<span style={{fontSize:11,color:INK3,display:"flex",alignItems:"center"}}>ดาวน์โหลดได้หลังยืนยันการจ่าย</span>}
              </div>
            </div>
          ):(
            <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",overflow:"hidden",maxWidth:860}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,tableLayout:"fixed"}}>
                <thead><tr style={{background:BG}}>
                  {([["พนักงาน","26%"],["ตำแหน่ง","20%"],["เงินเดือน","14%"],["รับรวม","13%"],["หักรวม","13%"],["Net Pay","11%"],["","3%"]] as [string,string][]).map(([h,w])=>(
                    <th key={h} style={{padding:"9px 14px",textAlign:"left",fontSize:11,color:INK3,fontWeight:500,width:w}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {items.map(item=>{
                    const emp=item.employee;
                    if(!emp) return null;
                    return(
                      <tr key={item.id} style={{borderTop:"1px solid #f0f2f5",cursor:"pointer"}}
                        onMouseEnter={el=>(el.currentTarget.style.background="#fafbfc")}
                        onMouseLeave={el=>(el.currentTarget.style.background="transparent")}
                        onClick={()=>setSelItem(item)}>
                        <td style={{padding:"11px 14px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:9}}>
                            <Avatar emp={emp} size={30}/>
                            <div style={{minWidth:0}}>
                              <div style={{fontWeight:500,color:INK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{emp.firstName} {emp.lastName}</div>
                              <div style={{fontSize:10,color:INK3}}>{emp.empCode}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{padding:"11px 14px",fontSize:12,color:INK2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{emp.position?.name}</td>
                        <td style={{padding:"11px 14px",fontSize:12,color:INK,fontWeight:500}}>฿{fmt(Number(item.baseAmount))}</td>
                        <td style={{padding:"11px 14px",fontSize:12,color:TEAL}}>฿{fmt(Number(item.baseAmount)+Number(item.benefits)+Number(item.bonus))}</td>
                        <td style={{padding:"11px 14px",fontSize:12,color:"#cc4444"}}>-฿{fmt(Number(item.tax)+Number(item.sso)+Number(item.otherDeduct))}</td>
                        <td style={{padding:"11px 14px",fontSize:12,fontWeight:500,color:CORAL}}>฿{fmt(Number(item.netAmount))}</td>
                        <td style={{padding:"11px 14px"}}><ChevronRight size={14} strokeWidth={1.8} color={INK3}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Payslip tab */}
        {tab==="payslip"&&(
          <div style={{maxWidth:700}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:500,color:INK}}>Payslip พนักงาน — {MONTHS[run.month]} {run.year+543}</div>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="ghost"><Download size={13} strokeWidth={1.8}/> Download ทั้งหมด (PDF)</Btn>
                <Btn variant="teal" disabled={!isPaid}><Send size={13} strokeWidth={2}/> ส่งทาง Email</Btn>
              </div>
            </div>
            {!isPaid&&<div style={{background:"#fffbea",border:"1px solid #ffe9a0",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",gap:8}}>
              <AlertCircle size={14} strokeWidth={2} color="#8a6d00" style={{flexShrink:0,marginTop:1}}/>
              <div style={{fontSize:12,color:"#8a6d00"}}>Payslip จะส่งได้เมื่อยืนยันการจ่ายเงินแล้วเท่านั้น</div>
            </div>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {items.map(item=>{
                const emp=item.employee;
                if(!emp) return null;
                return(
                  <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:WHITE,borderRadius:12,border:"1px solid #eaecef"}}>
                    <Avatar emp={emp} size={34}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:INK}}>{emp.firstName} {emp.lastName}</div>
                      <div style={{fontSize:11,color:INK3}}>{emp.empCode} · Net ฿{fmt(Number(item.netAmount))}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <Btn variant="ghost" style={{fontSize:11,padding:"5px 10px"}}><Eye size={12} strokeWidth={1.8}/> ดู</Btn>
                      <Btn variant="ghost" style={{fontSize:11,padding:"5px 10px",opacity:isPaid?1:.4}}><Download size={12} strokeWidth={1.8}/> PDF</Btn>
                      <Btn variant="ghost" style={{fontSize:11,padding:"5px 10px",opacity:isPaid?1:.4}}><Send size={12} strokeWidth={1.8}/> ส่ง Email</Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bank tab */}
        {tab==="bank"&&(
          <div style={{maxWidth:600}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:14,fontWeight:500,color:INK}}>ไฟล์โอนเงินธนาคาร</div>
              <Btn variant="primary" disabled={!isPaid}><Download size={13} strokeWidth={1.8}/> Download Bank File</Btn>
            </div>
            {!isPaid&&<div style={{background:"#fff0f0",border:"1px solid #f5c4b3",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",gap:8}}>
              <Lock size={14} strokeWidth={2} color="#cc4444" style={{flexShrink:0,marginTop:1}}/>
              <div style={{fontSize:12,color:"#cc4444"}}>ต้อง "ยืนยันการจ่าย" ก่อนจึงจะ Export Bank File ได้</div>
            </div>}
            <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:18}}>
              <div style={{fontSize:14,fontWeight:500,color:INK,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><CreditCard size={15} strokeWidth={1.8} color={INK3}/> รายการโอน</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {items.map(item=>{
                  const emp=item.employee;
                  if(!emp) return null;
                  return(
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:BG,borderRadius:9}}>
                      <Avatar emp={emp} size={28}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:500,color:INK}}>{emp.firstName} {emp.lastName}</div>
                        <div style={{fontSize:10,color:INK3}}>{emp.empCode}</div>
                      </div>
                      <div style={{fontSize:12,fontWeight:500,color:CORAL}}>฿{fmt(Number(item.netAmount))}</div>
                      {isPaid?<Check size={14} strokeWidth={2} color={TEAL}/>:<Lock size={12} strokeWidth={1.8} color={INK3}/>}
                    </div>
                  );
                })}
              </div>
              {isPaid&&<div style={{marginTop:12,padding:"10px 14px",background:"#e6faf9",borderRadius:9,display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:13,fontWeight:500,color:"#007d75"}}>ยอดโอนรวม</span>
                <span style={{fontSize:13,fontWeight:500,color:TEAL}}>฿{fmt(Number(run.totalNet))}</span>
              </div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  ROOT PAGE (screen machine)
// ════════════════════════════════════════
type Screen="dashboard"|"history"|"run"|"detail";

export default function PayrollPage(){
  const [screen,setScreen]=useState<Screen>("dashboard");
  const [selCompany,setSelCompany]=useState<Company|null>(null);
  const [selMonth,setSelMonth]=useState(new Date().getMonth()+1);
  const [selYear,setSelYear]=useState(new Date().getFullYear());
  const [selRun,setSelRun]=useState<PayrollRun|null>(null);

  if(screen==="run"&&selCompany){
    return <RunPayrollPage company={selCompany} month={selMonth} year={selYear}
      onBack={()=>setScreen("history")}
      onComplete={run=>{setSelRun(run);setScreen("detail");}}/>;
  }
  if(screen==="detail"&&selRun&&selCompany){
    return <PayrollDetail run={selRun} company={selCompany} onBack={()=>setScreen("history")}/>;
  }
  if(screen==="history"&&selCompany){
    return <PayrollHistory company={selCompany} initMonth={selMonth} initYear={selYear}
      onBack={()=>setScreen("dashboard")}
      onRunNew={(m,y)=>{setSelMonth(m);setSelYear(y);setScreen("run");}}
      onViewRun={run=>{setSelRun(run);setScreen("detail");}}/>;
  }
  return <PayrollDashboard onSelectCompany={(co,m,y)=>{setSelCompany(co);setSelMonth(m);setSelYear(y);setScreen("history");}}/>;
}
