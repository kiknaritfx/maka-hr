"use client";
import React from "react";
import { useEffect, useState, useRef } from "react";
import { Company, Dept, Pos, Benefit, Employee } from "./types";
import {
  Users, Plus, Search, Download, ChevronRight, ChevronLeft, ChevronDown,
  Pencil, Trash2, Check, X, ArrowLeft, UserPlus, UserMinus, UserX,
  UserCheck, Briefcase, Clock, Gift, AlertCircle, FileText,
  Wallet, CalendarDays, Building2
} from "lucide-react";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

const TEAL="#00B4A9"; const CORAL="#FF6B6B";
const BG="#F4F6F8"; const INK="#1C2833"; const INK2="#5a6a78"; const INK3="#9aaab8"; const WHITE="#fff";
const F="'Prompt','Kanit',sans-serif";

const CONTRACT_LABELS: Record<string,string> = {MONTHLY:"รายเดือน",DAILY:"รายวัน",PARTTIME:"พาร์ทไทม์",INTERN:"ฝึกงาน",CONSULTANT:"ที่ปรึกษา"};
const BANK_LIST=["ธนาคารกสิกรไทย","ธนาคารกรุงเทพ","ธนาคารไทยพาณิชย์","ธนาคารกรุงไทย","ธนาคารกรุงศรี","ธนาคารทหารไทยธนชาต","ธนาคารออมสิน"];
const PROFILE_COLORS: Array<[string,string]> = [["#e6faf9","#007d75"],["#fff0f0","#cc4444"],["#eeedfe","#534ab7"],["#faeeda","#854f0b"],["#e6f1fb","#185fa5"],["#fbeaf0","#993556"],["#EAF3DE","#3B6D11"],["#f4f6f8","#5a6a78"]];
const EMP_STATUS: Record<string,{bg:string;color:string;label:string}> = {
  ACTIVE:   {bg:"#e6faf9",color:"#007d75",label:"ทำงานอยู่"},
  PROBATION:{bg:"#fffbea",color:"#8a6d00",label:"ทดลองงาน"},
  LEAVE:    {bg:"#faeeda",color:"#854f0b",label:"ลาพักร้อน"},
  RESIGNED: {bg:"#fff0f0",color:"#cc4444",label:"ลาออกแล้ว"},
  TERMINATED:{bg:"#fcebeb",color:"#a32d2d",label:"พ้นสภาพ"},
};
const TH_MONTHS=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const TH_DAYS=["อา","จ","อ","พ","พฤ","ศ","ส"];

function formatThai(iso:string){if(!iso)return "—"; const d=new Date(iso); return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear()+543}`;}
function isoToInput(iso:string){return iso?iso.split("T")[0]:"";}
function fname(e:Employee){return `${e.firstName} ${e.lastName}`;}
function initials(e:Employee){return (e.firstName[0]||"")+(e.lastName[0]||"");}

function Avatar({emp, size=36}:{emp:Employee; size?:number}){
  return <div style={{width:size,height:size,borderRadius:Math.round(size*.28),background:emp.profileColor||"#e6faf9",color:emp.profileTextColor||TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*.36),fontWeight:500,flexShrink:0}}>{initials(emp)}</div>;
}
function StatusChip({status}:{status:string}){
  const s=EMP_STATUS[status]||EMP_STATUS.ACTIVE;
  return <span style={{background:s.bg,color:s.color,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:500}}>{s.label}</span>;
}
function Btn({children,onClick,variant="ghost",disabled=false}:{children:React.ReactNode;onClick?:()=>void;variant?:string;disabled?:boolean}){
  const styles: Record<string,React.CSSProperties> = {
    primary:{background:CORAL,color:WHITE,border:"none"},
    teal:{background:TEAL,color:WHITE,border:"none"},
    ghost:{background:"transparent",color:INK2,border:"1px solid #dde2e8"},
    danger:{background:"#fff0f0",color:"#cc4444",border:"1px solid #f5c4b3"},
  };
  return <button onClick={disabled?undefined:onClick} disabled={disabled}
    style={{display:"inline-flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:500,cursor:disabled?"default":"pointer",border:"none",fontFamily:F,opacity:disabled?.4:1,...(styles[variant]||styles.ghost)}}>
    {children}
  </button>;
}
function IBtn({Icon,onClick,label}:{Icon:React.ElementType;onClick?:()=>void;label?:string}){
  return <button aria-label={label} onClick={onClick} style={{width:28,height:28,borderRadius:7,background:"transparent",border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:INK3}}>
    <Icon size={13} strokeWidth={1.8}/>
  </button>;
}
function FL({children,req=false}:{children:React.ReactNode;req?:boolean}){
  return <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>{children}{req&&<span style={{color:CORAL}}> *</span>}</div>;
}
function FV({children}:{children:React.ReactNode}){
  return <div style={{fontSize:13,color:children?INK:INK3,background:BG,borderRadius:8,padding:"9px 12px"}}>{children||"—"}</div>;
}
function FInput({label,value,onChange,placeholder,type="text",req=false,error=""}:{label:string;value:string;onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void;placeholder?:string;type?:string;req?:boolean;error?:string}){
  return <div>
    <FL req={req}>{label}</FL>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"9px 12px",borderRadius:8,border:`1px solid ${error?"#F09595":"#dde2e8"}`,fontFamily:F,background:WHITE,color:INK,outline:"none"}}/>
    {error&&<div style={{fontSize:11,color:"#cc4444",marginTop:2}}>{error}</div>}
  </div>;
}
function FSelect({label,value,onChange,options,req=false}:{label:string;value:string;onChange:(e:React.ChangeEvent<HTMLSelectElement>)=>void;options:Array<{value:string;label:string}|string>;req?:boolean}){
  return <div>
    <FL req={req}>{label}</FL>
    <select value={value} onChange={onChange} style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK}}>
      {options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
}
function Modal(props:any){
  const {title,sub,onClose,children,width=560}=props;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,40,51,.46)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{background:WHITE,borderRadius:16,width,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #eaecef"}}>
          <div>
            <div style={{fontSize:15,fontWeight:500,color:INK}}>{title}</div>
            {sub&&<div style={{fontSize:12,color:INK3,marginTop:2}}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:INK3,display:"flex"}}><X size={18} strokeWidth={1.8}/></button>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"18px 20px"}}>{children}</div>
      </div>
    </div>
  );
}

function MiniCalendar({value,onChange,error=""}:{value:string;onChange:(v:string)=>void;error?:string}){
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const today=new Date();
  const init=value?new Date(value):today;
  const [vy,setVy]=useState(init.getFullYear());
  const [vm,setVm]=useState(init.getMonth());
  useEffect(()=>{
    function h(e:MouseEvent){if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);}
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[]);
  const first=new Date(vy,vm,1).getDay();
  const dim=new Date(vy,vm+1,0).getDate();
  const cells:Array<number|null>=[];
  for(let i=0;i<first;i++) cells.push(null);
  for(let d=1;d<=dim;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);
  function pick(d:number|null){
    if(!d)return;
    const iso=`${vy}-${String(vm+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    onChange(iso); setOpen(false);
  }
  const selD=value?new Date(value):null;
  return <div ref={ref} style={{position:"relative",width:"100%"}}>
    <button type="button" onClick={()=>setOpen(o=>!o)}
      style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,padding:"9px 12px",borderRadius:8,border:`1px solid ${error?"#F09595":open?TEAL:"#dde2e8"}`,fontFamily:F,background:WHITE,color:value?INK:INK3,cursor:"pointer",outline:"none",boxSizing:"border-box"}}>
      <span style={{display:"flex",alignItems:"center",gap:7}}><CalendarDays size={14} strokeWidth={1.8} color={value?TEAL:INK3}/>{value?formatThai(value):"เลือกวันที่"}</span>
      <ChevronDown size={13} strokeWidth={1.8} color={INK3} style={{transform:open?"rotate(180deg)":"none"}}/>
    </button>
    {error&&<div style={{fontSize:11,color:"#cc4444",marginTop:2}}>{error}</div>}
    {open&&<div style={{position:"absolute",top:"calc(100% + 5px)",left:0,zIndex:300,background:WHITE,borderRadius:14,border:"1px solid #dde2e8",padding:"12px 14px",width:240,boxShadow:"0 4px 16px rgba(28,40,51,.12)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button type="button" onClick={()=>{if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1);}} style={{background:"transparent",border:"none",cursor:"pointer",color:INK2,display:"flex",padding:3,borderRadius:6}}><ChevronLeft size={14} strokeWidth={2}/></button>
        <span style={{fontSize:13,fontWeight:500,color:INK,fontFamily:F}}>{TH_MONTHS[vm]} {vy+543}</span>
        <button type="button" onClick={()=>{if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1);}} style={{background:"transparent",border:"none",cursor:"pointer",color:INK2,display:"flex",padding:3,borderRadius:6}}><ChevronRight size={14} strokeWidth={2}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
        {TH_DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:INK3,fontFamily:F}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
        {cells.map((d,i)=>{
          const sel=selD&&d&&selD.getFullYear()===vy&&selD.getMonth()===vm&&selD.getDate()===d;
          const tod=d&&today.getFullYear()===vy&&today.getMonth()===vm&&today.getDate()===d;
          return <button key={i} type="button" onClick={()=>pick(d)}
            style={{height:28,borderRadius:7,border:"none",cursor:d?"pointer":"default",background:sel?TEAL:tod?"#e6faf9":"transparent",color:sel?WHITE:tod?TEAL:d?INK:"transparent",fontSize:12,fontFamily:F,fontWeight:sel||tod?500:400}}>
            {d||""}
          </button>;
        })}
      </div>
      <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #eaecef",display:"flex",justifyContent:"center"}}>
        <button type="button" onClick={()=>{const t=new Date();setVy(t.getFullYear());setVm(t.getMonth());pick(t.getDate());}} style={{fontSize:11,color:TEAL,background:"transparent",border:"none",cursor:"pointer",fontFamily:F,fontWeight:500}}>วันนี้</button>
      </div>
    </div>}
  </div>;
}

