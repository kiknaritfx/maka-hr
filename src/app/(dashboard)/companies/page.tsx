"use client";
import { useEffect, useState, useRef } from "react";
import {
  Plus, Pencil, Trash2, Building2, Search, Download,
  SlidersHorizontal, ChevronRight, ChevronLeft, ArrowLeft,
  Check, X, Folder, FolderOpen, Award, Umbrella, HeartPulse,
  Briefcase, Baby, Users, CalendarDays, Copy, Calculator,
  MapPin, Phone, Mail, Globe, ShieldCheck, Sparkles, Pause
} from "lucide-react";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

const TEAL="#00B4A9"; const CORAL="#FF6B6B"; const YELLOW="#FFD93D";
const BG="#F4F6F8"; const INK="#1C2833"; const INK2="#5a6a78"; const INK3="#9aaab8"; const WHITE="#fff";
const F="'Prompt','Kanit',sans-serif";

// ── Types ──
interface Dept     { id:number; name:string; _count?:{employees:number}; }
interface Pos      { id:number; name:string; }
interface Holiday  { id:number; name:string; date:string; year:number; isNational:boolean; }
interface LeaveType {
  id:number; name:string; icon:string; color:string;
  maxDaysPerYear:number|null; isPaid:boolean; requireApproval:boolean;
  isAccumulated:boolean; noLimit:boolean;
}
interface Company  {
  id:number; code:string; name:string; nameTH:string; color:string; textColor:string;
  payrollCycle:string; status:string; taxId?:string; address?:string; phone?:string;
  email?:string; website?:string; departments:Dept[]; positions:Pos[];
  _count?:{employees:number};
}

// ── Thai National Holidays ──
const THAI_HOLIDAYS_2568 = [
  {name:"วันขึ้นปีใหม่",date:"2025-01-01"},
  {name:"วันมาฆบูชา",date:"2025-02-12"},
  {name:"วันจักรี",date:"2025-04-06"},
  {name:"วันสงกรานต์",date:"2025-04-13"},
  {name:"วันสงกรานต์",date:"2025-04-14"},
  {name:"วันสงกรานต์",date:"2025-04-15"},
  {name:"วันฉัตรมงคล",date:"2025-05-04"},
  {name:"วันวิสาขบูชา",date:"2025-05-12"},
  {name:"วันเฉลิมพระชนมพรรษาพระราชินี",date:"2025-06-03"},
  {name:"วันอาสาฬหบูชา",date:"2025-07-10"},
  {name:"วันเข้าพรรษา",date:"2025-07-11"},
  {name:"วันเฉลิมพระชนมพรรษา ร.10",date:"2025-07-28"},
  {name:"วันแม่แห่งชาติ",date:"2025-08-12"},
  {name:"วันนวมินทรมหาราช",date:"2025-10-13"},
  {name:"วันปิยมหาราช",date:"2025-10-23"},
  {name:"วันพ่อแห่งชาติ",date:"2025-12-05"},
  {name:"วันรัฐธรรมนูญ",date:"2025-12-10"},
  {name:"วันสิ้นปี",date:"2025-12-31"},
];
const THAI_HOLIDAYS_2569 = [
  {name:"วันขึ้นปีใหม่",date:"2026-01-01"},
  {name:"วันมาฆบูชา",date:"2026-03-03"},
  {name:"วันจักรี",date:"2026-04-06"},
  {name:"วันสงกรานต์",date:"2026-04-13"},
  {name:"วันสงกรานต์",date:"2026-04-14"},
  {name:"วันสงกรานต์",date:"2026-04-15"},
  {name:"วันฉัตรมงคล",date:"2026-05-04"},
  {name:"วันวิสาขบูชา",date:"2026-05-31"},
  {name:"วันเฉลิมพระชนมพรรษาพระราชินี",date:"2026-06-03"},
  {name:"วันอาสาฬหบูชา",date:"2026-07-29"},
  {name:"วันเข้าพรรษา",date:"2026-07-30"},
  {name:"วันเฉลิมพระชนมพรรษา ร.10",date:"2026-07-28"},
  {name:"วันแม่แห่งชาติ",date:"2026-08-12"},
  {name:"วันนวมินทรมหาราช",date:"2026-10-13"},
  {name:"วันปิยมหาราช",date:"2026-10-23"},
  {name:"วันพ่อแห่งชาติ",date:"2026-12-05"},
  {name:"วันรัฐธรรมนูญ",date:"2026-12-10"},
  {name:"วันสิ้นปี",date:"2026-12-31"},
];
const THAI_HOLIDAYS_2570 = [
  {name:"วันขึ้นปีใหม่",date:"2027-01-01"},
  {name:"วันมาฆบูชา",date:"2027-02-21"},
  {name:"วันจักรี",date:"2027-04-06"},
  {name:"วันสงกรานต์",date:"2027-04-13"},
  {name:"วันสงกรานต์",date:"2027-04-14"},
  {name:"วันสงกรานต์",date:"2027-04-15"},
  {name:"วันฉัตรมงคล",date:"2027-05-04"},
  {name:"วันวิสาขบูชา",date:"2027-05-20"},
  {name:"วันเฉลิมพระชนมพรรษาพระราชินี",date:"2027-06-03"},
  {name:"วันอาสาฬหบูชา",date:"2027-07-19"},
  {name:"วันเข้าพรรษา",date:"2027-07-20"},
  {name:"วันเฉลิมพระชนมพรรษา ร.10",date:"2027-07-28"},
  {name:"วันแม่แห่งชาติ",date:"2027-08-12"},
  {name:"วันนวมินทรมหาราช",date:"2027-10-13"},
  {name:"วันปิยมหาราช",date:"2027-10-23"},
  {name:"วันพ่อแห่งชาติ",date:"2027-12-05"},
  {name:"วันรัฐธรรมนูญ",date:"2027-12-10"},
  {name:"วันสิ้นปี",date:"2027-12-31"},
];
const HOLIDAYS_BY_YEAR:Record<number,{name:string;date:string}[]>={
  2568:THAI_HOLIDAYS_2568, 2569:THAI_HOLIDAYS_2569, 2570:THAI_HOLIDAYS_2570
};

