"use client";
import { useEffect, useState, useRef } from "react";
import {
  Plus, Pencil, Trash2, Building2, Search, Download,
  SlidersHorizontal, ChevronRight, ChevronLeft, ArrowLeft,
  Check, X, Folder, FolderOpen, Award, Umbrella, HeartPulse,
  Briefcase, Baby, Users, CalendarDays, Image, ShieldCheck,
  Sparkles, Pause, MapPin, Phone, Mail, Globe, Tag, ChevronDown, Clock
} from "lucide-react";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

const TEAL="#00B4A9"; const CORAL="#FF6B6B"; const YELLOW="#FFD93D";
const BG="#F4F6F8"; const INK="#1C2833"; const INK2="#5a6a78"; const INK3="#9aaab8"; const WHITE="#fff";
const F="'Prompt','Kanit',sans-serif";

interface Dept     { id:number; name:string; _count?:{employees:number}; }
interface Pos      { id:number; name:string; }
interface Holiday  { id:number; name:string; date:string; year:number; isNational:boolean; }
interface LeaveType {
  id:number; name:string; icon:string; color:string;
  maxDaysPerYear:number|null; isPaid:boolean; requireApproval:boolean;
  isAccumulated:boolean; noLimit:boolean;
}
interface Company {
  id:number; code:string; name:string; nameTH:string; color:string; textColor:string;
  payrollCycle:string; status:string; taxId?:string; address?:string; phone?:string;
  email?:string; website?:string; logoUrl?:string; departments:Dept[]; positions:Pos[];
  _count?:{employees:number};
  otSettings?:string;
}

// ── OT Rates (Thai Labour Law) ──
interface OTRate { key:string; label:string; desc:string; multiplier:number; color:string; }
const OT_RATES:OTRate[] = [
  {key:"wd_ot",    label:"OT วันทำงาน",          desc:"ทำงานเกินเวลาปกติในวันทำงาน",              multiplier:1.5, color:"#e6f1fb"},
  {key:"off_work", label:"ทำงานในวันหยุด",        desc:"ทำงานในเวลาปกติของวันหยุด",               multiplier:1.0, color:"#faeeda"},
  {key:"off_ot",   label:"OT วันหยุด",            desc:"ทำงานเกินเวลาปกติในวันหยุด",              multiplier:3.0, color:"#fff0f0"},
  {key:"ph_work",  label:"ทำงานวันหยุดนักขัตฤกษ์",desc:"ทำงานในเวลาปกติของวันหยุดนักขัตฤกษ์",   multiplier:2.0, color:"#fbeaf0"},
  {key:"ph_ot",    label:"OT วันหยุดนักขัตฤกษ์", desc:"ทำงานเกินเวลาในวันหยุดนักขัตฤกษ์",       multiplier:3.0, color:"#fcebeb"},
];

// ── Thai National Holidays ──
const THAI_HOLIDAYS:{[y:number]:{name:string;date:string}[]} = {
  2568:[
    {name:"วันขึ้นปีใหม่",date:"2025-01-01"},{name:"วันมาฆบูชา",date:"2025-02-12"},
    {name:"วันจักรี",date:"2025-04-06"},{name:"วันสงกรานต์",date:"2025-04-13"},
    {name:"วันสงกรานต์",date:"2025-04-14"},{name:"วันสงกรานต์",date:"2025-04-15"},
    {name:"วันแรงงานแห่งชาติ",date:"2025-05-01"},{name:"วันฉัตรมงคล",date:"2025-05-04"},
    {name:"วันวิสาขบูชา",date:"2025-05-12"},{name:"วันเฉลิมพระชนมพรรษาพระราชินี",date:"2025-06-03"},
    {name:"วันอาสาฬหบูชา",date:"2025-07-10"},{name:"วันเข้าพรรษา",date:"2025-07-11"},
    {name:"วันเฉลิมพระชนมพรรษา ร.10",date:"2025-07-28"},{name:"วันแม่แห่งชาติ",date:"2025-08-12"},
    {name:"วันนวมินทรมหาราช",date:"2025-10-13"},{name:"วันปิยมหาราช",date:"2025-10-23"},
    {name:"วันพ่อแห่งชาติ",date:"2025-12-05"},{name:"วันรัฐธรรมนูญ",date:"2025-12-10"},{name:"วันสิ้นปี",date:"2025-12-31"},
  ],
  2569:[
    {name:"วันขึ้นปีใหม่",date:"2026-01-01"},{name:"วันมาฆบูชา",date:"2026-03-03"},
    {name:"วันจักรี",date:"2026-04-06"},{name:"วันสงกรานต์",date:"2026-04-13"},
    {name:"วันสงกรานต์",date:"2026-04-14"},{name:"วันสงกรานต์",date:"2026-04-15"},
    {name:"วันแรงงานแห่งชาติ",date:"2026-05-01"},{name:"วันฉัตรมงคล",date:"2026-05-04"},
    {name:"วันวิสาขบูชา",date:"2026-05-31"},{name:"วันเฉลิมพระชนมพรรษาพระราชินี",date:"2026-06-03"},
    {name:"วันอาสาฬหบูชา",date:"2026-07-29"},{name:"วันเข้าพรรษา",date:"2026-07-30"},
    {name:"วันเฉลิมพระชนมพรรษา ร.10",date:"2026-07-28"},{name:"วันแม่แห่งชาติ",date:"2026-08-12"},
    {name:"วันนวมินทรมหาราช",date:"2026-10-13"},{name:"วันปิยมหาราช",date:"2026-10-23"},
    {name:"วันพ่อแห่งชาติ",date:"2026-12-05"},{name:"วันรัฐธรรมนูญ",date:"2026-12-10"},{name:"วันสิ้นปี",date:"2026-12-31"},
  ],
  2570:[
    {name:"วันขึ้นปีใหม่",date:"2027-01-01"},{name:"วันมาฆบูชา",date:"2027-02-21"},
    {name:"วันจักรี",date:"2027-04-06"},{name:"วันสงกรานต์",date:"2027-04-13"},
    {name:"วันสงกรานต์",date:"2027-04-14"},{name:"วันสงกรานต์",date:"2027-04-15"},
    {name:"วันแรงงานแห่งชาติ",date:"2027-05-01"},{name:"วันฉัตรมงคล",date:"2027-05-04"},
    {name:"วันวิสาขบูชา",date:"2027-05-20"},{name:"วันเฉลิมพระชนมพรรษาพระราชินี",date:"2027-06-03"},
    {name:"วันอาสาฬหบูชา",date:"2027-07-19"},{name:"วันเข้าพรรษา",date:"2027-07-20"},
    {name:"วันเฉลิมพระชนมพรรษา ร.10",date:"2027-07-28"},{name:"วันแม่แห่งชาติ",date:"2027-08-12"},
    {name:"วันนวมินทรมหาราช",date:"2027-10-13"},{name:"วันปิยมหาราช",date:"2027-10-23"},
    {name:"วันพ่อแห่งชาติ",date:"2027-12-05"},{name:"วันรัฐธรรมนูญ",date:"2027-12-10"},{name:"วันสิ้นปี",date:"2027-12-31"},
  ],
};

const DEFAULT_LEAVE_TYPES = [
  {name:"ลาป่วย",icon:"HeartPulse",color:"#fff0f0",maxDaysPerYear:30,isPaid:true,requireApproval:false,isAccumulated:false,noLimit:false},
  {name:"ลากิจ",icon:"Briefcase",color:"#e6f1fb",maxDaysPerYear:3,isPaid:false,requireApproval:true,isAccumulated:false,noLimit:false},
  {name:"ลาพักร้อน",icon:"Umbrella",color:"#e6faf9",maxDaysPerYear:10,isPaid:true,requireApproval:true,isAccumulated:true,noLimit:false},
  {name:"ลาคลอด",icon:"Baby",color:"#fbeaf0",maxDaysPerYear:98,isPaid:true,requireApproval:true,isAccumulated:false,noLimit:false},
];