// ── Company Picker ──
function CompanyPicker({companies,onSelect}:any){
  const totalEmp=companies.reduce((s:number,c:any)=>s+(c._count?.employees||0),0);
  return (
    <div style={{fontFamily:F,padding:"28px 32px",background:BG,minHeight:"100vh"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:600,color:INK}}>จัดการพนักงาน</div>
        <div style={{fontSize:12,color:INK3,marginTop:2}}>เลือกบริษัทเพื่อดูและจัดการพนักงาน · รวม {totalEmp} คน</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {companies.map((co:any)=>(
          <div key={co.id} onClick={()=>onSelect(co)}
            style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:"16px 18px",cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=TEAL}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#eaecef"}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              {co.logoUrl
                ?<img src={co.logoUrl} alt={co.code} style={{width:40,height:40,borderRadius:11,objectFit:"cover"}}/>
                :<div style={{width:40,height:40,borderRadius:11,background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,flexShrink:0}}>{co.code}</div>
              }
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:500,fontSize:13,color:INK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.name}</div>
                <div style={{fontSize:11,color:INK3}}>{co.nameTH}</div>
              </div>
              <ChevronRight size={15} strokeWidth={1.8} color={INK3}/>
            </div>
            <div style={{background:BG,borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:600,color:CORAL}}>{co._count?.employees||0}</div>
              <div style={{fontSize:11,color:INK3}}>พนักงาน</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Employee List ──
function EmpList({company,companies,emps,depts,loading,onChangeCompany,onViewEmp,onAddEmp}:any){
  const [search,setSearch]=useState("");
  const [fDept,setFDept]=useState("ทั้งหมด");
  const [fStatus,setFStatus]=useState("ทั้งหมด");
  const [showWizard,setShowWizard]=useState(false);
  const [positions,setPositions]=useState([] as Pos[]);

  useEffect(()=>{
    apiFetch(`/api/companies/${company.id}/positions`).then((r:any)=>{if(r.data)setPositions(r.data);});
  },[company.id]);

  const list=emps.filter((e:any)=>{
    const q=search.toLowerCase();
    const mQ=!q||fname(e).toLowerCase().includes(q)||e.empCode.toLowerCase().includes(q)||(e.nickname||"").toLowerCase().includes(q);
    const mD=fDept==="ทั้งหมด"||e.department?.name===fDept;
    const mS=fStatus==="ทั้งหมด"||e.status===fStatus;
    return mQ&&mD&&mS;
  });

  return (
    <div style={{fontFamily:F,background:BG,minHeight:"100vh"}}>
      <div style={{padding:"16px 28px 12px",borderBottom:"1px solid #eaecef",background:WHITE}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
          <div style={{flex:1}}><div style={{fontSize:20,fontWeight:600,color:INK}}>จัดการพนักงาน</div></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:INK3}}>บริษัท:</span>
            <div style={{position:"relative"}}>
              <select value={company.id} onChange={(e:React.ChangeEvent<HTMLSelectElement>)=>{const co=companies.find((c:any)=>c.id===Number(e.target.value));if(co)onChangeCompany(co);}}
                style={{appearance:"none",WebkitAppearance:"none",fontSize:13,fontWeight:500,padding:"7px 32px 7px 12px",borderRadius:9,border:`1px solid ${TEAL}`,fontFamily:F,background:"#e6faf9",color:TEAL,cursor:"pointer",outline:"none",minWidth:200}}>
                {companies.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={13} strokeWidth={2} color={TEAL} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            </div>
          </div>
          <Btn variant="ghost"><Download size={14} strokeWidth={1.8}/> Export</Btn>
          <Btn variant="teal" onClick={()=>setShowWizard(true)}><UserPlus size={14} strokeWidth={2}/> เพิ่มพนักงาน</Btn>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:company.color,borderRadius:8,padding:"4px 10px"}}>
            <div style={{width:18,height:18,borderRadius:5,background:"rgba(255,255,255,.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:600,color:company.textColor}}>{company.code}</div>
            <span style={{fontSize:11,color:company.textColor,fontWeight:500}}>{emps.length} คน</span>
          </div>
          {Object.entries(EMP_STATUS).map(([k,v])=>{const n=emps.filter((e:any)=>e.status===k).length;if(!n)return null;return(
            <div key={k} style={{display:"flex",alignItems:"center",gap:5,background:v.bg,borderRadius:20,padding:"3px 10px"}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:v.color,display:"inline-block"}}/>
              <span style={{fontSize:11,color:v.color,fontWeight:500}}>{n} {v.label}</span>
            </div>
          );})}
        </div>
      </div>
      <div style={{padding:"10px 28px",background:WHITE,borderBottom:"1px solid #eaecef",display:"flex",gap:10}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:BG,border:"1px solid #dde2e8",borderRadius:10,padding:"0 12px",height:36}}>
          <Search size={14} strokeWidth={1.8} color={INK3}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อ รหัส ชื่อเล่น..."
            style={{border:"none",background:"transparent",outline:"none",fontSize:13,color:INK,fontFamily:F,flex:1}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"transparent",border:"none",cursor:"pointer",color:INK3,display:"flex"}}><X size={13} strokeWidth={2}/></button>}
        </div>
        <select value={fDept} onChange={e=>setFDept(e.target.value)} style={{fontSize:12,padding:"0 10px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK,height:36}}>
          <option value="ทั้งหมด">แผนก: ทั้งหมด</option>
          {depts.map((d:any)=><option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
        <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{fontSize:12,padding:"0 10px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK,height:36}}>
          <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
          {Object.entries(EMP_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div style={{padding:"16px 28px"}}>
        <div style={{background:WHITE,borderRadius:16,border:"1px solid #eaecef",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,tableLayout:"fixed"}}>
            <thead><tr style={{background:BG}}>
              {[["พนักงาน","30%"],["แผนก / ตำแหน่ง","24%"],["เริ่มงาน","13%"],["เงินเดือน (฿)","14%"],["สถานะ","12%"],["","7%"]].map(([h,w])=>(
                <th key={h} style={{padding:"9px 14px",textAlign:"left",fontSize:11,color:INK3,fontWeight:500,width:w}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading&&<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:INK3}}>กำลังโหลด...</td></tr>}
              {list.map((e:any)=>(
                <tr key={e.id} onClick={()=>onViewEmp(e)} style={{borderTop:"1px solid #f0f2f5",cursor:"pointer"}}
                  onMouseEnter={el=>el.currentTarget.style.background="#fafbfc"}
                  onMouseLeave={el=>el.currentTarget.style.background="transparent"}>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Avatar emp={e} size={34}/>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:500,color:INK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fname(e)}</div>
                        <div style={{fontSize:11,color:INK3}}>{e.empCode}{e.nickname?` · "${e.nickname}`:""}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"11px 14px"}}>
                    <div style={{fontSize:12,fontWeight:500,color:INK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.department?.name||"—"}</div>
                    <div style={{fontSize:11,color:INK3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.position?.name||"—"}</div>
                  </td>
                  <td style={{padding:"11px 14px",fontSize:12,color:INK2}}>{formatThai(e.hireDate)}</td>
                  <td style={{padding:"11px 14px",fontSize:12,fontWeight:500,color:INK}}>{Number(e.baseSalary).toLocaleString()}</td>
                  <td style={{padding:"11px 14px"}}><StatusChip status={e.status}/></td>
                  <td style={{padding:"11px 14px"}} onClick={ev=>ev.stopPropagation()}>
                    <IBtn Icon={Pencil} label="แก้ไข" onClick={()=>onViewEmp(e)}/>
                  </td>
                </tr>
              ))}
              {!loading&&list.length===0&&<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:INK3}}>ไม่พบพนักงาน</td></tr>}
            </tbody>
          </table>
          <div style={{padding:"9px 14px",borderTop:"1px solid #f0f2f5",fontSize:12,color:INK3}}>แสดง {list.length} จาก {emps.length} คน</div>
        </div>
      </div>
      {showWizard&&<AddWizard company={company} depts={depts} positions={positions} onClose={()=>setShowWizard(false)} onSave={(e:any)=>{onAddEmp(e);setShowWizard(false);}}/>}
    </div>
  );
}

// ── Employee Profile ──
function EmpProfile({emp:initEmp,company,allEmps,depts,positions,onBack,onUpdate,onOffboard}:any){
  const [emp,setEmp]=useState(initEmp as Employee);
  const [tab,setTab]=useState("info");
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({...initEmp,hireDate:isoToInput(initEmp.hireDate),birthDate:isoToInput(initEmp.birthDate||"")});
  const [benefits,setBenefits]=useState(([...(initEmp.benefits||[])]) as Benefit[]);
  const [newBen,setNewBen]=useState({name:"",amount:""});
  const [saving,setSaving]=useState(false);

  async function save(){
    setSaving(true);
    const payload={
      firstName:form.firstName,lastName:form.lastName,firstNameEN:form.firstNameEN,lastNameEN:form.lastNameEN,
      nickname:form.nickname,gender:form.gender,birthDate:form.birthDate||undefined,nationalId:form.nationalId,
      phone:form.phone,email:form.email,address:form.address,
      empCode:form.empCode,contractType:form.contractType,hireDate:form.hireDate,
      status:form.status,baseSalary:Number(form.baseSalary),bank:form.bank,bankAccount:form.bankAccount,
      profileColor:form.profileColor,profileTextColor:form.profileTextColor,
      departmentId:form.departmentId||null,positionId:form.positionId||null,managerId:form.managerId||null,
      benefits:benefits.map(b=>({name:b.name,amount:Number(b.amount)})),
    };
    const r:any=await apiFetch(`/api/employees/${emp.id}`,{method:"PATCH",body:JSON.stringify(payload)});
    if(r.data){const u={...emp,...r.data,benefits};setEmp(u);onUpdate(u);}
    setSaving(false);setEditing(false);
  }

  async function toggleApprove(){
    const r:any=await apiFetch(`/api/employees/${emp.id}`,{method:"PATCH",body:JSON.stringify({canApproveLeave:!emp.canApproveLeave})});
    if(r.data){const u={...emp,...r.data};setEmp(u);onUpdate(u);}
  }

  async function saveBenefits(nb:any){
    setBenefits(nb);
    const r:any=await apiFetch(`/api/employees/${emp.id}`,{method:"PATCH",body:JSON.stringify({benefits:nb.map((b:any)=>({name:b.name,amount:Number(b.amount)}))})});
    if(r.data){const u={...emp,...r.data,benefits:nb};setEmp(u);onUpdate(u);}
  }

  const TABS=[
    {key:"info",Icon:Users,label:"ข้อมูลส่วนตัว"},
    {key:"contract",Icon:FileText,label:"สัญญาจ้าง"},
    {key:"salary",Icon:Wallet,label:"เงินเดือน"},
    {key:"benefits",Icon:Gift,label:"สวัสดิการ"},
    {key:"leave",Icon:UserCheck,label:"อนุมัติลา"},
  ];

  return (
    <div style={{fontFamily:F,background:BG,minHeight:"100vh"}}>
      <div style={{padding:"12px 28px 0",borderBottom:"1px solid #eaecef",background:WHITE}}>
        <button onClick={onBack} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:TEAL,background:"transparent",border:"none",cursor:"pointer",padding:"0 0 8px",fontFamily:F}}>
          <ArrowLeft size={13} strokeWidth={2}/> {company.name}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
          <Avatar emp={emp} size={52}/>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:18,fontWeight:600,color:INK}}>{fname(emp)}</span>
              {emp.nickname&&<span style={{fontSize:12,color:INK3}}>"{emp.nickname}"</span>}
              <StatusChip status={emp.status}/>
            </div>
            <div style={{fontSize:12,color:INK3,marginTop:2}}>{emp.empCode} · {emp.department?.name||"—"} · {emp.position?.name||"—"}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {!editing
              ?<Btn variant="ghost" onClick={()=>{setForm({...emp,hireDate:isoToInput(emp.hireDate),birthDate:isoToInput(emp.birthDate||"")});setEditing(true);}}><Pencil size={13} strokeWidth={1.8}/> แก้ไข</Btn>
              :<><Btn variant="ghost" onClick={()=>setEditing(false)}>ยกเลิก</Btn><Btn variant="primary" onClick={save} disabled={saving}><Check size={13} strokeWidth={2.5}/> {saving?"บันทึก...":"บันทึก"}</Btn></>
            }
            <Btn variant="danger" onClick={()=>onOffboard(emp)}><UserX size={13} strokeWidth={1.8}/> Offboard</Btn>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {[[formatThai(emp.hireDate),"เริ่มงาน"],[Number(emp.baseSalary).toLocaleString()+" ฿","เงินเดือน"],[CONTRACT_LABELS[emp.contractType]||emp.contractType,"สัญญา"]].map(([v,l])=>(
            <div key={l} style={{background:BG,borderRadius:9,padding:"6px 12px"}}>
              <div style={{fontSize:11,fontWeight:500,color:INK,whiteSpace:"nowrap"}}>{v}</div>
              <div style={{fontSize:10,color:INK3}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",overflowX:"auto"}}>
          {TABS.map(({key,Icon,label})=>(
            <button key={key} onClick={()=>setTab(key)}
              style={{padding:"9px 14px",fontSize:13,color:tab===key?TEAL:INK3,fontWeight:tab===key?500:400,borderBottom:tab===key?`2.5px solid ${TEAL}`:"2.5px solid transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",background:"transparent",border:"none",fontFamily:F}}>
              <Icon size={13} strokeWidth={1.8}/>{label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"18px 28px"}}>
        {tab==="info"&&(
          <div style={{maxWidth:680}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {editing?<>
                <FInput label="ชื่อ (TH)" req={true} value={form.firstName||""} onChange={e=>setForm({...form,firstName:e.target.value})}/>
                <FInput label="นามสกุล (TH)" req={true} value={form.lastName||""} onChange={e=>setForm({...form,lastName:e.target.value})}/>
                <FInput label="First Name (EN)" value={form.firstNameEN||""} onChange={e=>setForm({...form,firstNameEN:e.target.value})}/>
                <FInput label="Last Name (EN)" value={form.lastNameEN||""} onChange={e=>setForm({...form,lastNameEN:e.target.value})}/>
                <FInput label="ชื่อเล่น" value={form.nickname||""} onChange={e=>setForm({...form,nickname:e.target.value})}/>
                <FSelect label="เพศ" value={form.gender||"ชาย"} onChange={e=>setForm({...form,gender:e.target.value})} options={["ชาย","หญิง","ไม่ระบุ"]}/>
                <div><FL>วันเกิด</FL><MiniCalendar value={form.birthDate||""} onChange={v=>setForm({...form,birthDate:v})}/></div>
                <FInput label="เลขบัตรประชาชน" value={form.nationalId||""} onChange={e=>setForm({...form,nationalId:e.target.value})}/>
                <FInput label="โทรศัพท์" req={true} value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})}/>
                <FInput label="อีเมล" req={true} type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})}/>
                <div style={{gridColumn:"1/-1"}}><FInput label="ที่อยู่" value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})}/></div>
                <div style={{gridColumn:"1/-1"}}>
                  <FL>สีโปรไฟล์</FL>
                  <div style={{display:"flex",gap:6}}>
                    {PROFILE_COLORS.map(([c,t])=>(
                      <div key={c} onClick={()=>setForm({...form,profileColor:c,profileTextColor:t})}
                        style={{width:26,height:26,borderRadius:7,background:c,border:form.profileColor===c?`2.5px solid ${TEAL}`:"2px solid transparent",cursor:"pointer"}}/>
                    ))}
                  </div>
                </div>
              </>:<>
                {[["ชื่อ (TH)",emp.firstName],["นามสกุล (TH)",emp.lastName],["First Name",emp.firstNameEN||"—"],["Last Name",emp.lastNameEN||"—"],["ชื่อเล่น",emp.nickname||"—"],["เพศ",emp.gender||"—"],["วันเกิด",formatThai(emp.birthDate||"")],["เลขบัตรประชาชน",emp.nationalId||"—"],["โทรศัพท์",emp.phone],["อีเมล",emp.email]].map(([l,v])=>(
                  <div key={l}><FL>{l}</FL><FV>{v}</FV></div>
                ))}
                <div style={{gridColumn:"1/-1"}}><FL>ที่อยู่</FL><FV>{emp.address||"—"}</FV></div>
              </>}
            </div>
          </div>
        )}

        {tab==="contract"&&(
          <div style={{maxWidth:680}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {editing?<>
                <FInput label="รหัสพนักงาน" req={true} value={form.empCode||""} onChange={e=>setForm({...form,empCode:e.target.value})}/>
                <FSelect label="ประเภทสัญญา" value={form.contractType||"MONTHLY"} onChange={e=>setForm({...form,contractType:e.target.value})}
                  options={Object.entries(CONTRACT_LABELS).map(([v,l])=>({value:v,label:l}))}/>
                <div><FL req={true}>วันเริ่มงาน</FL><MiniCalendar value={form.hireDate||""} onChange={v=>setForm({...form,hireDate:v})}/></div>
                <FSelect label="สถานะ" value={form.status||"PROBATION"} onChange={e=>setForm({...form,status:e.target.value})}
                  options={Object.entries(EMP_STATUS).map(([v,{label}])=>({value:v,label}))}/>
                <FSelect label="แผนก" value={String(form.departmentId||"")} onChange={e=>setForm({...form,departmentId:Number(e.target.value)||undefined})}
                  options={[{value:"",label:"— ไม่ระบุ —"},...depts.map((d:any)=>({value:String(d.id),label:d.name}))]}/>
                <FSelect label="ตำแหน่ง" value={String(form.positionId||"")} onChange={e=>setForm({...form,positionId:Number(e.target.value)||undefined})}
                  options={[{value:"",label:"— ไม่ระบุ —"},...positions.map((p:any)=>({value:String(p.id),label:p.name}))]}/>
                <div style={{gridColumn:"1/-1"}}>
                  <FL>หัวหน้างาน</FL>
                  <select value={form.managerId||""} onChange={e=>setForm({...form,managerId:e.target.value?Number(e.target.value):undefined})}
                    style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK}}>
                    <option value="">— ไม่มีหัวหน้างาน —</option>
                    {allEmps.filter((e:any)=>e.id!==emp.id).map((e:any)=><option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.empCode})</option>)}
                  </select>
                </div>
              </>:<>
                {[["รหัสพนักงาน",emp.empCode],["ประเภทสัญญา",CONTRACT_LABELS[emp.contractType]||emp.contractType],["วันเริ่มงาน",formatThai(emp.hireDate)],["สถานะ",EMP_STATUS[emp.status]?.label||emp.status],["แผนก",emp.department?.name||"—"],["ตำแหน่ง",emp.position?.name||"—"]].map(([l,v])=>(
                  <div key={l}><FL>{l}</FL><FV>{v}</FV></div>
                ))}
                <div style={{gridColumn:"1/-1"}}>
                  <FL>หัวหน้างาน</FL>
                  {emp.manager?<div style={{display:"flex",alignItems:"center",gap:10,background:BG,borderRadius:8,padding:"9px 12px"}}>
                    <div style={{width:34,height:34,borderRadius:9,background:"#e6faf9",color:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500}}>{emp.manager.firstName[0]}{emp.manager.lastName[0]}</div>
                    <div><div style={{fontSize:13,fontWeight:500,color:INK}}>{emp.manager.firstName} {emp.manager.lastName}</div><div style={{fontSize:11,color:INK3}}>{emp.manager.empCode}</div></div>
                  </div>:<FV>ไม่มีหัวหน้างาน</FV>}
                </div>
              </>}
            </div>
          </div>
        )}

        {tab==="salary"&&(
          <div style={{maxWidth:680}}>
            <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:18,marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:500,color:INK,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><Wallet size={14} strokeWidth={1.8} color={INK3}/> เงินเดือน และบัญชีธนาคาร</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {editing?<>
                  <FInput label="เงินเดือนฐาน (฿/เดือน)" req={true} type="number" value={String(form.baseSalary||"")} onChange={e=>setForm({...form,baseSalary:parseFloat(e.target.value)||0})}/>
                  <FSelect label="ธนาคาร" value={form.bank||""} onChange={e=>setForm({...form,bank:e.target.value})} options={BANK_LIST}/>
                  <FInput label="เลขบัญชี" value={form.bankAccount||""} onChange={e=>setForm({...form,bankAccount:e.target.value})}/>
                </>:<>
                  {[["เงินเดือนฐาน",`${Number(emp.baseSalary).toLocaleString()} บาท/เดือน`],["ธนาคาร",emp.bank||"—"],["เลขบัญชี",emp.bankAccount||"—"]].map(([l,v])=>(
                    <div key={l}><FL>{l}</FL><FV>{v}</FV></div>
                  ))}
                </>}
              </div>
            </div>
            <div style={{background:"#e6faf9",border:"1px solid #9FE1CB",borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:12,fontWeight:500,color:"#007d75",marginBottom:8,display:"flex",alignItems:"center",gap:5}}><Clock size={13} strokeWidth={1.8}/> อัตรา OT ตามกฎหมายแรงงาน</div>
              {[["วันธรรมดา (เกินเวลาปกติ)","1.5x"],["วันหยุดประจำสัปดาห์","2x"],["วันนักขัตฤกษ์","3x"]].map(([l,r])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#007d75",padding:"3px 0",borderBottom:"1px solid #b8ead8"}}><span>{l}</span><span style={{fontWeight:500}}>{r}</span></div>
              ))}
            </div>
          </div>
        )}

        {tab==="benefits"&&(
          <div style={{maxWidth:640}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:500,color:INK}}>สวัสดิการรายบุคคล</div>
              <span style={{fontSize:12,color:INK3}}>รวม {benefits.reduce((s,b)=>s+Number(b.amount),0).toLocaleString()} ฿/เดือน</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              {benefits.map((b,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:WHITE,borderRadius:10,border:"1px solid #eaecef"}}>
                  <Gift size={15} strokeWidth={1.8} color={TEAL}/>
                  <div style={{flex:1,fontSize:13,fontWeight:500,color:INK}}>{b.name}</div>
                  <div style={{fontSize:13,color:TEAL,fontWeight:500}}>{Number(b.amount).toLocaleString()} ฿/เดือน</div>
                  <IBtn Icon={Trash2} label="ลบ" onClick={()=>saveBenefits(benefits.filter((_,j)=>j!==i))}/>
                </div>
              ))}
              {benefits.length===0&&<div style={{padding:20,textAlign:"center",color:INK3,fontSize:13,background:BG,borderRadius:10}}>ยังไม่มีสวัสดิการรายบุคคล</div>}
            </div>
            <div style={{background:"#e6faf9",border:"1px solid #9FE1CB",borderRadius:12,padding:14}}>
              <div style={{fontSize:12,fontWeight:500,color:"#007d75",marginBottom:10}}>เพิ่มสวัสดิการ</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <input value={newBen.name} onChange={e=>setNewBen({...newBen,name:e.target.value})} placeholder="ชื่อสวัสดิการ" style={{fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #9FE1CB",fontFamily:F,background:WHITE,color:INK,outline:"none"}}/>
                <input type="number" value={newBen.amount} onChange={e=>setNewBen({...newBen,amount:e.target.value})} placeholder="จำนวนเงิน (฿/เดือน)" style={{fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #9FE1CB",fontFamily:F,background:WHITE,color:INK,outline:"none"}}/>
              </div>
              <Btn variant="teal" onClick={()=>{if(!newBen.name)return;saveBenefits([...benefits,{name:newBen.name,amount:parseInt(newBen.amount)||0}]);setNewBen({name:"",amount:""});}}><Plus size={13} strokeWidth={2.5}/> เพิ่มสวัสดิการ</Btn>
            </div>
          </div>
        )}

        {tab==="leave"&&(
          <div style={{maxWidth:620}}>
            <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:18,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
                <div>
                  <div style={{fontSize:14,fontWeight:500,color:INK,marginBottom:4}}>สิทธิ์อนุมัติการลา</div>
                  <div style={{fontSize:12,color:INK3}}>เมื่อเปิดสิทธิ์ พนักงานคนนี้สามารถอนุมัติคำขอลาของผู้ใต้บังคับบัญชาได้</div>
                </div>
                <button onClick={toggleApprove} style={{background:"transparent",border:"none",cursor:"pointer",flexShrink:0}}>
                  {emp.canApproveLeave
                    ?<div style={{display:"flex",alignItems:"center",gap:6,background:"#e6faf9",borderRadius:20,padding:"4px 12px"}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:TEAL,display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={11} strokeWidth={2.5} color={WHITE}/></div>
                      <span style={{fontSize:12,fontWeight:500,color:TEAL}}>เปิดใช้งาน</span>
                    </div>
                    :<div style={{display:"flex",alignItems:"center",gap:6,background:BG,borderRadius:20,padding:"4px 12px"}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:"#dde2e8"}}/>
                      <span style={{fontSize:12,color:INK3}}>ปิดอยู่</span>
                    </div>
                  }
                </button>
              </div>
            </div>
            <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:18}}>
              <div style={{fontSize:14,fontWeight:500,color:INK,marginBottom:12}}>พนักงานภายใต้บังคับบัญชา ({emp.subordinates?.length||0} คน)</div>
              {(emp.subordinates||[]).map(sub=>(
                <div key={sub.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:BG,borderRadius:10,marginBottom:8}}>
                  <div style={{width:34,height:34,borderRadius:9,background:"#e6faf9",color:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500}}>{sub.firstName[0]}{sub.lastName[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:INK}}>{sub.firstName} {sub.lastName}</div>
                    <div style={{fontSize:11,color:INK3}}>{sub.empCode}</div>
                  </div>
                </div>
              ))}
              {(!emp.subordinates||emp.subordinates.length===0)&&<div style={{padding:16,textAlign:"center",color:INK3,fontSize:13}}>ยังไม่มีพนักงานภายใต้บังคับบัญชา</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Wizard ──
function AddWizard({company,depts,positions,onClose,onSave}:any){
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({
    firstName:"",lastName:"",firstNameEN:"",lastNameEN:"",nickname:"",gender:"ชาย",
    birthDate:"",nationalId:"",phone:"",email:"",address:"",
    empCode:company.code+"-",departmentId:"",positionId:"",
    contractType:"MONTHLY",hireDate:"",status:"PROBATION",
    baseSalary:"",bank:"ธนาคารกสิกรไทย",bankAccount:"",
    profileColor:"#e6faf9",profileTextColor:"#007d75",
  });
  const [errors,setErrors]=useState({} as Record<string,string>);
  const [saving,setSaving]=useState(false);

  function v1(){
    const e: Record<string,string>={};
    if(!form.firstName.trim()) e.firstName="กรอกชื่อ";
    if(!form.lastName.trim())  e.lastName="กรอกนามสกุล";
    if(!form.phone.trim())     e.phone="กรอกเบอร์โทร";
    if(!form.email.trim())     e.email="กรอกอีเมล";
    setErrors(e); return !Object.keys(e).length;
  }
  function v2(){
    const e: Record<string,string>={};
    if(!form.empCode.trim()) e.empCode="กรอกรหัสพนักงาน";
    if(!form.hireDate)       e.hireDate="เลือกวันเริ่มงาน";
    if(!form.baseSalary)     e.baseSalary="กรอกเงินเดือน";
    setErrors(e); return !Object.keys(e).length;
  }
  function next(){if(step===1&&!v1())return;if(step===2&&!v2())return;setStep(s=>s+1);}

  async function save(){
    setSaving(true);
    const payload={
      companyId:company.id,
      firstName:form.firstName,lastName:form.lastName,
      firstNameEN:form.firstNameEN||undefined,lastNameEN:form.lastNameEN||undefined,
      nickname:form.nickname||undefined,gender:form.gender,
      birthDate:form.birthDate||undefined,nationalId:form.nationalId||undefined,
      phone:form.phone,email:form.email,address:form.address||undefined,
      empCode:form.empCode,
      departmentId:form.departmentId?Number(form.departmentId):undefined,
      positionId:form.positionId?Number(form.positionId):undefined,
      contractType:form.contractType,hireDate:form.hireDate,status:form.status,
      baseSalary:Number(form.baseSalary),bank:form.bank,bankAccount:form.bankAccount||undefined,
      profileColor:form.profileColor,profileTextColor:form.profileTextColor,canApproveLeave:false,
    };
    const r:any=await apiFetch("/api/employees",{method:"POST",body:JSON.stringify(payload)});
    if(r.data) onSave(r.data as Employee);
    setSaving(false);
  }

  const pre=(form.firstName[0]||"?")+(form.lastName[0]||"?");
  const selDept=depts.find((d:any)=>String(d.id)===form.departmentId);
  const selPos=positions.find((p:any)=>String(p.id)===form.positionId);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(28,40,51,.46)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,fontFamily:F}}>
      <div style={{background:WHITE,borderRadius:20,width:560,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"16px 22px 14px",borderBottom:"1px solid #eaecef"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:15,fontWeight:500,color:INK}}>เพิ่มพนักงานใหม่ — {company.name}</div>
            <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:INK3,display:"flex"}}><X size={18} strokeWidth={1.8}/></button>
          </div>
          <div style={{display:"flex",alignItems:"center"}}>
            {[["1","ข้อมูลส่วนตัว"],["2","สัญญา และเงินเดือน"],["3","ยืนยัน"]].map(([n,lbl],i)=>{
              const done=step>i+1,active=step===i+1;
              return <div key={n} style={{display:"flex",alignItems:"center",flex:i<2?1:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,background:done||active?TEAL:"#eaecef",color:done||active?WHITE:INK3,flexShrink:0}}>{done?<Check size={11} strokeWidth={2.5}/>:n}</div>
                  <span style={{fontSize:12,fontWeight:active?500:400,color:active?INK:done?TEAL:INK3,whiteSpace:"nowrap"}}>{lbl}</span>
                </div>
                {i<=1 ? <div style={{flex:1,height:1,background:done?"#9FE1CB":"#eaecef",margin:"0 10px"}}/>:null}
              </div>
            })}
          </div>
        </div>
        <div style={{padding:"18px 22px",overflow:"auto",maxHeight:380}}>
          {step===1&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:form.profileColor,borderRadius:12,marginBottom:16}}>
                <div style={{width:42,height:42,borderRadius:12,background:"rgba(255,255,255,.35)",color:form.profileTextColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:500,flexShrink:0}}>{pre}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:500,color:INK}}>{form.firstName||"ชื่อ"} {form.lastName||"นามสกุล"}</div>
                  <div style={{fontSize:11,color:INK3}}>{form.nickname?`"${form.nickname}"`:"กรอกข้อมูล..."}</div>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",maxWidth:160}}>
                  {PROFILE_COLORS.map(([c,t])=>(
                    <div key={c} onClick={()=>setForm({...form,profileColor:c,profileTextColor:t})}
                      style={{width:22,height:22,borderRadius:6,background:c,border:form.profileColor===c?`2.5px solid ${TEAL}`:"2px solid transparent",cursor:"pointer"}}/>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <FInput label="ชื่อ (TH)" req={true} value={form.firstName} onChange={e=>{setForm({...form,firstName:e.target.value});setErrors({...errors,firstName:""}); }} error={errors.firstName}/>
                <FInput label="นามสกุล (TH)" req={true} value={form.lastName} onChange={e=>{setForm({...form,lastName:e.target.value});setErrors({...errors,lastName:""});}} error={errors.lastName}/>
                <FInput label="First Name (EN)" value={form.firstNameEN} onChange={e=>setForm({...form,firstNameEN:e.target.value})}/>
                <FInput label="Last Name (EN)" value={form.lastNameEN} onChange={e=>setForm({...form,lastNameEN:e.target.value})}/>
                <FInput label="ชื่อเล่น" value={form.nickname} onChange={e=>setForm({...form,nickname:e.target.value})}/>
                <FSelect label="เพศ" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} options={["ชาย","หญิง","ไม่ระบุ"]}/>
                <div><FL>วันเกิด</FL><MiniCalendar value={form.birthDate} onChange={v=>setForm({...form,birthDate:v})}/></div>
                <FInput label="เลขบัตรประชาชน" value={form.nationalId} onChange={e=>setForm({...form,nationalId:e.target.value})} placeholder="1-XXXX-XXXXX-XX-X"/>
                <FInput label="โทรศัพท์" req={true} value={form.phone} onChange={e=>{setForm({...form,phone:e.target.value});setErrors({...errors,phone:""}); }} error={errors.phone} placeholder="08X-XXX-XXXX"/>
                <FInput label="อีเมล" req={true} type="email" value={form.email} onChange={e=>{setForm({...form,email:e.target.value});setErrors({...errors,email:""});}} error={errors.email} placeholder="name@company.co.th"/>
                <div style={{gridColumn:"1/-1"}}><FInput label="ที่อยู่" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
              </div>
            </div>
          )}
          {step===2&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FInput label="รหัสพนักงาน" req={true} value={form.empCode} onChange={e=>{setForm({...form,empCode:e.target.value});setErrors({...errors,empCode:""});}} error={errors.empCode} placeholder={company.code+"-XXX"}/>
              <div><FL req={true}>วันเริ่มงาน</FL><MiniCalendar value={form.hireDate} onChange={v=>{setForm({...form,hireDate:v});setErrors({...errors,hireDate:""}); }} error={errors.hireDate}/></div>
              <FSelect label="แผนก" value={form.departmentId} onChange={e=>setForm({...form,departmentId:e.target.value})}
                options={[{value:"",label:"— ไม่ระบุ —"},...depts.map((d:any)=>({value:String(d.id),label:d.name}))]}/>
              <FSelect label="ตำแหน่ง" value={form.positionId} onChange={e=>setForm({...form,positionId:e.target.value})}
                options={[{value:"",label:"— ไม่ระบุ —"},...positions.map((p:any)=>({value:String(p.id),label:p.name}))]}/>
              <FSelect label="ประเภทสัญญา" value={form.contractType} onChange={e=>setForm({...form,contractType:e.target.value})}
                options={Object.entries(CONTRACT_LABELS).map(([v,l])=>({value:v,label:l}))}/>
              <FSelect label="สถานะเริ่มต้น" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}
                options={[{value:"PROBATION",label:"ทดลองงาน"},{value:"ACTIVE",label:"ทำงานอยู่"}]}/>
              <FInput label="เงินเดือนฐาน (฿/เดือน)" req={true} type="number" value={form.baseSalary} onChange={e=>{setForm({...form,baseSalary:e.target.value});setErrors({...errors,baseSalary:""}); }} error={errors.baseSalary} placeholder="0"/>
              <FSelect label="ธนาคาร" value={form.bank} onChange={e=>setForm({...form,bank:e.target.value})} options={BANK_LIST}/>
              <div style={{gridColumn:"1/-1"}}><FInput label="เลขบัญชี" value={form.bankAccount} onChange={e=>setForm({...form,bankAccount:e.target.value})} placeholder="XXX-X-XXXXX-X"/></div>
            </div>
          )}
          {step===3&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:form.profileColor,borderRadius:14,marginBottom:16}}>
                <div style={{width:48,height:48,borderRadius:13,background:"rgba(255,255,255,.35)",color:form.profileTextColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,flexShrink:0}}>{pre}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:500,color:INK}}>{form.firstName} {form.lastName}</div>
                  <div style={{fontSize:12,color:INK2}}>{selDept?.name||"—"} · {selPos?.name||"—"}</div>
                </div>
                <StatusChip status={form.status}/>
              </div>
              <div style={{background:WHITE,borderRadius:12,border:"1px solid #eaecef",overflow:"hidden"}}>
                {[
                  ["ชื่อ-สกุล",`${form.firstName} ${form.lastName}`],
                  ["รหัสพนักงาน",form.empCode],
                  ["แผนก",selDept?.name||"—"],
                  ["ตำแหน่ง",selPos?.name||"—"],
                  ["ประเภทสัญญา",CONTRACT_LABELS[form.contractType]||form.contractType],
                  ["วันเริ่มงาน",formatThai(form.hireDate)],
                  ["เงินเดือน",`${parseInt(form.baseSalary).toLocaleString()} ฿/เดือน`],
                  ["โทรศัพท์",form.phone],
                  ["อีเมล",form.email],
                ].map(([l,v],i,a)=>(
                  <div key={l} style={{display:"flex",gap:12,padding:"9px 14px",borderBottom:i<a.length-1?"1px solid #f0f2f5":"none"}}>
                    <div style={{fontSize:12,color:INK3,minWidth:120}}>{l}</div>
                    <div style={{fontSize:12,color:INK,fontWeight:500}}>{v||"—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{padding:"12px 22px",borderTop:"1px solid #eaecef",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:12,color:INK3}}>ขั้นตอนที่ {step} จาก 3</div>
          <div style={{display:"flex",gap:8}}>
            {(step>1)&&<Btn variant="ghost" onClick={()=>setStep(s=>s-1)}><ChevronLeft size={13} strokeWidth={2}/> ย้อนกลับ</Btn>}
            <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
            {(step<3)
              ?<Btn variant="teal" onClick={next}>ถัดไป <ChevronRight size={13} strokeWidth={2}/></Btn>
              :<Btn variant="primary" onClick={save} disabled={saving}><UserPlus size={13} strokeWidth={2}/> {saving?"บันทึก...":"เพิ่มพนักงาน"}</Btn>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Offboard Modal ──
function OffboardModal({emp,onClose,onConfirm}:any){
  const [type,setType]=useState("resign");
  const [reason,setReason]=useState("");
  const [lastDay,setLastDay]=useState("");
  const [confirmed,setConfirmed]=useState(false);
  return (
    <Modal title="Offboard พนักงาน" sub={`${fname(emp)} · ${emp.empCode}`} onClose={onClose} width={480}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {([{v:"resign",lbl:"ลาออก",Ic:UserMinus},{v:"terminate",lbl:"พ้นสภาพ",Ic:UserX}] as {v:string;lbl:string;Ic:React.ElementType}[]).map(({v,lbl,Ic})=>(
          <button key={v} onClick={()=>setType(v)}
            style={{flex:1,padding:"10px 14px",borderRadius:10,border:`2px solid ${type===v?CORAL:"#dde2e8"}`,background:type===v?"#fff0f0":WHITE,cursor:"pointer",fontFamily:F,fontSize:13,fontWeight:type===v?500:400,color:type===v?"#cc4444":INK2,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <Ic size={14} strokeWidth={1.8}/>{lbl}
          </button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
        <FInput label="วันสุดท้ายที่ทำงาน" req={true} value={lastDay} onChange={e=>setLastDay(e.target.value)} placeholder="เช่น 31/12/2568"/>
        <div>
          <FL>เหตุผล</FL>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder={type==="resign"?"เหตุผลการลาออก...":"เหตุผลการพ้นสภาพ..."} rows={3}
            style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK,outline:"none",resize:"vertical"}}/>
        </div>
      </div>
      <div style={{background:"#fff0f0",border:"1px solid #f5c4b3",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",gap:8}}>
        <AlertCircle size={14} strokeWidth={2} color="#cc4444" style={{flexShrink:0,marginTop:1}}/>
        <div style={{fontSize:12,color:"#cc4444"}}>การดำเนินการนี้จะเปลี่ยนสถานะพนักงาน และไม่สามารถ Run Payroll ในรอบถัดไปได้</div>
      </div>
      <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:INK2,marginBottom:16}}>
        <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} style={{width:15,height:15,accentColor:CORAL,cursor:"pointer"}}/>
        ยืนยันว่าต้องการ{type==="resign"?"บันทึกการลาออก":"พ้นสภาพ"}ของ {fname(emp)}
      </label>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #eaecef",paddingTop:14}}>
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn variant="danger" disabled={!confirmed} onClick={()=>onConfirm(reason,type)}>
          {type==="resign"?<UserMinus size={13} strokeWidth={1.8}/>:<UserX size={13} strokeWidth={1.8}/>}
          {type==="resign"?"บันทึกการลาออก":"พ้นสภาพ"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Root Page ──
export default function EmployeesPage(){
  const {user}=useAuth();
  const canEdit=user?.role==="ADMIN"||user?.role==="HR";

  const [companies,setCompanies]=useState([] as Company[]);
  const [company,setCompany]=useState(null as Company|null);
  const [emps,setEmps]=useState([] as Employee[]);
  const [depts,setDepts]=useState([] as Dept[]);
  const [positions,setPositions]=useState([] as Pos[]);
  const [selectedEmp,setSelectedEmp]=useState(null as Employee|null);
  const [offTarget,setOffTarget]=useState(null as Employee|null);
  const [loadingCos,setLoadingCos]=useState(true);
  const [loadingEmps,setLoadingEmps]=useState(false);

  useEffect(()=>{
    apiFetch("/api/companies").then((r:any)=>{
      if(r.data)setCompanies(r.data as Company[]);
    }).finally(()=>setLoadingCos(false));
  },[]);

  useEffect(()=>{
    if(!company)return;
    setLoadingEmps(true);
    Promise.all([
      apiFetch(`/api/employees?companyId=${company.id}`),
      apiFetch(`/api/companies/${company.id}/departments`),
      apiFetch(`/api/companies/${company.id}/positions`),
    ]).then(([er,dr,pr]:[any,any,any])=>{
      if(er.data)setEmps(er.data as Employee[]);
      if(dr.data)setDepts(dr.data as Dept[]);
      if(pr.data)setPositions(pr.data as Pos[]);
    }).finally(()=>setLoadingEmps(false));
  },[company?.id]);

  async function confirmOffboard(reason:string,type:string){
    if(!offTarget)return;
    const ns=type==="resign"?"RESIGNED":"TERMINATED";
    const r:any=await apiFetch(`/api/employees/${offTarget.id}`,{method:"PATCH",body:JSON.stringify({status:ns})});
    if(r.data){
      const updated={...offTarget,...r.data};
      setEmps(prev=>prev.map(e=>e.id===updated.id?updated:e));
      if(selectedEmp?.id===updated.id) setSelectedEmp(updated as Employee);
    }
    setOffTarget(null);
  }

  if(loadingCos) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:INK3,fontFamily:F,fontSize:13}}>กำลังโหลด...</div>;
  if(!company) return <CompanyPicker companies={companies} onSelect={(c:any)=>{setCompany(c);setSelectedEmp(null);}}/>;

  if(selectedEmp) return (
    <>
      <EmpProfile
        emp={selectedEmp} company={company} allEmps={emps} depts={depts} positions={positions}
        onBack={()=>setSelectedEmp(null)}
        onUpdate={(updated:any)=>{setSelectedEmp(updated);setEmps((prev:any)=>prev.map((e:any)=>e.id===updated.id?updated:e));}}
        onOffboard={(e:any)=>setOffTarget(e)}
      />
      {offTarget&&<OffboardModal emp={offTarget} onClose={()=>setOffTarget(null)} onConfirm={confirmOffboard}/>}
    </>
  );

  return (
    <>
      <EmpList
        company={company} companies={companies} emps={emps} depts={depts}
        loading={loadingEmps}
        onChangeCompany={(c:any)=>{setCompany(c);setSelectedEmp(null);setEmps([]);}}
        onViewEmp={(e:any)=>setSelectedEmp(e)}
        onAddEmp={(e:any)=>setEmps(prev=>[...prev,e])}
      />
      {offTarget&&<OffboardModal emp={offTarget} onClose={()=>setOffTarget(null)} onConfirm={confirmOffboard}/>}
    </>
  );
}