// ── Default Leave Types ──
const DEFAULT_LEAVE_TYPES = [
  {name:"ลาป่วย",icon:"HeartPulse",color:"#fff0f0",maxDaysPerYear:30,isPaid:true,requireApproval:false,isAccumulated:false,noLimit:false},
  {name:"ลากิจ",icon:"Briefcase",color:"#e6f1fb",maxDaysPerYear:3,isPaid:false,requireApproval:true,isAccumulated:false,noLimit:false},
  {name:"ลาพักร้อน",icon:"Umbrella",color:"#e6faf9",maxDaysPerYear:10,isPaid:true,requireApproval:true,isAccumulated:true,noLimit:false},
  {name:"ลาคลอด",icon:"Baby",color:"#fbeaf0",maxDaysPerYear:98,isPaid:true,requireApproval:true,isAccumulated:false,noLimit:false},
];

// ── Helpers ──
const TH_MONTHS=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
function formatThai(iso:string){
  const d=new Date(iso); return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear()+543}`;
}
const CO_COLORS:[string,string][]=[["#fff0f0","#cc4444"],["#e6faf9","#007d75"],["#eeedfe","#534ab7"],["#faeeda","#854f0b"],["#e6f1fb","#185fa5"],["#fbeaf0","#993556"],["#EAF3DE","#3B6D11"]];
const CYCLES=["สิ้นเดือน","วันที่ 25","วันที่ 28","วันที่ 15","ทุก 2 สัปดาห์"];
const LEAVE_ICON_MAP:Record<string,React.ElementType>={Umbrella,HeartPulse,Briefcase,Baby,Users,Award,CalendarDays};
const LEAVE_COLORS=["#e6faf9","#fff0f0","#e6f1fb","#fbeaf0","#eeedfe","#faeeda","#EAF3DE"];

function Dot({color,size=9}:{color:string;size?:number}){
  return <span style={{width:size,height:size,borderRadius:"50%",background:color,display:"inline-block",flexShrink:0}}/>;
}
function StatusBadge({status}:{status:string}){
  const m:Record<string,{bg:string;color:string;label:string}> = {
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

// ════════════════════════════════════════
//  COMPANY LIST (หน้าหลัก)
// ════════════════════════════════════════
function CompanyList({onSelect,canEdit}:{onSelect:(c:Company)=>void;canEdit:boolean}){
  const [companies,setCompanies]=useState<Company[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [addForm,setAddForm]=useState({name:"",nameTH:"",code:"",taxId:"",payrollCycle:"สิ้นเดือน",address:"",phone:"",email:"",website:"",color:"#e6faf9",textColor:"#007d75"});
  const [saving,setSaving]=useState(false);
  const [addStep,setAddStep]=useState(1);
  // Step 4: holiday preset selection
  const [presetYear,setPresetYear]=useState(2568);
  const [selectedHolidays,setSelectedHolidays]=useState<Set<string>>(new Set(THAI_HOLIDAYS_2568.map(h=>h.date)));

  useEffect(()=>{
    apiFetch<Company[]>("/api/companies").then(r=>{if(r.data)setCompanies(r.data);}).finally(()=>setLoading(false));
  },[]);

  function toggleHoliday(date:string){
    setSelectedHolidays(prev=>{const n=new Set(prev); n.has(date)?n.delete(date):n.add(date); return n;});
  }
  function changePresetYear(y:number){
    setPresetYear(y);
    setSelectedHolidays(new Set((HOLIDAYS_BY_YEAR[y]||[]).map(h=>h.date)));
  }

  async function saveCompany(){
    setSaving(true);
    const r=await apiFetch<Company>("/api/companies",{method:"POST",body:JSON.stringify(addForm)});
    if(r.data){
      // บันทึกวันหยุดที่เลือก
      const holidays=(HOLIDAYS_BY_YEAR[presetYear]||[]).filter(h=>selectedHolidays.has(h.date));
      for(const h of holidays){
        await apiFetch(`/api/companies/${r.data.id}/holidays`,{method:"POST",body:JSON.stringify({
          name:h.name, date:h.date, isNational:true,
          year:new Date(h.date).getFullYear()+543
        })});
      }
      setCompanies(cs=>[...cs,r.data!]);
      setAddForm({name:"",nameTH:"",code:"",taxId:"",payrollCycle:"สิ้นเดือน",address:"",phone:"",email:"",website:"",color:"#e6faf9",textColor:"#007d75"});
      setSaving(false);setShowAdd(false);setAddStep(1);
    } else { setSaving(false); }
  }

  const filtered=companies.filter(c=>
    c.name.toLowerCase().includes(search.toLowerCase())||
    c.nameTH?.includes(search)||c.code.toLowerCase().includes(search.toLowerCase())
  );

  const STEP_LABELS=["ข้อมูลบริษัท","รายละเอียด","รูปแบบ","วันหยุด"];

  return (
    <div style={{fontFamily:F,padding:"28px 32px",background:BG,minHeight:"100vh"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <div style={{fontSize:20,fontWeight:600,color:INK}}>บริษัท</div>
          <div style={{fontSize:12,color:INK3,marginTop:2}}>จัดการข้อมูลบริษัทและองค์กร</div>
        </div>
        {canEdit&&<Btn variant="primary" onClick={()=>{setShowAdd(true);setAddStep(1);}}><Plus size={14} strokeWidth={2.5}/> เพิ่มบริษัท</Btn>}
      </div>

      {/* Search */}
      <div style={{position:"relative",marginBottom:20,maxWidth:360}}>
        <Search size={14} strokeWidth={1.8} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:INK3}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาบริษัท..."
          style={{width:"100%",boxSizing:"border-box",paddingLeft:33,paddingRight:12,paddingTop:9,paddingBottom:9,borderRadius:10,border:"1px solid #dde2e8",fontSize:13,fontFamily:F,color:INK,outline:"none",background:WHITE}}/>
      </div>

      {/* List */}
      {loading?<div style={{textAlign:"center",padding:48,color:INK3,fontSize:13}}>กำลังโหลด...</div>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(co=>(
            <div key={co.id} onClick={()=>onSelect(co)}
              style={{background:WHITE,borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,cursor:"pointer",border:"1px solid #eaecef",transition:"box-shadow .15s"}}
              onMouseEnter={e=>(e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.07)")}
              onMouseLeave={e=>(e.currentTarget.style.boxShadow="none")}>
              <div style={{width:44,height:44,borderRadius:12,background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,flexShrink:0}}>{co.code}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:500,color:INK}}>{co.name}</div>
                <div style={{fontSize:12,color:INK3,marginTop:1}}>{co.nameTH} · {co.payrollCycle}</div>
              </div>
              <div style={{display:"flex",gap:20,alignItems:"center"}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:600,color:TEAL}}>{co._count?.employees??0}</div>
                  <div style={{fontSize:11,color:INK3}}>พนักงาน</div>
                </div>
                <StatusBadge status={co.status}/>
                <ChevronRight size={16} strokeWidth={1.5} color={INK3}/>
              </div>
            </div>
          ))}
          {filtered.length===0&&!loading&&(
            <div style={{textAlign:"center",padding:48,color:INK3,fontSize:13}}>
              <Building2 size={32} strokeWidth={1.2} style={{display:"block",margin:"0 auto 10px",opacity:.4}}/>
              ไม่พบข้อมูลบริษัท
            </div>
          )}
        </div>
      )}

      {/* Add Company Modal */}
      {showAdd&&(
        <Modal title="เพิ่มบริษัทใหม่" onClose={()=>{setShowAdd(false);setAddStep(1);}} width={580}>
          {/* Step indicator */}
          <div style={{display:"flex",gap:4,marginBottom:20,background:BG,borderRadius:10,padding:4}}>
            {STEP_LABELS.map((s,i)=>(
              <div key={s} onClick={()=>i+1<addStep&&setAddStep(i+1)}
                style={{flex:1,padding:"7px 0",textAlign:"center",borderRadius:8,fontSize:12,fontWeight:addStep===i+1?500:400,color:addStep===i+1?TEAL:addStep>i+1?INK2:INK3,background:addStep===i+1?WHITE:"transparent",cursor:addStep>i+1?"pointer":"default"}}>
                {s}
              </div>
            ))}
          </div>

          {addStep===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <FI label="ชื่อบริษัท (EN)" value={addForm.name} onChange={v=>setAddForm({...addForm,name:v})} req/>
                <FI label="ชื่อบริษัท (TH)" value={addForm.nameTH} onChange={v=>setAddForm({...addForm,nameTH:v})}/>
                <FI label="รหัสย่อ" value={addForm.code} onChange={v=>setAddForm({...addForm,code:v.toUpperCase().slice(0,10)})} req placeholder="BB"/>
                <FI label="เลขนิติบุคคล (Tax ID)" value={addForm.taxId} onChange={v=>setAddForm({...addForm,taxId:v})}/>
              </div>
              <div>
                <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>รอบจ่ายเงินเดือน</div>
                <select value={addForm.payrollCycle} onChange={e=>setAddForm({...addForm,payrollCycle:e.target.value})}
                  style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
                  {CYCLES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {addStep===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <FI label="ที่อยู่" value={addForm.address} onChange={v=>setAddForm({...addForm,address:v})}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <FI label="โทรศัพท์" value={addForm.phone} onChange={v=>setAddForm({...addForm,phone:v})}/>
                <FI label="อีเมล" value={addForm.email} onChange={v=>setAddForm({...addForm,email:v})} type="email"/>
                <FI label="เว็บไซต์" value={addForm.website} onChange={v=>setAddForm({...addForm,website:v})}/>
              </div>
            </div>
          )}

          {addStep===3&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:addForm.color,borderRadius:12,marginBottom:18}}>
                <div style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,.3)",color:addForm.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500}}>{addForm.code||"??"}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:500,color:INK}}>{addForm.name||"ชื่อบริษัท"}</div>
                  <div style={{fontSize:12,color:INK2,marginTop:1}}>{addForm.nameTH||""}</div>
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:INK3,marginBottom:8,textTransform:"uppercase",letterSpacing:".4px"}}>สีประจำบริษัท</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {CO_COLORS.map(([bg,tc])=>(
                    <button key={bg} type="button" onClick={()=>setAddForm({...addForm,color:bg,textColor:tc})}
                      style={{width:36,height:36,borderRadius:9,background:bg,border:addForm.color===bg?`2.5px solid ${TEAL}`:"2px solid #eaecef",cursor:"pointer"}}/>
                  ))}
                </div>
              </div>
              <div style={{background:BG,borderRadius:10,padding:"12px 14px",fontSize:12,color:INK2,lineHeight:2}}>
                <div><span style={{color:INK3}}>ชื่อ:</span> {addForm.name} · {addForm.nameTH}</div>
                <div><span style={{color:INK3}}>รหัส:</span> {addForm.code} · <span style={{color:INK3}}>Tax:</span> {addForm.taxId||"—"}</div>
                <div><span style={{color:INK3}}>รอบเงินเดือน:</span> {addForm.payrollCycle}</div>
              </div>
            </div>
          )}

          {/* Step 4: Holiday Preset */}
          {addStep===4&&(
            <div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:500,color:INK,marginBottom:4}}>เลือกวันหยุดนักขัตฤกษ์</div>
                <div style={{fontSize:12,color:INK3,marginBottom:12}}>วันหยุดที่เลือกจะถูกเพิ่มเข้าบริษัทอัตโนมัติ</div>
                {/* Year selector */}
                <div style={{display:"flex",gap:6,marginBottom:14}}>
                  {[2568,2569,2570].map(y=>(
                    <button key={y} onClick={()=>changePresetYear(y)}
                      style={{padding:"6px 16px",borderRadius:8,border:`1.5px solid ${presetYear===y?TEAL:"#dde2e8"}`,background:presetYear===y?"#e6faf9":WHITE,color:presetYear===y?TEAL:INK2,fontSize:12,fontWeight:presetYear===y?500:400,cursor:"pointer",fontFamily:F}}>
                      {y}
                    </button>
                  ))}
                  <button onClick={()=>setSelectedHolidays(new Set())}
                    style={{marginLeft:"auto",padding:"6px 12px",borderRadius:8,border:"1px solid #dde2e8",background:WHITE,color:INK3,fontSize:12,cursor:"pointer",fontFamily:F}}>
                    ยกเลิกทั้งหมด
                  </button>
                  <button onClick={()=>setSelectedHolidays(new Set((HOLIDAYS_BY_YEAR[presetYear]||[]).map(h=>h.date)))}
                    style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${TEAL}`,background:"#e6faf9",color:TEAL,fontSize:12,cursor:"pointer",fontFamily:F}}>
                    เลือกทั้งหมด
                  </button>
                </div>
                {/* Holiday list */}
                <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                  {(HOLIDAYS_BY_YEAR[presetYear]||[]).map(h=>{
                    const checked=selectedHolidays.has(h.date);
                    return (
                      <div key={h.date} onClick={()=>toggleHoliday(h.date)}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,border:`1.5px solid ${checked?TEAL:"#eaecef"}`,background:checked?"#e6faf9":WHITE,cursor:"pointer",transition:"all .1s"}}>
                        <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checked?TEAL:"#ccc"}`,background:checked?TEAL:WHITE,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {checked&&<Check size={10} strokeWidth={3} color={WHITE}/>}
                        </div>
                        <div style={{flex:1}}>
                          <span style={{fontSize:13,color:INK,fontWeight:checked?500:400}}>{h.name}</span>
                        </div>
                        <span style={{fontSize:11,color:INK3}}>{formatThai(h.date)}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{marginTop:10,fontSize:12,color:TEAL,fontWeight:500}}>
                  เลือกแล้ว {selectedHolidays.size} วัน
                </div>
              </div>
            </div>
          )}

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid #eaecef",paddingTop:14,marginTop:16}}>
            <span style={{fontSize:12,color:INK3}}>ขั้นตอนที่ {addStep} จาก 4</span>
            <div style={{display:"flex",gap:8}}>
              {addStep>1&&<Btn variant="ghost" onClick={()=>setAddStep(s=>s-1)}><ChevronLeft size={13} strokeWidth={2}/> ย้อนกลับ</Btn>}
              <Btn variant="ghost" onClick={()=>{setShowAdd(false);setAddStep(1);}}>ยกเลิก</Btn>
              {addStep<4
                ?<Btn variant="teal" onClick={()=>setAddStep(s=>s+1)} disabled={addStep===1&&(!addForm.name||!addForm.code)}>ถัดไป <ChevronRight size={13} strokeWidth={2}/></Btn>
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
//  COMPANY DETAIL (full-page with tabs)
// ════════════════════════════════════════
function CompanyDetail({company:initCo,onBack,canEdit}:{company:Company;onBack:()=>void;canEdit:boolean}){
  const [co,setCo]=useState<Company>(initCo);
  const [tab,setTab]=useState<"info"|"dept"|"holiday"|"leave">("info");
  const [depts,setDepts]=useState<Dept[]>([]);
  const [positions,setPositions]=useState<Pos[]>([]);
  const [modal,setModal]=useState<string|null>(null);
  const [infoForm,setInfoForm]=useState({nameTH:co.nameTH,name:co.name,taxId:co.taxId||"",payrollCycle:co.payrollCycle,address:co.address||"",phone:co.phone||"",email:co.email||"",website:co.website||""});
  const [deptInput,setDeptInput]=useState("");
  const [posInput,setPosInput]=useState("");
  const [editDept,setEditDept]=useState<Dept|null>(null);
  const [editDeptVal,setEditDeptVal]=useState("");

  // Holiday
  const [holidays,setHolidays]=useState<Holiday[]>([]);
  const [hYear,setHYear]=useState(new Date().getFullYear()+543);
  const [showAddH,setShowAddH]=useState(false);
  const [newH,setNewH]=useState({name:"",date:"",isNational:true});

  // Leave Types
  const [leaveTypes,setLeaveTypes]=useState<LeaveType[]>([]);
  const [showAddLT,setShowAddLT]=useState(false);
  const [editLT,setEditLT]=useState<LeaveType|null>(null);
  const [ltForm,setLtForm]=useState({name:"",icon:"Umbrella",color:"#e6faf9",maxDaysPerYear:"",isPaid:true,requireApproval:true,isAccumulated:false,noLimit:false});

  useEffect(()=>{
    apiFetch<Dept[]>(`/api/companies/${co.id}/departments`).then(r=>{if(r.data)setDepts(r.data);});
    apiFetch<Pos[]>(`/api/companies/${co.id}/positions`).then(r=>{if(r.data)setPositions(r.data);});
  },[co.id]);

  useEffect(()=>{
    if(tab==="holiday")
      apiFetch<Holiday[]>(`/api/companies/${co.id}/holidays?year=${hYear}`).then(r=>{if(r.data)setHolidays(r.data);});
    if(tab==="leave")
      apiFetch<LeaveType[]>(`/api/companies/${co.id}/leave-types`).then(r=>{if(r.data)setLeaveTypes(r.data);});
  },[tab,hYear,co.id]);

  async function saveInfo(){
    const r=await apiFetch<Company>(`/api/companies/${co.id}`,{method:"PATCH",body:JSON.stringify(infoForm)});
    if(r.data){setCo({...co,...r.data});setModal(null);}
  }
  async function addDept(){
    const r=await apiFetch<Dept>(`/api/companies/${co.id}/departments`,{method:"POST",body:JSON.stringify({name:deptInput.trim()})});
    if(r.data){setDepts([...depts,r.data]);setDeptInput("");}
  }
  async function saveDept(){
    const r=await apiFetch<Dept>(`/api/companies/${co.id}/departments/${editDept!.id}`,{method:"PATCH",body:JSON.stringify({name:editDeptVal.trim()})});
    if(r.data){setDepts(depts.map(d=>d.id===r.data!.id?r.data!:d));setEditDept(null);}
  }
  async function delDept(d:Dept){
    await apiFetch(`/api/companies/${co.id}/departments/${d.id}`,{method:"DELETE"});
    setDepts(depts.filter(x=>x.id!==d.id));
  }
  async function addPos(){
    const r=await apiFetch<Pos>(`/api/companies/${co.id}/positions`,{method:"POST",body:JSON.stringify({name:posInput.trim()})});
    if(r.data){setPositions([...positions,r.data]);setPosInput("");}
  }
  async function delPos(p:Pos){
    await apiFetch(`/api/companies/${co.id}/positions/${p.id}`,{method:"DELETE"});
    setPositions(positions.filter(x=>x.id!==p.id));
  }
  async function addHoliday(){
    const r=await apiFetch<Holiday>(`/api/companies/${co.id}/holidays`,{method:"POST",body:JSON.stringify({...newH,year:new Date(newH.date).getFullYear()+543})});
    if(r.data){setHolidays([...holidays,r.data].sort((a,b)=>a.date.localeCompare(b.date)));setNewH({name:"",date:"",isNational:true});setShowAddH(false);}
  }
  async function delHoliday(h:Holiday){
    await apiFetch(`/api/companies/${co.id}/holidays/${h.id}`,{method:"DELETE"});
    setHolidays(holidays.filter(x=>x.id!==h.id));
  }

  // Leave Type handlers
  function openAddLT(){
    setLtForm({name:"",icon:"Umbrella",color:"#e6faf9",maxDaysPerYear:"",isPaid:true,requireApproval:true,isAccumulated:false,noLimit:false});
    setEditLT(null); setShowAddLT(true);
  }
  function openEditLT(lt:LeaveType){
    setLtForm({name:lt.name,icon:lt.icon,color:lt.color,maxDaysPerYear:lt.maxDaysPerYear?.toString()||"",isPaid:lt.isPaid,requireApproval:lt.requireApproval,isAccumulated:lt.isAccumulated,noLimit:lt.noLimit});
    setEditLT(lt); setShowAddLT(true);
  }
  async function saveLT(){
    const payload={...ltForm,maxDaysPerYear:ltForm.noLimit?null:(ltForm.maxDaysPerYear?Number(ltForm.maxDaysPerYear):null)};
    if(editLT){
      const r=await apiFetch<LeaveType>(`/api/companies/${co.id}/leave-types/${editLT.id}`,{method:"PATCH",body:JSON.stringify(payload)});
      if(r.data){setLeaveTypes(leaveTypes.map(lt=>lt.id===r.data!.id?r.data!:lt));setShowAddLT(false);}
    } else {
      const r=await apiFetch<LeaveType>(`/api/companies/${co.id}/leave-types`,{method:"POST",body:JSON.stringify(payload)});
      if(r.data){setLeaveTypes([...leaveTypes,r.data]);setShowAddLT(false);}
    }
  }
  async function delLT(lt:LeaveType){
    await apiFetch(`/api/companies/${co.id}/leave-types/${lt.id}`,{method:"DELETE"});
    setLeaveTypes(leaveTypes.filter(x=>x.id!==lt.id));
  }
  async function addDefaultLTs(){
    const results=[];
    for(const lt of DEFAULT_LEAVE_TYPES){
      const r=await apiFetch<LeaveType>(`/api/companies/${co.id}/leave-types`,{method:"POST",body:JSON.stringify(lt)});
      if(r.data) results.push(r.data);
    }
    setLeaveTypes([...leaveTypes,...results]);
  }

  const TABS=[
    {key:"info",Icon:Building2,label:"ข้อมูลบริษัท"},
    {key:"dept",Icon:Folder,label:"แผนก & ตำแหน่ง"},
    {key:"holiday",Icon:CalendarDays,label:"วันหยุดประจำปี"},
    {key:"leave",Icon:Umbrella,label:"ประเภทการลา"},
  ];

  const LTIcon=ltForm.icon&&LEAVE_ICON_MAP[ltForm.icon]?LEAVE_ICON_MAP[ltForm.icon]:Umbrella;

  return (
    <div style={{fontFamily:F,padding:"28px 32px",background:BG,minHeight:"100vh"}}>
      {/* Back */}
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",cursor:"pointer",color:INK2,fontSize:13,marginBottom:20,fontFamily:F,padding:0}}>
        <ArrowLeft size={15} strokeWidth={2}/> บริษัท
      </button>

      {/* Header */}
      <div style={{background:WHITE,borderRadius:16,padding:"20px 24px",marginBottom:20,border:"1px solid #eaecef"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:56,height:56,borderRadius:14,background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:600}}>{co.code}</div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                <span style={{fontSize:18,fontWeight:600,color:INK}}>{co.name}</span>
                <StatusBadge status={co.status}/>
              </div>
              <div style={{fontSize:12,color:INK3}}>{co.nameTH} · Tax: {co.taxId||"—"} · รอบ: {co.payrollCycle}</div>
            </div>
          </div>
          {canEdit&&<Btn onClick={()=>setModal("editInfo")}><Pencil size={13} strokeWidth={2}/> แก้ไขข้อมูล</Btn>}
        </div>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:16}}>
          {[[co._count?.employees??0,"พนักงาน",CORAL],[depts.length,"แผนก",TEAL],[positions.length,"ตำแหน่ง","#534ab7"],[holidays.length,"วันหยุด",INK]].map(([n,l,c])=>(
            <div key={String(l)} style={{background:BG,borderRadius:10,padding:"12px 16px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:700,color:String(c)}}>{String(n)}</div>
              <div style={{fontSize:11,color:INK3,marginTop:2}}>{String(l)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:2,marginBottom:20,background:WHITE,padding:4,borderRadius:12,border:"1px solid #eaecef",width:"fit-content"}}>
        {TABS.map(({key,Icon,label})=>(
          <button key={key} onClick={()=>setTab(key as typeof tab)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,border:"none",cursor:"pointer",fontSize:13,fontWeight:tab===key?500:400,color:tab===key?TEAL:INK2,background:tab===key?"#e6faf9":"transparent",fontFamily:F,transition:"all .15s"}}>
            <Icon size={14} strokeWidth={tab===key?2:1.5}/> {label}
          </button>
        ))}
      </div>

      <div style={{background:WHITE,borderRadius:16,padding:"20px 24px",border:"1px solid #eaecef"}}>

        {/* ── Info Tab ── */}
        {tab==="info"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:600}}>
            {[["ชื่อบริษัท (EN)",co.name],["ชื่อบริษัท (TH)",co.nameTH],["รหัสย่อ",co.code],["เลขนิติบุคคล",co.taxId||"—"],["รอบเงินเดือน",co.payrollCycle],["ที่อยู่",co.address||"—"],["โทรศัพท์",co.phone||"—"],["อีเมล",co.email||"—"],["เว็บไซต์",co.website||"—"]].map(([l,v])=>(
              <div key={l} style={{background:BG,borderRadius:9,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:INK3,marginBottom:3}}>{l}</div>
                <div style={{fontSize:13,fontWeight:500,color:INK}}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Dept Tab ── */}
        {tab==="dept"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            {/* Departments */}
            <div>
              <div style={{fontSize:13,fontWeight:500,color:INK,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <Folder size={14} strokeWidth={1.8} color={TEAL}/> แผนก ({depts.length})
              </div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input value={deptInput} onChange={e=>setDeptInput(e.target.value)} placeholder="ชื่อแผนกใหม่..."
                  onKeyDown={e=>e.key==="Enter"&&deptInput.trim()&&addDept()}
                  style={{flex:1,fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
                {canEdit&&<Btn variant="teal" onClick={addDept} disabled={!deptInput.trim()}><Plus size={13} strokeWidth={2.5}/> เพิ่ม</Btn>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {depts.map(d=>(
                  <div key={d.id} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:BG,borderRadius:9}}>
                    <FolderOpen size={13} strokeWidth={1.8} color={TEAL}/>
                    {editDept?.id===d.id?(
                      <>
                        <input value={editDeptVal} onChange={e=>setEditDeptVal(e.target.value)} autoFocus
                          style={{flex:1,fontSize:13,padding:"4px 8px",borderRadius:6,border:`1.5px solid ${TEAL}`,fontFamily:F,outline:"none"}}/>
                        <IBtn Icon={Check} onClick={saveDept}/>
                        <IBtn Icon={X} onClick={()=>setEditDept(null)}/>
                      </>
                    ):(
                      <>
                        <span style={{flex:1,fontSize:13,color:INK}}>{d.name}</span>
                        <span style={{fontSize:11,color:INK3}}>{d._count?.employees??0} คน</span>
                        {canEdit&&<><IBtn Icon={Pencil} onClick={()=>{setEditDept(d);setEditDeptVal(d.name);}}/><IBtn Icon={Trash2} onClick={()=>delDept(d)}/></>}
                      </>
                    )}
                  </div>
                ))}
                {depts.length===0&&<div style={{fontSize:12,color:INK3,padding:"12px 0",textAlign:"center"}}>ยังไม่มีแผนก</div>}
              </div>
            </div>
            {/* Positions */}
            <div>
              <div style={{fontSize:13,fontWeight:500,color:INK,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <Award size={14} strokeWidth={1.8} color="#534ab7"/> ตำแหน่งงาน ({positions.length})
              </div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input value={posInput} onChange={e=>setPosInput(e.target.value)} placeholder="ชื่อตำแหน่งใหม่..."
                  onKeyDown={e=>e.key==="Enter"&&posInput.trim()&&addPos()}
                  style={{flex:1,fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
                {canEdit&&<Btn variant="teal" onClick={addPos} disabled={!posInput.trim()}><Plus size={13} strokeWidth={2.5}/> เพิ่ม</Btn>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {positions.map(p=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:BG,borderRadius:9}}>
                    <Award size={13} strokeWidth={1.8} color="#534ab7"/>
                    <span style={{flex:1,fontSize:13,color:INK}}>{p.name}</span>
                    {canEdit&&<IBtn Icon={Trash2} onClick={()=>delPos(p)}/>}
                  </div>
                ))}
                {positions.length===0&&<div style={{fontSize:12,color:INK3,padding:"12px 0",textAlign:"center"}}>ยังไม่มีตำแหน่ง</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── Holiday Tab ── */}
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
              <div style={{background:"#e6faf9",borderRadius:10,padding:"14px 16px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
                <div style={{flex:2,minWidth:160}}>
                  <div style={{fontSize:11,color:INK3,marginBottom:4}}>ชื่อวันหยุด</div>
                  <input value={newH.name} onChange={e=>setNewH({...newH,name:e.target.value})} placeholder="เช่น วันสงกรานต์"
                    style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,outline:"none"}}/>
                </div>
                <div style={{flex:1,minWidth:130}}>
                  <div style={{fontSize:11,color:INK3,marginBottom:4}}>วันที่</div>
                  <input type="date" value={newH.date} onChange={e=>setNewH({...newH,date:e.target.value})}
                    style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,outline:"none"}}/>
                </div>
                <div style={{flex:1,minWidth:120}}>
                  <div style={{fontSize:11,color:INK3,marginBottom:4}}>ประเภท</div>
                  <select value={newH.isNational?"national":"company"} onChange={e=>setNewH({...newH,isNational:e.target.value==="national"})}
                    style={{width:"100%",fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
                    <option value="national">นักขัตฤกษ์</option>
                    <option value="company">เฉพาะบริษัท</option>
                  </select>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <Btn variant="teal" onClick={addHoliday} disabled={!newH.name||!newH.date}><Check size={13} strokeWidth={2.5}/> บันทึก</Btn>
                  <Btn variant="ghost" onClick={()=>setShowAddH(false)}>ยกเลิก</Btn>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              <Dot color={TEAL}/><span style={{fontSize:11,color:INK3}}>นักขัตฤกษ์</span>
              <span style={{marginLeft:8,display:"inline-flex",alignItems:"center",gap:4}}><Dot color={YELLOW}/><span style={{fontSize:11,color:INK3}}>เฉพาะบริษัท</span></span>
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
                  <tr key={h.id} style={{background:BG,borderRadius:8}}>
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

        {/* ── Leave Tab ── */}
        {tab==="leave"&&(
          <div style={{maxWidth:700}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13,fontWeight:500,color:INK}}>ประเภทการลา</span>
                <span style={{background:"#e6faf9",color:"#007d75",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:500}}>{leaveTypes.length} ประเภท</span>
              </div>
              {canEdit&&(
                <div style={{display:"flex",gap:6}}>
                  {leaveTypes.length===0&&(
                    <Btn variant="ghost" onClick={addDefaultLTs}><Sparkles size={13} strokeWidth={2}/> เพิ่มค่าเริ่มต้น</Btn>
                  )}
                  <Btn variant="teal" onClick={openAddLT}><Plus size={13} strokeWidth={2.5}/> เพิ่มประเภทการลา</Btn>
                </div>
              )}
            </div>

            {leaveTypes.length===0&&(
              <div style={{padding:32,textAlign:"center",color:INK3,background:BG,borderRadius:14,border:"1px dashed #dde2e8"}}>
                <Umbrella size={32} strokeWidth={1.4} color={INK3} style={{margin:"0 auto 10px",display:"block"}}/>
                <div style={{fontSize:14,fontWeight:500,color:INK2,marginBottom:4}}>ยังไม่มีประเภทการลา</div>
                <div style={{fontSize:12,marginBottom:16}}>กดปุ่ม "เพิ่มค่าเริ่มต้น" เพื่อเพิ่มประเภทการลาพื้นฐานอัตโนมัติ</div>
              </div>
            )}

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
                      <div style={{fontSize:11,color:INK3,marginTop:2,display:"flex",gap:10}}>
                        <span>{lt.noLimit?"ไม่จำกัดวัน":`${lt.maxDaysPerYear??"-"} วัน/ปี`}</span>
                        <span style={{color:lt.isPaid?"#007d75":"#b36b00"}}>{lt.isPaid?"มีค่าจ้าง":"ไม่มีค่าจ้าง"}</span>
                        {lt.requireApproval&&<span>ต้องอนุมัติ</span>}
                        {lt.isAccumulated&&<span>สะสมได้</span>}
                      </div>
                    </div>
                    {canEdit&&(
                      <div style={{display:"flex",gap:6}}>
                        <IBtn Icon={Pencil} onClick={()=>openEditLT(lt)}/>
                        <IBtn Icon={Trash2} onClick={()=>delLT(lt)}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Info Modal */}
      {modal==="editInfo"&&(
        <Modal title="แก้ไขข้อมูลบริษัท" onClose={()=>setModal(null)} width={580}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <FI label="ชื่อบริษัท (TH)" value={infoForm.nameTH} onChange={v=>setInfoForm({...infoForm,nameTH:v})}/>
            <FI label="ชื่อบริษัท (EN)" value={infoForm.name} onChange={v=>setInfoForm({...infoForm,name:v})}/>
            <FI label="เลขนิติบุคคล (Tax ID)" value={infoForm.taxId} onChange={v=>setInfoForm({...infoForm,taxId:v})}/>
            <div>
              <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>รอบจ่ายเงินเดือน</div>
              <select value={infoForm.payrollCycle} onChange={e=>setInfoForm({...infoForm,payrollCycle:e.target.value})}
                style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
                {CYCLES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
            <FI label="ที่อยู่" value={infoForm.address} onChange={v=>setInfoForm({...infoForm,address:v})}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FI label="โทรศัพท์" value={infoForm.phone} onChange={v=>setInfoForm({...infoForm,phone:v})}/>
              <FI label="อีเมล" value={infoForm.email} onChange={v=>setInfoForm({...infoForm,email:v})}/>
              <FI label="เว็บไซต์" value={infoForm.website} onChange={v=>setInfoForm({...infoForm,website:v})}/>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,borderTop:"1px solid #eaecef",paddingTop:14}}>
            <Btn variant="ghost" onClick={()=>setModal(null)}>ยกเลิก</Btn>
            <Btn variant="teal" onClick={saveInfo}><Check size={13} strokeWidth={2.5}/> บันทึก</Btn>
          </div>
        </Modal>
      )}

      {/* Add/Edit Leave Type Modal */}
      {showAddLT&&(
        <Modal title={editLT?"แก้ไขประเภทการลา":"เพิ่มประเภทการลา"} onClose={()=>setShowAddLT(false)} width={480}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Preview */}
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:ltForm.color,borderRadius:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:"rgba(255,255,255,.5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <LTIcon size={18} strokeWidth={1.8} color={INK2}/>
              </div>
              <span style={{fontSize:14,fontWeight:500,color:INK}}>{ltForm.name||"ชื่อประเภทการลา"}</span>
            </div>
            <FI label="ชื่อประเภทการลา" value={ltForm.name} onChange={v=>setLtForm({...ltForm,name:v})} req/>
            {/* Icon picker */}
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
            {/* Color picker */}
            <div>
              <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>สี</div>
              <div style={{display:"flex",gap:6}}>
                {LEAVE_COLORS.map(c=>(
                  <button key={c} onClick={()=>setLtForm({...ltForm,color:c})}
                    style={{width:30,height:30,borderRadius:7,background:c,border:ltForm.color===c?`2.5px solid ${TEAL}`:"2px solid #eaecef",cursor:"pointer"}}/>
                ))}
              </div>
            </div>
            {/* Days */}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                <input type="checkbox" checked={ltForm.noLimit} onChange={e=>setLtForm({...ltForm,noLimit:e.target.checked})}/>
                <span style={{fontSize:13,color:INK2}}>ไม่จำกัดวัน</span>
              </label>
              {!ltForm.noLimit&&(
                <div style={{flex:1}}>
                  <input type="number" value={ltForm.maxDaysPerYear} onChange={e=>setLtForm({...ltForm,maxDaysPerYear:e.target.value})}
                    placeholder="จำนวนวันต่อปี" min={1}
                    style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
                </div>
              )}
            </div>
            {/* Options */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                ["isPaid","ลาแบบมีค่าจ้าง"],
                ["requireApproval","ต้องได้รับการอนุมัติ"],
                ["isAccumulated","สะสมข้ามปีได้"],
              ].map(([k,label])=>(
                <label key={k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 10px",borderRadius:8,background:BG}}>
                  <input type="checkbox" checked={ltForm[k as keyof typeof ltForm] as boolean}
                    onChange={e=>setLtForm({...ltForm,[k]:e.target.checked})}/>
                  <span style={{fontSize:13,color:INK}}>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,borderTop:"1px solid #eaecef",paddingTop:14,marginTop:16}}>
            <Btn variant="ghost" onClick={()=>setShowAddLT(false)}>ยกเลิก</Btn>
            <Btn variant="teal" onClick={saveLT} disabled={!ltForm.name}><Check size={13} strokeWidth={2.5}/> {editLT?"บันทึก":"เพิ่ม"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════
//  ROOT PAGE
// ════════════════════════════════════════
export default function CompaniesPage(){
  const {session}=useAuth();
  const [selected,setSelected]=useState<Company|null>(null);
  const canEdit=session?.role==="ADMIN"||session?.role==="HR";
  if(selected) return <CompanyDetail company={selected} onBack={()=>setSelected(null)} canEdit={canEdit}/>;
  return <CompanyList onSelect={setSelected} canEdit={canEdit}/>;
}