const TH_MONTHS=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const TH_DAYS=["อา","จ","อ","พ","พฤ","ศ","ส"];
function formatThai(iso:string){ const d=new Date(iso); return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear()+543}`; }
const CO_COLORS:[string,string][]=[["#fff0f0","#cc4444"],["#e6faf9","#007d75"],["#eeedfe","#534ab7"],["#faeeda","#854f0b"],["#e6f1fb","#185fa5"],["#fbeaf0","#993556"],["#EAF3DE","#3B6D11"],["#f4f6f8","#5a6a78"]];
const CYCLES=["สิ้นเดือน","วันที่ 25","วันที่ 28","วันที่ 15","ทุก 2 สัปดาห์"];
const LEAVE_ICON_MAP:Record<string,React.ElementType>={Umbrella,HeartPulse,Briefcase,Baby,Users,Award,CalendarDays};
const LEAVE_COLORS=["#e6faf9","#fff0f0","#e6f1fb","#fbeaf0","#eeedfe","#faeeda","#EAF3DE","#f4f6f8"];

function Dot({color,size=9}:{color:string;size?:number}){
  return <span style={{width:size,height:size,borderRadius:"50%",background:color,display:"inline-block",flexShrink:0}}/>;
}
function StatusBadge({status}:{status:string}){
  const m:Record<string,{bg:string;color:string;label:string}>={
    ACTIVE:{bg:"#e6faf9",color:"#007d75",label:"ใช้งาน"},
    INACTIVE:{bg:"#fff4e0",color:"#b36b00",label:"พักใช้งาน"},
  };
  const s=m[status]||m.INACTIVE;
  return <span style={{background:s.bg,color:s.color,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:500}}>{s.label}</span>;
}
function Btn({children,onClick,variant="ghost",disabled=false,style:sx={}}:{children:React.ReactNode;onClick?:()=>void;variant?:string;disabled?:boolean;style?:React.CSSProperties}){
  const v:Record<string,React.CSSProperties>={
    primary:{background:CORAL,color:WHITE,border:"none"},
    teal:{background:TEAL,color:WHITE,border:"none"},
    ghost:{background:"transparent",color:INK2,border:"1px solid #dde2e8"},
    danger:{background:"#fff0f0",color:"#cc4444",border:"1px solid #f5c4b3"},
  };
  return <button onClick={disabled?undefined:onClick} disabled={disabled}
    style={{display:"inline-flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:500,cursor:disabled?"default":"pointer",border:"none",fontFamily:F,opacity:disabled?.45:1,...(v[variant]||v.ghost),...sx}}>
    {children}
  </button>;
}
function IBtn({Icon,onClick,label}:{Icon:React.ElementType;onClick?:()=>void;label?:string}){
  return <button aria-label={label} onClick={onClick}
    style={{width:28,height:28,borderRadius:7,background:"transparent",border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:INK3,fontFamily:F}}>
    <Icon size={13} strokeWidth={1.8}/>
  </button>;
}
function FI({label,value,onChange,placeholder,req=false,type="text"}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;req?:boolean;type?:string}){
  return <div>
    <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>{label}{req&&<span style={{color:CORAL}}> *</span>}</div>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none",background:WHITE}}/>
  </div>;
}
function Modal({title,onClose,children,width=520}:{title:string;onClose:()=>void;children:React.ReactNode;width?:number}){
  return <div style={{position:"fixed",inset:0,background:"rgba(28,40,51,.46)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,fontFamily:F}}>
    <div style={{background:WHITE,borderRadius:16,width,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #eaecef"}}>
        <div style={{fontSize:15,fontWeight:500,color:INK}}>{title}</div>
        <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:INK3,display:"flex"}}><X size={18} strokeWidth={1.8}/></button>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"18px 20px"}}>{children}</div>
    </div>
  </div>;
}

// ── MiniCalendar ──
function MiniCalendar({value,onChange}:{value:string;onChange:(v:string)=>void}){
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
  return <div ref={ref} style={{position:"relative",flex:1}}>
    <button type="button" onClick={()=>setOpen(o=>!o)}
      style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,padding:"8px 12px",borderRadius:8,border:`1px solid ${open?TEAL:"#dde2e8"}`,fontFamily:F,background:WHITE,color:value?INK:INK3,cursor:"pointer",outline:"none",boxSizing:"border-box"}}>
      <span style={{display:"flex",alignItems:"center",gap:7}}>
        <CalendarDays size={14} strokeWidth={1.8} color={value?TEAL:INK3}/>
        {value?formatThai(value):"เลือกวันที่"}
      </span>
      <ChevronDown size={13} strokeWidth={1.8} color={INK3} style={{transform:open?"rotate(180deg)":"none",transition:"transform .15s"}}/>
    </button>
    {open&&<div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:200,background:WHITE,borderRadius:14,border:"1px solid #dde2e8",padding:"12px 14px",width:248,boxShadow:"0 4px 16px rgba(28,40,51,.12)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button type="button" onClick={()=>{if(vm===0){setVm(11);setVy(y=>y-1);}else setVm(m=>m-1);}} style={{background:"transparent",border:"none",cursor:"pointer",color:INK2,display:"flex",padding:4,borderRadius:6}}><ChevronLeft size={15} strokeWidth={2}/></button>
        <span style={{fontSize:13,fontWeight:500,color:INK,fontFamily:F}}>{TH_MONTHS[vm]} {vy+543}</span>
        <button type="button" onClick={()=>{if(vm===11){setVm(0);setVy(y=>y+1);}else setVm(m=>m+1);}} style={{background:"transparent",border:"none",cursor:"pointer",color:INK2,display:"flex",padding:4,borderRadius:6}}><ChevronRight size={15} strokeWidth={2}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
        {TH_DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:INK3,padding:"2px 0",fontFamily:F}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((d,i)=>{
          const sel=selD&&d&&selD.getFullYear()===vy&&selD.getMonth()===vm&&selD.getDate()===d;
          const tod=d&&today.getFullYear()===vy&&today.getMonth()===vm&&today.getDate()===d;
          return <button key={i} type="button" onClick={()=>pick(d)}
            style={{height:28,borderRadius:7,border:"none",cursor:d?"pointer":"default",background:sel?TEAL:tod?"#e6faf9":"transparent",color:sel?WHITE:tod?TEAL:d?INK:"transparent",fontSize:12,fontFamily:F,fontWeight:sel||tod?500:400}}>
            {d||""}
          </button>;
        })}
      </div>
      <div style={{marginTop:10,paddingTop:8,borderTop:"1px solid #eaecef",display:"flex",justifyContent:"center"}}>
        <button type="button" onClick={()=>{const t=new Date();setVy(t.getFullYear());setVm(t.getMonth());pick(t.getDate());}}
          style={{fontSize:11,color:TEAL,background:"transparent",border:"none",cursor:"pointer",fontFamily:F,fontWeight:500}}>วันนี้</button>
      </div>
    </div>}
  </div>;
}

// ── Logo Avatar ──
function CompanyLogo({co,size=44,fontSize=14}:{co:Company;size?:number;fontSize?:number}){
  if(co.logoUrl) return <img src={co.logoUrl} alt={co.code}
    style={{width:size,height:size,borderRadius:Math.round(size*0.27),objectFit:"cover",flexShrink:0}}/>;
  return <div style={{width:size,height:size,borderRadius:Math.round(size*0.27),background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize,fontWeight:600,flexShrink:0}}>{co.code}</div>;
}

// ════════════════════════════════════════
//  COMPANY LIST
// ════════════════════════════════════════
function CompanyList({onSelect,canEdit}:{onSelect:(c:Company)=>void;canEdit:boolean}){
  const [companies,setCompanies]=useState<Company[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [addStep,setAddStep]=useState(1);
  const [addForm,setAddForm]=useState({name:"",nameTH:"",code:"",taxId:"",payrollCycle:"สิ้นเดือน",address:"",phone:"",email:"",website:"",color:"#e6faf9",textColor:"#007d75"});
  const [addErrors,setAddErrors]=useState<Record<string,string>>({});
  const [saving,setSaving]=useState(false);
  const [presetYear,setPresetYear]=useState(2568);
  const [selectedH,setSelectedH]=useState<Set<number>>(new Set(THAI_HOLIDAYS[2568].map((_,i)=>i)));
  const [showDeleteConfirm,setShowDeleteConfirm]=useState<Company|null>(null);

  useEffect(()=>{
    apiFetch<Company[]>("/api/companies").then(r=>{if(r.data)setCompanies(r.data);}).finally(()=>setLoading(false));
  },[]);

  function changePresetYear(y:number){
    setPresetYear(y);
    setSelectedH(new Set((THAI_HOLIDAYS[y]||[]).map((_,i)=>i)));
  }
  function toggleH(i:number){setSelectedH(prev=>{const n=new Set(prev);n.has(i)?n.delete(i):n.add(i);return n;});}

  function validateStep1(){
    const e:Record<string,string>={};
    if(!addForm.name.trim()) e.name="กรุณากรอกชื่อบริษัท (EN)";
    if(!addForm.code.trim()) e.code="กรุณากรอกรหัสย่อ";
    else if(addForm.code.length>4) e.code="รหัสย่อไม่เกิน 4 ตัวอักษร";
    setAddErrors(e); return Object.keys(e).length===0;
  }
  function handleNext(){ if(addStep===1&&!validateStep1())return; setAddStep(s=>s+1); }

  async function saveCompany(){
    setSaving(true);
    const r=await apiFetch<Company>("/api/companies",{method:"POST",body:JSON.stringify(addForm)});
    if(r.data){
      const holidays=(THAI_HOLIDAYS[presetYear]||[]).filter((_,i)=>selectedH.has(i));
      for(const h of holidays){
        await apiFetch(`/api/companies/${r.data.id}/holidays`,{method:"POST",body:JSON.stringify({
          name:h.name,date:h.date,isNational:true,year:new Date(h.date).getFullYear()+543
        })});
      }
      setCompanies(cs=>[...cs,r.data!]);
      setShowAdd(false); setAddStep(1);
      setAddForm({name:"",nameTH:"",code:"",taxId:"",payrollCycle:"สิ้นเดือน",address:"",phone:"",email:"",website:"",color:"#e6faf9",textColor:"#007d75"});
    }
    setSaving(false);
  }

  async function deleteCompany(co:Company){
    await apiFetch(`/api/companies/${co.id}`,{method:"DELETE"});
    setCompanies(cs=>cs.filter(c=>c.id!==co.id));
    setShowDeleteConfirm(null);
  }

  const filtered=companies.filter(c=>
    c.name.toLowerCase().includes(search.toLowerCase())||
    c.nameTH?.includes(search)||c.code.toLowerCase().includes(search.toLowerCase())
  );
  const STEP_LABELS=["ข้อมูลพื้นฐาน","ที่อยู่ & ติดต่อ","วันหยุด","ยืนยัน"];
  const selColor=CO_COLORS.find(([bg])=>bg===addForm.color)||CO_COLORS[1];

  return (
    <div style={{fontFamily:F,padding:"28px 32px",background:BG,minHeight:"100vh"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontSize:20,fontWeight:600,color:INK}}>บริษัทในระบบ</div>
          <div style={{fontSize:12,color:INK3,marginTop:2}}>จัดการบริษัท โครงสร้างองค์กร และวันหยุด</div>
        </div>
        {canEdit&&<Btn variant="primary" onClick={()=>{setShowAdd(true);setAddStep(1);}}><Plus size={14} strokeWidth={2.5}/> เพิ่มบริษัทใหม่</Btn>}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[[String(companies.length),"บริษัททั้งหมด",TEAL],[String(companies.reduce((s,c)=>s+(c._count?.employees||0),0)),"พนักงานรวม",CORAL],[String(companies.filter(c=>c.status==="ACTIVE").length),"บริษัท Active","#3B6D11"],[String(companies.filter(c=>c.status==="INACTIVE").length),"พักใช้งาน",INK3]].map(([n,l,c])=>(
          <div key={l} style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:"14px 16px"}}>
            <div style={{fontSize:26,fontWeight:500,color:c,lineHeight:1}}>{n}</div>
            <div style={{fontSize:12,color:INK3,marginTop:4}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:WHITE,border:"1px solid #dde2e8",borderRadius:10,padding:"0 12px",height:38}}>
          <Search size={14} strokeWidth={1.8} color={INK3}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อบริษัท หรือ Tax ID..."
            style={{border:"none",background:"transparent",outline:"none",fontSize:13,color:INK,fontFamily:F,flex:1}}/>
        </div>
        <Btn variant="ghost"><SlidersHorizontal size={14} strokeWidth={1.8}/> กรอง</Btn>
        <Btn variant="ghost"><Download size={14} strokeWidth={1.8}/> Export</Btn>
      </div>

      {/* Table */}
      <div style={{background:WHITE,borderRadius:16,border:"1px solid #eaecef",overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,tableLayout:"fixed"}}>
          <thead><tr style={{background:BG}}>
            {[["ชื่อบริษัท","34%"],["Tax ID","15%"],["พนักงาน","10%"],["รอบเงินเดือน","13%"],["สถานะ","13%"],["จัดการ","15%"]].map(([h,w])=>(
              <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,color:INK3,fontWeight:500,width:w}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading&&<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:INK3,fontSize:13}}>กำลังโหลด...</td></tr>}
            {filtered.map(co=>(
              <tr key={co.id} onClick={()=>onSelect(co)}
                style={{borderTop:"1px solid #f0f2f5",cursor:"pointer"}}
                onMouseEnter={e=>(e.currentTarget.style.background="#fafbfc")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                <td style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <CompanyLogo co={co} size={34} fontSize={12}/>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:500,color:INK,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{co.name}</div>
                      <div style={{fontSize:11,color:INK3}}>{co.nameTH}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding:"12px 14px",color:INK2,fontSize:12}}>{co.taxId||"—"}</td>
                <td style={{padding:"12px 14px",fontWeight:500,color:INK}}>{co._count?.employees??0}<span style={{fontSize:11,fontWeight:400,color:INK3}}> คน</span></td>
                <td style={{padding:"12px 14px",color:INK2,fontSize:12}}>{co.payrollCycle}</td>
                <td style={{padding:"12px 14px"}}><StatusBadge status={co.status}/></td>
                <td style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                    <IBtn Icon={Pencil} label="แก้ไข" onClick={()=>onSelect(co)}/>
                    {canEdit&&<IBtn Icon={Trash2} label="ลบ" onClick={()=>setShowDeleteConfirm(co)}/>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading&&filtered.length===0&&<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:INK3,fontSize:13}}>ไม่พบข้อมูลบริษัท</td></tr>}
          </tbody>
        </table>
        <div style={{padding:"10px 16px",borderTop:"1px solid #f0f2f5",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:INK3}}>แสดง {filtered.length} จาก {companies.length} บริษัท</span>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm&&(
        <Modal title="ยืนยันการลบบริษัท" onClose={()=>setShowDeleteConfirm(null)} width={420}>
          <div style={{textAlign:"center",padding:"8px 0 20px"}}>
            <div style={{width:56,height:56,borderRadius:14,background:"#fff0f0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
              <Trash2 size={24} strokeWidth={1.8} color="#cc4444"/>
            </div>
            <div style={{fontSize:15,fontWeight:500,color:INK,marginBottom:8}}>ลบ {showDeleteConfirm.name}?</div>
            <div style={{fontSize:13,color:INK3}}>ข้อมูลบริษัท แผนก ตำแหน่ง และวันหยุดทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้</div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #eaecef",paddingTop:14}}>
            <Btn variant="ghost" onClick={()=>setShowDeleteConfirm(null)}>ยกเลิก</Btn>
            <Btn variant="danger" onClick={()=>deleteCompany(showDeleteConfirm)}><Trash2 size={13} strokeWidth={2}/> ลบถาวร</Btn>
          </div>
        </Modal>
      )}

      {/* Add Company Wizard */}
      {showAdd&&(
        <Modal title="เพิ่มบริษัทใหม่" onClose={()=>{setShowAdd(false);setAddStep(1);}} width={580}>
          {/* Step indicator */}
          <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:20,padding:"0 2px"}}>
            {STEP_LABELS.map((label,i)=>{
              const done=addStep>i+1; const active=addStep===i+1;
              return <div key={label} style={{display:"flex",alignItems:"center",flex:i<3?1:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,background:done||active?TEAL:"#eaecef",color:done||active?WHITE:INK3,flexShrink:0}}>
                    {done?<Check size={12} strokeWidth={2.5}/>:String(i+1)}
                  </div>
                  <span style={{fontSize:12,fontWeight:active?500:400,color:active?INK:done?TEAL:INK3,whiteSpace:"nowrap"}}>{label}</span>
                </div>
                {i<3&&<div style={{flex:1,height:1,background:done?"#9FE1CB":"#eaecef",margin:"0 10px"}}/>}
              </div>;
            })}
          </div>

          {/* Step 1 */}
          {addStep===1&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:addForm.color,borderRadius:12,marginBottom:18}}>
                <div style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,.3)",color:addForm.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600}}>{(addForm.code||"??").toUpperCase().slice(0,4)}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:500,color:INK}}>{addForm.name||"ชื่อบริษัท (EN)"}</div>
                  <div style={{fontSize:12,color:INK2,marginTop:1}}>{addForm.nameTH||"ชื่อบริษัท (TH)"}</div>
                </div>
                <StatusBadge status="INACTIVE"/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <FI label="ชื่อบริษัท (ภาษาไทย)" value={addForm.nameTH} onChange={v=>setAddForm({...addForm,nameTH:v})} placeholder="เช่น อัลฟ่า กรุ๊ป จำกัด"/>
                <FI label="ชื่อบริษัท (English)" value={addForm.name} onChange={v=>{setAddForm({...addForm,name:v});setAddErrors({...addErrors,name:""});}} req placeholder="เช่น Alpha Group Co., Ltd."/>
                {addErrors.name&&<div style={{fontSize:11,color:"#cc4444",marginTop:-10}}>{addErrors.name}</div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div>
                    <FI label="รหัสย่อ (สูงสุด 4 ตัว)" value={addForm.code} onChange={v=>{setAddForm({...addForm,code:v.toUpperCase().slice(0,4)});setAddErrors({...addErrors,code:""});}} req placeholder="เช่น AG, BB"/>
                    {addErrors.code&&<div style={{fontSize:11,color:"#cc4444",marginTop:3}}>{addErrors.code}</div>}
                  </div>
                  <div>
                    <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>รอบจ่ายเงินเดือน</div>
                    <select value={addForm.payrollCycle} onChange={e=>setAddForm({...addForm,payrollCycle:e.target.value})}
                      style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
                      {CYCLES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <FI label="เลขนิติบุคคล (Tax ID)" value={addForm.taxId} onChange={v=>setAddForm({...addForm,taxId:v})} placeholder="0105560000000"/>
                <div>
                  <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>สีประจำบริษัท</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {CO_COLORS.map(([bg,tc])=>(
                      <button key={bg} type="button" onClick={()=>setAddForm({...addForm,color:bg,textColor:tc})}
                        style={{width:32,height:32,borderRadius:8,background:bg,border:addForm.color===bg?`2.5px solid ${TEAL}`:"2px solid #eaecef",cursor:"pointer"}}/>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {addStep===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <FI label="ที่อยู่บริษัท" value={addForm.address} onChange={v=>setAddForm({...addForm,address:v})} placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <FI label="โทรศัพท์" value={addForm.phone} onChange={v=>setAddForm({...addForm,phone:v})} placeholder="02-xxx-xxxx"/>
                <FI label="อีเมล HR" value={addForm.email} onChange={v=>setAddForm({...addForm,email:v})} type="email" placeholder="hr@company.co.th"/>
                <FI label="เว็บไซต์" value={addForm.website} onChange={v=>setAddForm({...addForm,website:v})} placeholder="www.company.co.th"/>
              </div>
              <div style={{background:"#e6faf9",border:"1px solid #9FE1CB",borderRadius:10,padding:"10px 14px",display:"flex",gap:8,alignItems:"flex-start"}}>
                <Check size={14} strokeWidth={2} color={TEAL} style={{flexShrink:0,marginTop:1}}/>
                <div style={{fontSize:12,color:"#007d75"}}>ข้อมูลที่อยู่และติดต่อสามารถแก้ไขเพิ่มเติมได้ภายหลัง ไม่บังคับกรอกตอนนี้</div>
              </div>
            </div>
          )}

          {/* Step 3 — Holiday preset */}
          {addStep===3&&(
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:500,color:INK}}>วันหยุดนักขัตฤกษ์ไทย</div>
                  <div style={{fontSize:12,color:INK3,marginTop:2}}>เลือกปีและติ๊กวันหยุดที่ต้องการใช้</div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  {([2568,2569,2570] as number[]).map(y=>(
                    <button key={y} type="button" onClick={()=>changePresetYear(y)}
                      style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${presetYear===y?TEAL:"#dde2e8"}`,background:presetYear===y?"#e6faf9":WHITE,color:presetYear===y?TEAL:INK2,fontSize:12,fontWeight:presetYear===y?500:400,cursor:"pointer",fontFamily:F}}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:BG,borderRadius:9,marginBottom:10}}>
                <div style={{fontSize:12,color:INK2}}>เลือกแล้ว <span style={{fontWeight:500,color:TEAL}}>{selectedH.size}</span> จาก {(THAI_HOLIDAYS[presetYear]||[]).length} วัน</div>
                <div style={{display:"flex",gap:8}}>
                  <button type="button" onClick={()=>setSelectedH(new Set((THAI_HOLIDAYS[presetYear]||[]).map((_,i)=>i)))} style={{fontSize:12,color:TEAL,background:"transparent",border:"none",cursor:"pointer",fontFamily:F,fontWeight:500}}>เลือกทั้งหมด</button>
                  <span style={{color:INK3}}>·</span>
                  <button type="button" onClick={()=>setSelectedH(new Set())} style={{fontSize:12,color:INK3,background:"transparent",border:"none",cursor:"pointer",fontFamily:F}}>ยกเลิกทั้งหมด</button>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:280,overflowY:"auto",paddingRight:4}}>
                {(THAI_HOLIDAYS[presetYear]||[]).map((h,i)=>{
                  const checked=selectedH.has(i);
                  return <label key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:checked?"#f0faf8":WHITE,borderRadius:10,border:`1px solid ${checked?"#9FE1CB":"#eaecef"}`,cursor:"pointer",transition:"all .1s"}}>
                    <input type="checkbox" checked={checked} onChange={()=>toggleH(i)} style={{width:16,height:16,accentColor:TEAL,cursor:"pointer",flexShrink:0}}/>
                    <Dot color={checked?TEAL:"#dde2e8"} size={8}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:checked?INK:INK3}}>{h.name}</div>
                      <div style={{fontSize:11,color:INK3,marginTop:1}}>{formatThai(h.date)}</div>
                    </div>
                    {checked&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"#e6faf9",color:"#007d75",fontWeight:500,flexShrink:0}}>นักขัตฤกษ์</span>}
                  </label>;
                })}
              </div>
            </div>
          )}

          {/* Step 4 — Confirm */}
          {addStep===4&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:addForm.color,borderRadius:14,marginBottom:18}}>
                <div style={{width:56,height:56,borderRadius:16,background:"rgba(255,255,255,.4)",color:addForm.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:600}}>{(addForm.code||"??").toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:500,color:INK}}>{addForm.name}</div>
                  <div style={{fontSize:13,color:INK2,marginTop:1}}>{addForm.nameTH}</div>
                  <div style={{fontSize:11,color:INK3,marginTop:3}}>Tax: {addForm.taxId||"—"} · รอบ: {addForm.payrollCycle}</div>
                </div>
                <StatusBadge status="INACTIVE"/>
              </div>
              <div style={{background:WHITE,borderRadius:12,border:"1px solid #eaecef",overflow:"hidden",marginBottom:14}}>
                {[["ชื่อ (TH)",addForm.nameTH],["ชื่อ (EN)",addForm.name],["เลขนิติบุคคล",addForm.taxId],["รหัสย่อ",addForm.code],["รอบเงินเดือน",addForm.payrollCycle],...(addForm.address?[["ที่อยู่",addForm.address]]:[]),(["วันหยุดที่เลือก",`${selectedH.size} วัน (ปี ${presetYear})`] as [string,string])].map(([l,v],i,arr)=>(
                  <div key={l} style={{display:"flex",gap:12,padding:"10px 14px",borderBottom:i<arr.length-1?"1px solid #f0f2f5":"none",background:l==="วันหยุดที่เลือก"?"#f0faf8":"transparent"}}>
                    <div style={{fontSize:12,color:INK3,minWidth:130}}>{l}</div>
                    <div style={{fontSize:12,color:l==="วันหยุดที่เลือก"?TEAL:INK,fontWeight:500}}>{v||"—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid #eaecef",paddingTop:14,marginTop:16}}>
            <span style={{fontSize:12,color:INK3}}>ขั้นตอนที่ {addStep} จาก 4</span>
            <div style={{display:"flex",gap:8}}>
              {addStep>1&&<Btn variant="ghost" onClick={()=>setAddStep(s=>s-1)}><ChevronLeft size={13} strokeWidth={2}/> ย้อนกลับ</Btn>}
              <Btn variant="ghost" onClick={()=>{setShowAdd(false);setAddStep(1);}}>ยกเลิก</Btn>
              {addStep<4
                ?<Btn variant="teal" onClick={handleNext}>ถัดไป <ChevronRight size={13} strokeWidth={2}/></Btn>
                :<Btn variant="primary" onClick={saveCompany} disabled={saving}><Check size={13} strokeWidth={2.5}/> {saving?"กำลังบันทึก...":"เพิ่มบริษัท"}</Btn>
              }
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════
//  COMPANY DETAIL
// ════════════════════════════════════════
function CompanyDetail({company:initCo,onBack,canEdit}:{company:Company;onBack:()=>void;canEdit:boolean}){
  const [co,setCo]=useState<Company>(initCo);
  const [tab,setTab]=useState<"info"|"dept"|"holiday"|"leave"|"ot">("info");
  const [depts,setDepts]=useState<Dept[]>([]);
  const [positions,setPositions]=useState<Pos[]>([]);
  const [holidays,setHolidays]=useState<Holiday[]>([]);
  const [leaveTypes,setLeaveTypes]=useState<LeaveType[]>([]);
  const [hYear,setHYear]=useState(new Date().getFullYear()+543);
  const [modal,setModal]=useState<string|null>(null);

  // Info edit form — full fields
  const [infoForm,setInfoForm]=useState({
    nameTH:co.nameTH,name:co.name,taxId:co.taxId||"",payrollCycle:co.payrollCycle,
    address:co.address||"",phone:co.phone||"",email:co.email||"",website:co.website||"",
    code:co.code,color:co.color,textColor:co.textColor,status:co.status,
  });

  // Dept/Pos inline edit
  const [deptInput,setDeptInput]=useState("");
  const [posInput,setPosInput]=useState("");
  const [editDept,setEditDept]=useState<Dept|null>(null);
  const [editDeptVal,setEditDeptVal]=useState("");

  // Holiday
  const [showAddH,setShowAddH]=useState(false);
  const [newH,setNewH]=useState({name:"",date:"",isNational:true});

  // Leave Type
  const [showAddLT,setShowAddLT]=useState(false);
  const [editLT,setEditLT]=useState<LeaveType|null>(null);
  const [ltForm,setLtForm]=useState({name:"",icon:"Umbrella",color:"#e6faf9",maxDaysPerYear:"",isPaid:true,requireApproval:true,isAccumulated:false,noLimit:false});

  // OT settings
  const [otEnabled,setOtEnabled]=useState<Record<string,boolean>>(()=>{
    try{ const s=co.otSettings; return s?JSON.parse(s as string):{wd_ot:true,off_work:true,off_ot:true,ph_work:true,ph_ot:true}; }catch{ return {wd_ot:true,off_work:true,off_ot:true,ph_work:true,ph_ot:true}; }
  });
  const [otSaving,setOtSaving]=useState(false);
  async function saveOtSettings(){
    setOtSaving(true);
    await apiFetch(`/api/companies/${co.id}`,{method:"PATCH",body:JSON.stringify({otSettings:JSON.stringify(otEnabled)})});
    setCo(prev=>({...prev,otSettings:JSON.stringify(otEnabled)}));
    setOtSaving(false);
  }

  // Logo upload
  const logoRef=useRef<HTMLInputElement>(null);
  const [logoPreview,setLogoPreview]=useState<string|null>(co.logoUrl||null);

  useEffect(()=>{
    apiFetch<Dept[]>(`/api/companies/${co.id}/departments`).then(r=>{if(r.data)setDepts(r.data);});
    apiFetch<Pos[]>(`/api/companies/${co.id}/positions`).then(r=>{if(r.data)setPositions(r.data);});
  },[co.id]);
  useEffect(()=>{
    if(tab==="holiday") apiFetch<Holiday[]>(`/api/companies/${co.id}/holidays?year=${hYear}`).then(r=>{if(r.data)setHolidays(r.data);});
    if(tab==="leave")   apiFetch<LeaveType[]>(`/api/companies/${co.id}/leave-types`).then(r=>{if(r.data)setLeaveTypes(r.data);});
  },[tab,hYear,co.id]);

  async function saveInfo(){
    const r=await apiFetch<Company>(`/api/companies/${co.id}`,{method:"PATCH",body:JSON.stringify(infoForm)});
    if(r.data){setCo({...co,...r.data});setModal(null);}
  }
  async function addDept(){ const r=await apiFetch<Dept>(`/api/companies/${co.id}/departments`,{method:"POST",body:JSON.stringify({name:deptInput.trim()})}); if(r.data){setDepts([...depts,r.data]);setDeptInput("");} }
  async function saveDept(){ const r=await apiFetch<Dept>(`/api/companies/${co.id}/departments/${editDept!.id}`,{method:"PATCH",body:JSON.stringify({name:editDeptVal.trim()})}); if(r.data){setDepts(depts.map(d=>d.id===r.data!.id?r.data!:d));setEditDept(null);} }
  async function delDept(d:Dept){ await apiFetch(`/api/companies/${co.id}/departments/${d.id}`,{method:"DELETE"}); setDepts(depts.filter(x=>x.id!==d.id)); }
  async function addPos(){ const r=await apiFetch<Pos>(`/api/companies/${co.id}/positions`,{method:"POST",body:JSON.stringify({name:posInput.trim()})}); if(r.data){setPositions([...positions,r.data]);setPosInput("");} }
  async function delPos(p:Pos){ await apiFetch(`/api/companies/${co.id}/positions/${p.id}`,{method:"DELETE"}); setPositions(positions.filter(x=>x.id!==p.id)); }
  async function addHoliday(){ const r=await apiFetch<Holiday>(`/api/companies/${co.id}/holidays`,{method:"POST",body:JSON.stringify({...newH,year:new Date(newH.date).getFullYear()+543})}); if(r.data){setHolidays([...holidays,r.data].sort((a,b)=>a.date.localeCompare(b.date)));setNewH({name:"",date:"",isNational:true});setShowAddH(false);} }
  async function delHoliday(h:Holiday){ await apiFetch(`/api/companies/${co.id}/holidays/${h.id}`,{method:"DELETE"}); setHolidays(holidays.filter(x=>x.id!==h.id)); }

  function openAddLT(){ setLtForm({name:"",icon:"Umbrella",color:"#e6faf9",maxDaysPerYear:"",isPaid:true,requireApproval:true,isAccumulated:false,noLimit:false}); setEditLT(null); setShowAddLT(true); }
  function openEditLT(lt:LeaveType){ setLtForm({name:lt.name,icon:lt.icon,color:lt.color,maxDaysPerYear:lt.maxDaysPerYear?.toString()||"",isPaid:lt.isPaid,requireApproval:lt.requireApproval,isAccumulated:lt.isAccumulated,noLimit:lt.noLimit}); setEditLT(lt); setShowAddLT(true); }
  async function saveLT(){
    const payload={...ltForm,maxDaysPerYear:ltForm.noLimit?null:(ltForm.maxDaysPerYear?Number(ltForm.maxDaysPerYear):null)};
    if(editLT){ const r=await apiFetch<LeaveType>(`/api/companies/${co.id}/leave-types/${editLT.id}`,{method:"PATCH",body:JSON.stringify(payload)}); if(r.data){setLeaveTypes(leaveTypes.map(lt=>lt.id===r.data!.id?r.data!:lt));setShowAddLT(false);} }
    else { const r=await apiFetch<LeaveType>(`/api/companies/${co.id}/leave-types`,{method:"POST",body:JSON.stringify(payload)}); if(r.data){setLeaveTypes([...leaveTypes,r.data]);setShowAddLT(false);} }
  }
  async function delLT(lt:LeaveType){ await apiFetch(`/api/companies/${co.id}/leave-types/${lt.id}`,{method:"DELETE"}); setLeaveTypes(leaveTypes.filter(x=>x.id!==lt.id)); }
  async function addDefaultLTs(){ const results=[]; for(const lt of DEFAULT_LEAVE_TYPES){ const r=await apiFetch<LeaveType>(`/api/companies/${co.id}/leave-types`,{method:"POST",body:JSON.stringify(lt)}); if(r.data)results.push(r.data); } setLeaveTypes([...leaveTypes,...results]); }

  function handleLogoChange(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file)return;
    const img=document.createElement("img");
    const url=URL.createObjectURL(file);
    img.onload=async()=>{
      const MAX=256;
      const scale=Math.min(1,MAX/Math.max(img.width,img.height));
      const canvas=document.createElement("canvas");
      canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
      canvas.getContext("2d")!.drawImage(img,0,0,canvas.width,canvas.height);
      const base64=canvas.toDataURL("image/jpeg",0.85);
      URL.revokeObjectURL(url);
      setLogoPreview(base64);
      await apiFetch(`/api/companies/${co.id}`,{method:"PATCH",body:JSON.stringify({logoUrl:base64})});
      setCo(prev=>({...prev,logoUrl:base64}));
    };
    img.src=url;
  }

  const TABS=[{key:"info",Icon:Building2,label:"ข้อมูลบริษัท"},{key:"dept",Icon:FolderOpen,label:"แผนก & ตำแหน่ง"},{key:"holiday",Icon:CalendarDays,label:"วันหยุดประจำปี"},{key:"leave",Icon:Umbrella,label:"ประเภทการลา"},{key:"ot",Icon:Clock,label:"อัตรา OT"}];
  const LTIcon=LEAVE_ICON_MAP[ltForm.icon]||Umbrella;

  return (
    <div style={{fontFamily:F,padding:"28px 32px",background:BG,minHeight:"100vh"}}>
      {/* Back */}
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",cursor:"pointer",color:TEAL,fontSize:13,marginBottom:16,fontFamily:F,padding:0}}>
        <ArrowLeft size={13} strokeWidth={2}/> บริษัท
      </button>

      {/* Company header */}
      <div style={{background:WHITE,borderRadius:16,padding:"20px 24px",marginBottom:20,border:"1px solid #eaecef"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            {/* Logo with upload */}
            <div style={{position:"relative",cursor:"pointer"}} onClick={()=>logoRef.current?.click()}>
              {logoPreview
                ? <img src={logoPreview} alt={co.code} style={{width:56,height:56,borderRadius:14,objectFit:"cover"}}/>
                : <div style={{width:56,height:56,borderRadius:14,background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600}}>{co.code}</div>
              }
              <div style={{position:"absolute",bottom:-4,right:-4,width:18,height:18,borderRadius:"50%",background:TEAL,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Image size={10} strokeWidth={2} color="#fff"/>
              </div>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} style={{display:"none"}}/>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                <span style={{fontSize:18,fontWeight:600,color:INK}}>{co.name}</span>
                <StatusBadge status={co.status}/>
              </div>
              <div style={{fontSize:12,color:INK3}}>{co.nameTH} · Tax: {co.taxId||"—"} · รอบ: {co.payrollCycle}</div>
            </div>
          </div>
          {canEdit&&<Btn onClick={()=>{setInfoForm({nameTH:co.nameTH,name:co.name,taxId:co.taxId||"",payrollCycle:co.payrollCycle,address:co.address||"",phone:co.phone||"",email:co.email||"",website:co.website||"",code:co.code,color:co.color,textColor:co.textColor,status:co.status});setModal("editInfo");}}><Pencil size={13} strokeWidth={2}/> แก้ไขข้อมูล</Btn>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[[co._count?.employees??0,"พนักงาน",CORAL],[depts.length,"แผนก",TEAL],[positions.length,"ตำแหน่ง","#534ab7"],[holidays.length,"วันหยุด",INK]].map(([n,l,c])=>(
            <div key={String(l)} style={{background:BG,borderRadius:10,padding:"12px 16px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:700,color:String(c)}}>{String(n)}</div>
              <div style={{fontSize:11,color:INK3,marginTop:2}}>{String(l)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid #eaecef",marginBottom:20,background:WHITE,borderRadius:"12px 12px 0 0",padding:"0 8px",border:"1px solid #eaecef"}}>
        {TABS.map(({key,Icon,label})=>(
          <button key={key} onClick={()=>setTab(key as typeof tab)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"12px 18px",border:"none",cursor:"pointer",fontSize:13,fontWeight:tab===key?500:400,color:tab===key?TEAL:INK3,background:"transparent",borderBottom:tab===key?`2.5px solid ${TEAL}`:"2.5px solid transparent",fontFamily:F,marginBottom:-1}}>
            <Icon size={14} strokeWidth={tab===key?2:1.5}/> {label}
          </button>
        ))}
      </div>

      <div style={{background:WHITE,borderRadius:"0 0 16px 16px",padding:"20px 24px",border:"1px solid #eaecef",borderTop:"none"}}>

        {/* ── Info tab ── */}
        {tab==="info"&&(
          <div style={{maxWidth:680}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{background:BG,borderRadius:14,padding:18}}>
                <div style={{fontSize:13,fontWeight:500,color:INK,marginBottom:12,display:"flex",alignItems:"center",gap:6}}><Building2 size={14} strokeWidth={1.8} color={INK3}/> ข้อมูลบริษัท</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[["ชื่อ (TH)",co.nameTH],["ชื่อ (EN)",co.name],["รหัสย่อ",co.code],["เลขนิติบุคคล",co.taxId||"—"],["รอบจ่ายเงินเดือน",co.payrollCycle]].map(([l,v])=>(
                    <div key={l}><div style={{fontSize:10,color:INK3,marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:500,color:INK}}>{v}</div></div>
                  ))}
                </div>
              </div>
              <div style={{background:BG,borderRadius:14,padding:18}}>
                <div style={{fontSize:13,fontWeight:500,color:INK,marginBottom:12,display:"flex",alignItems:"center",gap:6}}><MapPin size={14} strokeWidth={1.8} color={INK3}/> ข้อมูลติดต่อ</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[["ที่อยู่",co.address||"—"],["โทรศัพท์",co.phone||"—"],["อีเมล HR",co.email||"—"],["เว็บไซต์",co.website||"—"]].map(([l,v])=>(
                    <div key={l}><div style={{fontSize:10,color:INK3,marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:500,color:INK}}>{v}</div></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Dept tab ── */}
        {tab==="dept"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:INK,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <FolderOpen size={14} strokeWidth={1.8} color={TEAL}/> แผนก ({depts.length})
              </div>
              {/* Company root */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:BG,borderRadius:9,marginBottom:8,border:"1px solid #eaecef"}}>
                <div style={{width:30,height:30,borderRadius:8,background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Building2 size={14} strokeWidth={1.8}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500,color:INK}}>{co.name}</div>
                  <div style={{fontSize:11,color:INK3}}>บริษัท</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={deptInput} onChange={e=>setDeptInput(e.target.value)} placeholder="ชื่อแผนกใหม่..."
                  onKeyDown={e=>e.key==="Enter"&&deptInput.trim()&&addDept()}
                  style={{flex:1,fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
                {canEdit&&<Btn variant="teal" onClick={addDept} disabled={!deptInput.trim()}><Plus size={13} strokeWidth={2.5}/> เพิ่ม</Btn>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {depts.map(d=>(
                  <div key={d.id} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px 9px 28px",background:BG,borderRadius:9,border:"1px solid #f0f2f5"}}>
                    <Folder size={13} strokeWidth={1.8} color={TEAL} style={{flexShrink:0}}/>
                    {editDept?.id===d.id?(
                      <><input value={editDeptVal} onChange={e=>setEditDeptVal(e.target.value)} autoFocus
                        style={{flex:1,fontSize:13,padding:"4px 8px",borderRadius:6,border:`1.5px solid ${TEAL}`,fontFamily:F,outline:"none"}}/>
                        <IBtn Icon={Check} onClick={saveDept}/><IBtn Icon={X} onClick={()=>setEditDept(null)}/></>
                    ):(
                      <><span style={{flex:1,fontSize:13,color:INK}}>{d.name}</span>
                        <span style={{fontSize:11,color:INK3}}>{d._count?.employees??0} คน</span>
                        {canEdit&&<><IBtn Icon={Pencil} onClick={()=>{setEditDept(d);setEditDeptVal(d.name);}}/><IBtn Icon={Trash2} onClick={()=>delDept(d)}/></>}
                      </>
                    )}
                  </div>
                ))}
                {depts.length===0&&<div style={{fontSize:12,color:INK3,padding:"12px 0",textAlign:"center"}}>ยังไม่มีแผนก</div>}
              </div>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:INK,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <Award size={14} strokeWidth={1.8} color="#534ab7"/> ตำแหน่งงาน ({positions.length})
              </div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={posInput} onChange={e=>setPosInput(e.target.value)} placeholder="ชื่อตำแหน่งใหม่..."
                  onKeyDown={e=>e.key==="Enter"&&posInput.trim()&&addPos()}
                  style={{flex:1,fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
                {canEdit&&<Btn variant="teal" onClick={addPos} disabled={!posInput.trim()}><Plus size={13} strokeWidth={2.5}/> เพิ่ม</Btn>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {positions.map(p=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:BG,borderRadius:9,border:"1px solid #f0f2f5"}}>
                    <Award size={13} strokeWidth={1.8} color="#534ab7" style={{flexShrink:0}}/>
                    <span style={{flex:1,fontSize:13,color:INK}}>{p.name}</span>
                    {canEdit&&<IBtn Icon={Trash2} onClick={()=>delPos(p)}/>}
                  </div>
                ))}
                {positions.length===0&&<div style={{fontSize:12,color:INK3,padding:"12px 0",textAlign:"center"}}>ยังไม่มีตำแหน่ง</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── Holiday tab ── */}
        {tab==="holiday"&&(
          <div style={{maxWidth:660}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{display:"flex",gap:4}}>
                  {[hYear-1,hYear,hYear+1].map(y=>(
                    <button key={y} onClick={()=>setHYear(y)}
                      style={{padding:"5px 14px",borderRadius:8,border:`1.5px solid ${hYear===y?TEAL:"#dde2e8"}`,background:hYear===y?"#e6faf9":WHITE,color:hYear===y?TEAL:INK2,fontSize:12,fontWeight:hYear===y?500:400,cursor:"pointer",fontFamily:F}}>
                      {y}
                    </button>
                  ))}
                </div>
                <span style={{background:"#e6faf9",color:"#007d75",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:500}}>{holidays.length} วัน</span>
              </div>
              {canEdit&&<Btn variant="teal" onClick={()=>setShowAddH(v=>!v)}><Plus size={13} strokeWidth={2.5}/> เพิ่มวันหยุด</Btn>}
            </div>
            {showAddH&&(
              <div style={{background:"#e6faf9",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10,marginBottom:10}}>
                  <input value={newH.name} onChange={e=>setNewH({...newH,name:e.target.value})} placeholder="ชื่อวันหยุด"
                    style={{fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #9FE1CB",fontFamily:F,outline:"none"}}/>
                  <MiniCalendar value={newH.date} onChange={v=>setNewH({...newH,date:v})}/>
                  <select value={newH.isNational?"national":"company"} onChange={e=>setNewH({...newH,isNational:e.target.value==="national"})}
                    style={{fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #9FE1CB",fontFamily:F,color:INK}}>
                    <option value="national">นักขัตฤกษ์</option>
                    <option value="company">เฉพาะบริษัท</option>
                  </select>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <Btn variant="teal" onClick={addHoliday} disabled={!newH.name||!newH.date}><Check size={13} strokeWidth={2.5}/> บันทึก</Btn>
                  <Btn variant="ghost" onClick={()=>setShowAddH(false)}>ยกเลิก</Btn>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:16,marginBottom:10,fontSize:12,color:INK2}}>
              <span style={{display:"flex",alignItems:"center",gap:6}}><Dot color={TEAL}/> นักขัตฤกษ์</span>
              <span style={{display:"flex",alignItems:"center",gap:6}}><Dot color={YELLOW}/> เฉพาะบริษัท</span>
            </div>
            <table style={{width:"100%",borderCollapse:"separate",borderSpacing:"0 4px"}}>
              <thead><tr style={{fontSize:11,color:INK3,textAlign:"left"}}>
                <th style={{padding:"4px 12px",fontWeight:500}}>วันที่</th>
                <th style={{padding:"4px 12px",fontWeight:500}}>ชื่อวันหยุด</th>
                <th style={{padding:"4px 12px",fontWeight:500}}>ประเภท</th>
                <th/>
              </tr></thead>
              <tbody>
                {holidays.length===0&&<tr><td colSpan={4} style={{padding:24,textAlign:"center",color:INK3,fontSize:13}}>ยังไม่มีวันหยุดในปีนี้</td></tr>}
                {holidays.map(h=>(
                  <tr key={h.id} style={{background:BG}}>
                    <td style={{padding:"10px 12px",borderRadius:"8px 0 0 8px",fontSize:13,color:INK2}}>{formatThai(h.date)}</td>
                    <td style={{padding:"10px 12px",fontSize:13,color:INK,fontWeight:500}}>{h.name}</td>
                    <td style={{padding:"10px 12px"}}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:h.isNational?TEAL:"#854f0b",background:h.isNational?"#e6faf9":"#faeeda",borderRadius:20,padding:"2px 8px"}}>
                        <Dot color={h.isNational?TEAL:YELLOW} size={6}/>{h.isNational?"นักขัตฤกษ์":"เฉพาะบริษัท"}
                      </span>
                    </td>
                    <td style={{padding:"10px 12px",borderRadius:"0 8px 8px 0",textAlign:"right"}}>
                      {canEdit&&<button onClick={()=>delHoliday(h)} style={{background:"transparent",border:"1px solid #eaecef",borderRadius:7,cursor:"pointer",padding:"4px 8px",color:INK3,display:"inline-flex",alignItems:"center"}}><Trash2 size={13} strokeWidth={1.8}/></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Leave tab ── */}
        {tab==="leave"&&(
          <div style={{maxWidth:700}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,fontWeight:500,color:INK}}>ประเภทการลา</span>
                <span style={{background:"#e6faf9",color:"#007d75",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:500}}>{leaveTypes.length} ประเภท</span>
              </div>
              {canEdit&&(
                <div style={{display:"flex",gap:6}}>
                  {leaveTypes.length===0&&<Btn variant="ghost" onClick={addDefaultLTs}><Sparkles size={13} strokeWidth={2}/> เพิ่มค่าเริ่มต้น</Btn>}
                  <Btn variant="teal" onClick={openAddLT}><Plus size={13} strokeWidth={2.5}/> เพิ่มประเภทการลา</Btn>
                </div>
              )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {leaveTypes.map(lt=>{
                const LTI=LEAVE_ICON_MAP[lt.icon]||Umbrella;
                return (
                  <div key={lt.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:BG,borderRadius:12,border:"1px solid #eaecef"}}>
                    <div style={{width:42,height:42,borderRadius:11,background:lt.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <LTI size={18} strokeWidth={1.8} color={INK2}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:500,color:INK}}>{lt.name}</div>
                      <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:INK3}}>{lt.noLimit?"ไม่จำกัดวัน":`${lt.maxDaysPerYear??"-"} วัน/ปี`}</span>
                        {lt.isPaid&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"#e6faf9",color:"#007d75",fontWeight:500}}>ได้รับเงิน</span>}
                        {lt.requireApproval&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"#faeeda",color:"#854f0b",fontWeight:500}}>ต้องอนุมัติ</span>}
                        {lt.isAccumulated&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"#eeedfe",color:"#534ab7",fontWeight:500}}>สะสมได้</span>}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:22,fontWeight:500,color:INK2,lineHeight:1}}>{lt.noLimit?"∞":lt.maxDaysPerYear??"-"}</div>
                      <div style={{fontSize:11,color:INK3,marginTop:2}}>วัน/ปี</div>
                    </div>
                    {canEdit&&<div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                      <IBtn Icon={Pencil} onClick={()=>openEditLT(lt)}/>
                      <IBtn Icon={Trash2} onClick={()=>delLT(lt)}/>
                    </div>}
                  </div>
                );
              })}
              {leaveTypes.length===0&&(
                <div style={{padding:32,textAlign:"center",color:INK3,background:BG,borderRadius:14,border:"1px dashed #dde2e8"}}>
                  <Umbrella size={32} strokeWidth={1.4} color={INK3} style={{margin:"0 auto 10px",display:"block"}}/>
                  <div style={{fontSize:14,fontWeight:500,color:INK2,marginBottom:4}}>ยังไม่มีประเภทการลา</div>
                  <div style={{fontSize:12}}>กดปุ่ม "เพิ่มค่าเริ่มต้น" เพื่อเพิ่มประเภทพื้นฐานอัตโนมัติ</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Info Modal — full fields like wizard */}
      {modal==="editInfo"&&(
        <Modal title="แก้ไขข้อมูลบริษัท" onClose={()=>setModal(null)} width={600}>
          {/* Logo & preview */}
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:infoForm.color,borderRadius:12,marginBottom:18}}>
            {logoPreview
              ?<img src={logoPreview} alt={infoForm.code} style={{width:52,height:52,borderRadius:14,objectFit:"cover"}}/>
              :<div style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,.3)",color:infoForm.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600}}>{infoForm.code||"??"}</div>
            }
            <div>
              <div style={{fontSize:15,fontWeight:500,color:INK}}>{infoForm.name||"ชื่อบริษัท"}</div>
              <div style={{fontSize:12,color:INK2}}>{infoForm.nameTH}</div>
            </div>
            <div style={{marginLeft:"auto"}}>
              <button onClick={()=>logoRef.current?.click()} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.5)",background:"transparent",color:INK2,fontSize:12,cursor:"pointer",fontFamily:F}}>
                <Image size={12} strokeWidth={2}/> เปลี่ยนโลโก้
              </button>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <FI label="ชื่อบริษัท (TH)" value={infoForm.nameTH} onChange={v=>setInfoForm({...infoForm,nameTH:v})}/>
              <FI label="ชื่อบริษัท (EN)" value={infoForm.name} onChange={v=>setInfoForm({...infoForm,name:v})}/>
              <FI label="รหัสย่อ" value={infoForm.code} onChange={v=>setInfoForm({...infoForm,code:v.toUpperCase().slice(0,4)})}/>
              <FI label="เลขนิติบุคคล (Tax ID)" value={infoForm.taxId} onChange={v=>setInfoForm({...infoForm,taxId:v})}/>
            </div>
            <div>
              <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>รอบจ่ายเงินเดือน</div>
              <select value={infoForm.payrollCycle} onChange={e=>setInfoForm({...infoForm,payrollCycle:e.target.value})}
                style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
                {CYCLES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>สถานะ</div>
              <select value={infoForm.status} onChange={e=>setInfoForm({...infoForm,status:e.target.value})}
                style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
                <option value="ACTIVE">ใช้งาน</option>
                <option value="INACTIVE">พักใช้งาน</option>
              </select>
            </div>
            <FI label="ที่อยู่" value={infoForm.address} onChange={v=>setInfoForm({...infoForm,address:v})}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <FI label="โทรศัพท์" value={infoForm.phone} onChange={v=>setInfoForm({...infoForm,phone:v})}/>
              <FI label="อีเมล HR" value={infoForm.email} onChange={v=>setInfoForm({...infoForm,email:v})} type="email"/>
              <FI label="เว็บไซต์" value={infoForm.website} onChange={v=>setInfoForm({...infoForm,website:v})}/>
            </div>
            <div>
              <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>สีประจำบริษัท</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {CO_COLORS.map(([bg,tc])=>(
                  <button key={bg} type="button" onClick={()=>setInfoForm({...infoForm,color:bg,textColor:tc})}
                    style={{width:32,height:32,borderRadius:8,background:bg,border:infoForm.color===bg?`2.5px solid ${TEAL}`:"2px solid #eaecef",cursor:"pointer"}}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,borderTop:"1px solid #eaecef",paddingTop:14}}>
            <Btn variant="ghost" onClick={()=>setModal(null)}>ยกเลิก</Btn>
            <Btn variant="teal" onClick={saveInfo}><Check size={13} strokeWidth={2.5}/> บันทึก</Btn>
          </div>
        </Modal>
      )}

      {/* Add/Edit Leave Type Modal */}
        {/* ── OT tab ── */}
        {tab==="ot"&&(
          <div style={{maxWidth:620}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div>
                <div style={{fontSize:14,fontWeight:500,color:INK,marginBottom:4}}>อัตราค่าล่วงเวลา (OT)</div>
                <div style={{fontSize:12,color:INK3}}>กำหนดว่าบริษัทนี้ใช้อัตรา OT รายการใดบ้าง ตามพ.ร.บ.คุ้มครองแรงงาน</div>
              </div>
              {canEdit&&<Btn variant="teal" onClick={saveOtSettings} disabled={otSaving}><Check size={13} strokeWidth={2.5}/>{otSaving?"กำลังบันทึก...":"บันทึก"}</Btn>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {OT_RATES.map(r=>{
                const on=otEnabled[r.key]??true;
                return (
                  <div key={r.key} onClick={()=>canEdit&&setOtEnabled(prev=>({...prev,[r.key]:!on}))}
                    style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderRadius:14,border:`2px solid ${on?"#00B4A9":"#eaecef"}`,background:on?r.color:BG,cursor:canEdit?"pointer":"default",transition:"all .15s"}}>
                    <div style={{width:40,height:40,borderRadius:11,background:on?"rgba(0,180,169,.12)":"#eaecef",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Clock size={18} strokeWidth={1.8} color={on?TEAL:INK3}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,color:on?INK:INK3,marginBottom:2}}>{r.label}</div>
                      <div style={{fontSize:11,color:INK3}}>{r.desc}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:18,fontWeight:700,color:on?TEAL:INK3}}>×{r.multiplier.toFixed(1)}</div>
                      <div style={{fontSize:10,color:INK3}}>เท่า</div>
                    </div>
                    <div style={{width:22,height:22,borderRadius:6,background:on?TEAL:"transparent",border:`2px solid ${on?TEAL:"#dde2e8"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {on&&<Check size={12} strokeWidth={2.5} color="#fff"/>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:18,padding:"12px 16px",background:"#fffbea",borderRadius:12,border:"1px solid #f0d060"}}>
              <div style={{fontSize:12,fontWeight:500,color:"#8a6d00",marginBottom:4}}>📋 อ้างอิงตามกฎหมาย</div>
              <div style={{fontSize:11,color:"#8a6d00",lineHeight:1.6}}>
                พ.ร.บ.คุ้มครองแรงงาน พ.ศ. 2541 มาตรา 61–63 กำหนดอัตราค่า OT ขั้นต่ำ
                โดยอัตราที่แสดงเป็นอัตราขั้นต่ำตามกฎหมาย บริษัทสามารถกำหนดสูงกว่าได้
              </div>
            </div>
          </div>
        )}

      {showAddLT&&(
        <Modal title={editLT?"แก้ไขประเภทการลา":"เพิ่มประเภทการลา"} onClose={()=>setShowAddLT(false)} width={480}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:ltForm.color,borderRadius:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:"rgba(255,255,255,.5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <LTIcon size={18} strokeWidth={1.8} color={INK2}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500,color:INK}}>{ltForm.name||"ชื่อประเภทการลา"}</div>
                <div style={{fontSize:12,color:INK3}}>{ltForm.noLimit?"ไม่จำกัดวัน":`${ltForm.maxDaysPerYear||"0"} วัน/ปี`}</div>
              </div>
            </div>
            <FI label="ชื่อประเภทการลา" value={ltForm.name} onChange={v=>setLtForm({...ltForm,name:v})} req/>
            <div>
              <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>ไอคอน</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.entries(LEAVE_ICON_MAP).map(([k,Ic])=>(
                  <button key={k} onClick={()=>setLtForm({...ltForm,icon:k})}
                    style={{width:36,height:36,borderRadius:8,border:`2px solid ${ltForm.icon===k?TEAL:"#dde2e8"}`,background:ltForm.icon===k?"#e6faf9":WHITE,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Ic size={16} strokeWidth={1.8} color={ltForm.icon===k?TEAL:INK3}/>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>สี</div>
              <div style={{display:"flex",gap:6}}>
                {LEAVE_COLORS.map(c=>(
                  <button key={c} onClick={()=>setLtForm({...ltForm,color:c})}
                    style={{width:30,height:30,borderRadius:7,background:c,border:ltForm.color===c?`2.5px solid ${TEAL}`:"2px solid #eaecef",cursor:"pointer"}}/>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                <input type="checkbox" checked={ltForm.noLimit} onChange={e=>setLtForm({...ltForm,noLimit:e.target.checked})}/>
                <span style={{fontSize:13,color:INK2}}>ไม่จำกัดวัน</span>
              </label>
              {!ltForm.noLimit&&<div style={{flex:1}}>
                <input type="number" value={ltForm.maxDaysPerYear} onChange={e=>setLtForm({...ltForm,maxDaysPerYear:e.target.value})}
                  placeholder="จำนวนวันต่อปี" min={1}
                  style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
              </div>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[["isPaid","ได้รับค่าจ้าง"],["requireApproval","ต้องอนุมัติ"],["isAccumulated","สะสมได้"]].map(([k,label])=>(
                <label key={k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 10px",borderRadius:8,background:BG,fontSize:12,color:INK}}>
                  <input type="checkbox" checked={ltForm[k as keyof typeof ltForm] as boolean} onChange={e=>setLtForm({...ltForm,[k]:e.target.checked})}/>
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,borderTop:"1px solid #eaecef",paddingTop:14,marginTop:16}}>
            {editLT&&<Btn variant="danger" onClick={()=>delLT(editLT)}><Trash2 size={13} strokeWidth={2}/> ลบ</Btn>}
            <Btn variant="ghost" onClick={()=>setShowAddLT(false)}>ยกเลิก</Btn>
            <Btn variant="teal" onClick={saveLT} disabled={!ltForm.name}><Check size={13} strokeWidth={2.5}/> {editLT?"บันทึก":"เพิ่ม"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function CompaniesPage(){
  const {user}=useAuth();
  const [selected,setSelected]=useState<Company|null>(null);
  const canEdit=user?.role==="ADMIN"||user?.role==="HR";
  if(selected) return <CompanyDetail company={selected} onBack={()=>setSelected(null)} canEdit={canEdit}/>;
  return <CompanyList onSelect={setSelected} canEdit={canEdit}/>;
}
# trigger
