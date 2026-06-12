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
interface Company  {
  id:number; code:string; name:string; nameTH:string; color:string; textColor:string;
  payrollCycle:string; status:string; taxId?:string; address?:string; phone?:string;
  email?:string; website?:string; departments:Dept[]; positions:Pos[];
  _count?:{employees:number};
}

// ── Helpers ──
const TH_MONTHS=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
function formatThai(iso:string){
  const d=new Date(iso); return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear()+543}`;
}
const CO_COLORS:[string,string][]=[["#fff0f0","#cc4444"],["#e6faf9","#007d75"],["#eeedfe","#534ab7"],["#faeeda","#854f0b"],["#e6f1fb","#185fa5"],["#fbeaf0","#993556"],["#EAF3DE","#3B6D11"]];
const CYCLES=["สิ้นเดือน","วันที่ 25","วันที่ 28","วันที่ 15","ทุก 2 สัปดาห์"];
const LEAVE_ICON_MAP:Record<string,React.ElementType>={Umbrella,HeartPulse,Briefcase,Baby,Users,Award,CalendarDays};

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

  useEffect(()=>{
    apiFetch<Company[]>("/api/companies").then(r=>{if(r.data)setCompanies(r.data);}).finally(()=>setLoading(false));
  },[]);

  const filtered=companies.filter(c=>
    c.name.toLowerCase().includes(search.toLowerCase())||
    c.nameTH.toLowerCase().includes(search.toLowerCase())||
    (c.taxId||"").includes(search)
  );

  async function saveCompany(){
    setSaving(true);
    const r=await apiFetch<Company>("/api/companies",{method:"POST",body:JSON.stringify(addForm)});
    if(r.data)setCompanies([...companies,{...r.data,departments:[],positions:[],_count:{employees:0}}]);
    else alert(r.error);
    setSaving(false);setShowAdd(false);setAddStep(1);
    setAddForm({name:"",nameTH:"",code:"",taxId:"",payrollCycle:"สิ้นเดือน",address:"",phone:"",email:"",website:"",color:"#e6faf9",textColor:"#007d75"});
  }

  const totalEmp=companies.reduce((s,c)=>s+(c._count?.employees??0),0);

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:F}}>
      {/* Header */}
      <div style={{padding:"20px 28px 16px",borderBottom:"1px solid #eaecef",background:WHITE}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:20,fontWeight:500,color:INK}}>บริษัทในระบบ</div>
            <div style={{fontSize:12,color:INK3,marginTop:2}}>จัดการบริษัท โครงสร้างองค์กร และวันหยุด</div>
          </div>
          {canEdit&&<Btn variant="primary" onClick={()=>setShowAdd(true)}><Plus size={14} strokeWidth={2.5}/> เพิ่มบริษัทใหม่</Btn>}
        </div>
      </div>

      <div style={{flex:1,overflow:"auto",padding:"20px 28px"}}>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[[String(companies.length),"บริษัททั้งหมด",TEAL],[String(totalEmp),"พนักงานรวม",CORAL],[String(companies.filter(c=>c.status==="ACTIVE").length),"บริษัท active","#3B6D11"],[String(companies.filter(c=>c.status!=="ACTIVE").length),"พักใช้งาน",INK3]].map(([n,l,c])=>(
            <div key={l} style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:"14px 16px"}}>
              <div style={{fontSize:26,fontWeight:500,color:c,lineHeight:1}}>{n}</div>
              <div style={{fontSize:12,color:INK3,marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{display:"flex",gap:10,marginBottom:14}}>
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
              {loading?<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:INK3}}>กำลังโหลด...</td></tr>
              :filtered.length===0?<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:INK3}}>ไม่พบบริษัท</td></tr>
              :filtered.map(c=>(
                <tr key={c.id} onClick={()=>onSelect(c)}
                  style={{borderTop:"1px solid #f0f2f5",cursor:"pointer"}}
                  onMouseEnter={e=>(e.currentTarget.style.background="#fafbfc")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:34,height:34,borderRadius:10,background:c.color,color:c.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,flexShrink:0}}>{c.code}</div>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:500,color:INK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                        <div style={{fontSize:11,color:INK3}}>{c.nameTH}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"12px 14px",color:INK2,fontSize:12}}>{c.taxId||"—"}</td>
                  <td style={{padding:"12px 14px",fontWeight:500,color:INK}}>{c._count?.employees??0}<span style={{fontSize:11,fontWeight:400,color:INK3}}> คน</span></td>
                  <td style={{padding:"12px 14px",color:INK2,fontSize:12}}>{c.payrollCycle}</td>
                  <td style={{padding:"12px 14px"}}><StatusBadge status={c.status}/></td>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                      <IBtn Icon={Building2} label="โครงสร้าง" onClick={()=>onSelect(c)}/>
                      <IBtn Icon={CalendarDays} label="วันหยุด" onClick={()=>onSelect(c)}/>
                      {canEdit&&<IBtn Icon={Pencil} label="แก้ไข" onClick={()=>onSelect(c)}/>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:"10px 16px",borderTop:"1px solid #f0f2f5",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:12,color:INK3}}>แสดง {filtered.length} จาก {companies.length} บริษัท</span>
            <div style={{display:"flex",gap:4}}>
              <IBtn Icon={ChevronLeft} label="ก่อนหน้า"/>
              <IBtn Icon={ChevronRight} label="ถัดไป"/>
            </div>
          </div>
        </div>
      </div>

      {/* Add Company Modal */}
      {showAdd&&(
        <Modal title="เพิ่มบริษัทใหม่" onClose={()=>{setShowAdd(false);setAddStep(1);}} width={560}>
          {/* Step indicator */}
          <div style={{display:"flex",gap:0,marginBottom:20,background:BG,borderRadius:10,padding:4}}>
            {["ข้อมูลพื้นฐาน","ที่อยู่ติดต่อ","เลือกสี"].map((s,i)=>(
              <div key={s} onClick={()=>i+1<addStep&&setAddStep(i+1)}
                style={{flex:1,padding:"7px 0",textAlign:"center",borderRadius:8,fontSize:12,fontWeight:addStep===i+1?500:400,color:addStep===i+1?TEAL:addStep>i+1?INK2:INK3,background:addStep===i+1?WHITE:"transparent",cursor:addStep>i+1?"pointer":"default"}}>
                {i+1}. {s}
              </div>
            ))}
          </div>

          {addStep===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <FI label="ชื่อบริษัท (TH)" req value={addForm.nameTH} onChange={v=>setAddForm({...addForm,nameTH:v})} placeholder="อัลฟ่า กรุ๊ป จำกัด"/>
                <FI label="ชื่อบริษัท (EN)" req value={addForm.name} onChange={v=>setAddForm({...addForm,name:v})} placeholder="Alpha Group Co., Ltd."/>
                <FI label="รหัสย่อ" req value={addForm.code} onChange={v=>setAddForm({...addForm,code:v.toUpperCase().slice(0,4)})} placeholder="AG"/>
                <FI label="เลขนิติบุคคล (Tax ID)" value={addForm.taxId} onChange={v=>setAddForm({...addForm,taxId:v})} placeholder="0105560012345"/>
              </div>
              <div>
                <div style={{fontSize:11,color:INK3,marginBottom:4,textTransform:"uppercase",letterSpacing:".4px"}}>รอบจ่ายเงินเดือน</div>
                <select value={addForm.payrollCycle} onChange={e=>setAddForm({...addForm,payrollCycle:e.target.value})}
                  style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
                  {CYCLES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {addStep===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <FI label="ที่อยู่" value={addForm.address} onChange={v=>setAddForm({...addForm,address:v})} placeholder="เลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <FI label="โทรศัพท์" value={addForm.phone} onChange={v=>setAddForm({...addForm,phone:v})} placeholder="02-xxx-xxxx"/>
                <FI label="อีเมล HR" type="email" value={addForm.email} onChange={v=>setAddForm({...addForm,email:v})} placeholder="hr@company.co.th"/>
                <FI label="เว็บไซต์" value={addForm.website} onChange={v=>setAddForm({...addForm,website:v})} placeholder="www.company.co.th"/>
              </div>
            </div>
          )}

          {addStep===3&&(
            <div>
              {/* Preview */}
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
              {/* Summary */}
              <div style={{background:BG,borderRadius:10,padding:"12px 14px",fontSize:12,color:INK2,lineHeight:2}}>
                <div><span style={{color:INK3}}>ชื่อ:</span> {addForm.name} · {addForm.nameTH}</div>
                <div><span style={{color:INK3}}>รหัส:</span> {addForm.code} · <span style={{color:INK3}}>Tax:</span> {addForm.taxId||"—"}</div>
                <div><span style={{color:INK3}}>รอบเงินเดือน:</span> {addForm.payrollCycle}</div>
              </div>
            </div>
          )}

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid #eaecef",paddingTop:14,marginTop:16}}>
            <span style={{fontSize:12,color:INK3}}>ขั้นตอนที่ {addStep} จาก 3</span>
            <div style={{display:"flex",gap:8}}>
              {addStep>1&&<Btn variant="ghost" onClick={()=>setAddStep(s=>s-1)}><ChevronLeft size={13} strokeWidth={2}/> ย้อนกลับ</Btn>}
              <Btn variant="ghost" onClick={()=>{setShowAdd(false);setAddStep(1);}}>ยกเลิก</Btn>
              {addStep<3
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
  const [modal,setModal]=useState<string|null>(null);

  // Dept
  const [depts,setDepts]=useState<Dept[]>([]);
  const [positions,setPositions]=useState<Pos[]>([]);
  const [deptInput,setDeptInput]=useState("");
  const [posInput,setPosInput]=useState("");
  const [editDept,setEditDept]=useState<Dept|null>(null);
  const [editDeptVal,setEditDeptVal]=useState("");

  // Holiday
  const [holidays,setHolidays]=useState<Holiday[]>([]);
  const [hYear,setHYear]=useState(new Date().getFullYear());
  const [showAddH,setShowAddH]=useState(false);
  const [newH,setNewH]=useState({name:"",date:"",isNational:true});

  // Edit info
  const [infoForm,setInfoForm]=useState({name:co.name,nameTH:co.nameTH,code:co.code,taxId:co.taxId||"",payrollCycle:co.payrollCycle,address:co.address||"",phone:co.phone||"",email:co.email||"",website:co.website||""});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    apiFetch<Dept[]>(`/api/companies/${co.id}/departments`).then(r=>{if(r.data)setDepts(r.data);});
    apiFetch<Pos[]>(`/api/companies/${co.id}/positions`).then(r=>{if(r.data)setPositions(r.data);});
  },[co.id]);

  useEffect(()=>{
    if(tab==="holiday")
      apiFetch<Holiday[]>(`/api/companies/${co.id}/holidays?year=${hYear}`).then(r=>{if(r.data)setHolidays(r.data);});
  },[tab,co.id,hYear]);

  async function saveInfo(){
    setSaving(true);
    const r=await apiFetch<Company>(`/api/companies/${co.id}`,{method:"PATCH",body:JSON.stringify(infoForm)});
    if(r.data)setCo({...co,...r.data});
    setSaving(false);setModal(null);
  }
  async function addDept(){
    if(!deptInput.trim())return;
    const r=await apiFetch<Dept>(`/api/companies/${co.id}/departments`,{method:"POST",body:JSON.stringify({name:deptInput.trim()})});
    if(r.data){setDepts([...depts,r.data]);setDeptInput("");}
    else alert(r.error);
  }
  async function saveDeptEdit(){
    if(!editDept||!editDeptVal.trim())return;
    const r=await apiFetch<Dept>(`/api/companies/${co.id}/departments/${editDept.id}`,{method:"PATCH",body:JSON.stringify({name:editDeptVal.trim()})});
    if(r.data){setDepts(depts.map(d=>d.id===editDept.id?r.data!:d));setEditDept(null);}
  }
  async function delDept(d:Dept){
    const r=await apiFetch(`/api/companies/${co.id}/departments/${d.id}`,{method:"DELETE"});
    if(r.error){alert(r.error);return;}
    setDepts(depts.filter(x=>x.id!==d.id));
  }
  async function addPos(){
    if(!posInput.trim())return;
    const r=await apiFetch<Pos>(`/api/companies/${co.id}/positions`,{method:"POST",body:JSON.stringify({name:posInput.trim()})});
    if(r.data){setPositions([...positions,r.data]);setPosInput("");}
    else alert(r.error);
  }
  async function delPos(p:Pos){
    const r=await apiFetch(`/api/companies/${co.id}/positions/${p.id}`,{method:"DELETE"});
    if(r.error){alert(r.error);return;}
    setPositions(positions.filter(x=>x.id!==p.id));
  }
  async function addHoliday(){
    if(!newH.name||!newH.date)return;
    const r=await apiFetch<Holiday>(`/api/companies/${co.id}/holidays`,{method:"POST",body:JSON.stringify({...newH,year:new Date(newH.date).getFullYear()+543})});
    if(r.data){setHolidays([...holidays,r.data].sort((a,b)=>a.date.localeCompare(b.date)));setNewH({name:"",date:"",isNational:true});setShowAddH(false);}
  }
  async function delHoliday(h:Holiday){
    await apiFetch(`/api/companies/${co.id}/holidays/${h.id}`,{method:"DELETE"});
    setHolidays(holidays.filter(x=>x.id!==h.id));
  }

  const TABS=[
    {key:"info",Icon:Building2,label:"ข้อมูลบริษัท"},
    {key:"dept",Icon:FolderOpen,label:`แผนก & ตำแหน่ง`},
    {key:"holiday",Icon:CalendarDays,label:"วันหยุดประจำปี"},
    {key:"leave",Icon:Umbrella,label:"ประเภทการลา"},
  ];

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:F}}>
      {/* Header */}
      <div style={{padding:"14px 28px 0",borderBottom:"1px solid #eaecef",background:WHITE}}>
        <button onClick={onBack} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:TEAL,background:"transparent",border:"none",cursor:"pointer",padding:"0 0 10px",fontFamily:F}}>
          <ArrowLeft size={13} strokeWidth={2}/> บริษัท
        </button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
          <div style={{width:52,height:52,borderRadius:14,background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:500}}>
            {co.code}
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:18,fontWeight:500,color:INK}}>{co.name}</span>
              <StatusBadge status={co.status}/>
            </div>
            <div style={{fontSize:12,color:INK3,marginTop:2}}>{co.nameTH} · Tax: {co.taxId||"—"} · รอบ: {co.payrollCycle}</div>
          </div>
          {canEdit&&<Btn variant="ghost" onClick={()=>{setInfoForm({name:co.name,nameTH:co.nameTH,code:co.code,taxId:co.taxId||"",payrollCycle:co.payrollCycle,address:co.address||"",phone:co.phone||"",email:co.email||"",website:co.website||""});setModal("editInfo");}}><Pencil size={13} strokeWidth={1.8}/> แก้ไขข้อมูล</Btn>}
        </div>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
          {[[co._count?.employees??0,"พนักงาน",CORAL],[depts.length,"แผนก",TEAL],[positions.length,"ตำแหน่ง","#534ab7"],[holidays.length,"วันหยุด",INK]].map(([n,l,c])=>(
            <div key={String(l)} style={{background:BG,borderRadius:10,padding:"10px 14px"}}>
              <div style={{fontSize:22,fontWeight:500,color:String(c),lineHeight:1}}>{n}</div>
              <div style={{fontSize:12,color:INK3,marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div style={{display:"flex",gap:0}}>
          {TABS.map(({key,Icon:Ic,label})=>{
            const on=tab===key;
            return <button key={key} onClick={()=>setTab(key as typeof tab)}
              style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 16px",fontSize:13,fontWeight:on?500:400,color:on?TEAL:INK2,borderBottom:`2px solid ${on?TEAL:"transparent"}`,background:"transparent",border:"none",cursor:"pointer",fontFamily:F}}>
              <Ic size={14} strokeWidth={1.8}/>{label}
            </button>;
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:"auto",padding:"20px 28px"}}>

        {/* ── Info Tab ── */}
        {tab==="info"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:700}}>
            {[["ชื่อบริษัท (EN)",co.name],["ชื่อบริษัท (TH)",co.nameTH],["รหัสย่อ",co.code],["เลขนิติบุคคล",co.taxId||"—"],["รอบเงินเดือน",co.payrollCycle],["สถานะ",co.status==="ACTIVE"?"ใช้งาน":"พักใช้งาน"]].map(([l,v])=>(
              <div key={l}>
                <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>{l}</div>
                <div style={{fontSize:13,color:INK,background:BG,borderRadius:8,padding:"9px 12px"}}>{v||<span style={{color:INK3}}>—</span>}</div>
              </div>
            ))}
            {co.address&&<div style={{gridColumn:"1/-1"}}>
              <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>ที่อยู่</div>
              <div style={{display:"flex",alignItems:"flex-start",gap:7,background:BG,borderRadius:8,padding:"9px 12px",fontSize:13,color:INK}}>
                <MapPin size={14} strokeWidth={1.8} color={INK3} style={{marginTop:1,flexShrink:0}}/>{co.address}
              </div>
            </div>}
            {[co.phone&&["โทรศัพท์",co.phone,Phone],co.email&&["อีเมล HR",co.email,Mail],co.website&&["เว็บไซต์",co.website,Globe]].filter(Boolean).map((item:unknown)=>{
              const [l,v,Ic]=(item as [string,string,React.ElementType]);
              return <div key={l}>
                <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>{l}</div>
                <div style={{display:"flex",alignItems:"center",gap:7,background:BG,borderRadius:8,padding:"9px 12px",fontSize:13,color:INK}}>
                  <Ic size={13} strokeWidth={1.8} color={INK3}/>{v}
                </div>
              </div>;
            })}
          </div>
        )}

        {/* ── Dept & Position Tab ── */}
        {tab==="dept"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:900}}>
            {/* Dept */}
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:500,color:INK,display:"flex",alignItems:"center",gap:6}}>
                  <Folder size={15} strokeWidth={1.8} color={INK3}/> แผนก <span style={{fontSize:12,fontWeight:400,color:INK3}}>({depts.length})</span>
                </div>
              </div>
              {canEdit&&(
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  <input value={deptInput} onChange={e=>setDeptInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDept()} placeholder="ชื่อแผนกใหม่..."
                    style={{flex:1,fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
                  <Btn variant="teal" onClick={addDept} disabled={!deptInput.trim()} style={{padding:"8px 12px"}}><Plus size={13} strokeWidth={2}/> เพิ่ม</Btn>
                </div>
              )}
              <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",overflow:"hidden"}}>
                {/* Company root */}
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:"1px solid #f0f2f5",background:BG}}>
                  <div style={{width:34,height:34,borderRadius:10,background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Building2 size={16} strokeWidth={1.8}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:INK}}>{co.name}</div>
                    <div style={{fontSize:11,color:INK3}}>บริษัท · {co._count?.employees??0} คน</div>
                  </div>
                </div>
                {depts.map(d=>(
                  <div key={d.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px 11px 40px",borderBottom:"1px solid #f0f2f5"}}>
                    <div style={{width:28,height:28,borderRadius:8,background:BG,display:"flex",alignItems:"center",justifyContent:"center",color:INK3,flexShrink:0}}>
                      <Folder size={13} strokeWidth={1.8}/>
                    </div>
                    {editDept?.id===d.id?(
                      <>
                        <input value={editDeptVal} onChange={e=>setEditDeptVal(e.target.value)} autoFocus
                          style={{flex:1,fontSize:13,padding:"5px 9px",borderRadius:7,border:`1px solid ${TEAL}`,fontFamily:F,outline:"none"}}/>
                        <button onClick={saveDeptEdit} style={{width:24,height:24,borderRadius:6,background:TEAL,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:WHITE}}><Check size={10} strokeWidth={2.5}/></button>
                        <button onClick={()=>setEditDept(null)} style={{width:24,height:24,borderRadius:6,background:"transparent",border:"1px solid #dde2e8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:INK3}}><X size={10} strokeWidth={2}/></button>
                      </>
                    ):(
                      <>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:500,color:INK}}>{d.name}</div>
                        </div>
                        {canEdit&&<>
                          <button onClick={()=>{setEditDept(d);setEditDeptVal(d.name);}} style={{width:24,height:24,borderRadius:6,background:"transparent",border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:INK3}}><Pencil size={11} strokeWidth={1.8}/></button>
                          <button onClick={()=>delDept(d)} style={{width:24,height:24,borderRadius:6,background:"transparent",border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#cc4444"}}><Trash2 size={11} strokeWidth={1.8}/></button>
                        </>}
                      </>
                    )}
                  </div>
                ))}
                {depts.length===0&&<div style={{padding:24,textAlign:"center",color:INK3,fontSize:13}}>ยังไม่มีแผนก</div>}
              </div>
            </div>

            {/* Positions */}
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:500,color:INK,display:"flex",alignItems:"center",gap:6}}>
                  <Award size={15} strokeWidth={1.8} color={INK3}/> ตำแหน่งงาน <span style={{fontSize:12,fontWeight:400,color:INK3}}>({positions.length})</span>
                </div>
              </div>
              {canEdit&&(
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  <input value={posInput} onChange={e=>setPosInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPos()} placeholder="ชื่อตำแหน่งใหม่..."
                    style={{flex:1,fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
                  <Btn variant="teal" onClick={addPos} disabled={!posInput.trim()} style={{padding:"8px 12px"}}><Plus size={13} strokeWidth={2}/> เพิ่ม</Btn>
                </div>
              )}
              <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{background:BG}}>
                    <th style={{padding:"9px 14px",textAlign:"left",fontSize:11,color:INK3,fontWeight:500}}>ตำแหน่ง</th>
                    {canEdit&&<th style={{padding:"9px 10px",width:60}}></th>}
                  </tr></thead>
                  <tbody>
                    {positions.map(p=>(
                      <tr key={p.id} style={{borderTop:"1px solid #f0f2f5"}}>
                        <td style={{padding:"11px 14px",fontWeight:500,color:INK}}>{p.name}</td>
                        {canEdit&&<td style={{padding:"11px 10px"}}>
                          <button onClick={()=>delPos(p)} style={{width:24,height:24,borderRadius:6,background:"transparent",border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#cc4444"}}><Trash2 size={11} strokeWidth={1.8}/></button>
                        </td>}
                      </tr>
                    ))}
                    {positions.length===0&&<tr><td colSpan={2} style={{padding:24,textAlign:"center",color:INK3,fontSize:13}}>ยังไม่มีตำแหน่ง</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Holiday Tab ── */}
        {tab==="holiday"&&(
          <div style={{maxWidth:700}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:15,fontWeight:500,color:INK}}>วันหยุดประจำปี</div>
                <select value={hYear} onChange={e=>setHYear(Number(e.target.value))}
                  style={{fontSize:12,padding:"4px 8px",borderRadius:7,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
                  {[2566,2567,2568,2569,2570].map(y=><option key={y} value={y}>{y+543}</option>)}
                </select>
                <span style={{background:"#e6faf9",color:"#007d75",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:500}}>{holidays.length} วัน</span>
              </div>
              {canEdit&&<Btn variant="teal" onClick={()=>setShowAddH(true)}><Plus size={13} strokeWidth={2.5}/> เพิ่มวันหยุด</Btn>}
            </div>
            <div style={{display:"flex",gap:16,marginBottom:12,fontSize:12,color:INK2}}>
              <span style={{display:"flex",alignItems:"center",gap:6}}><Dot color={TEAL}/> นักขัตฤกษ์</span>
              <span style={{display:"flex",alignItems:"center",gap:6}}><Dot color={YELLOW}/> เฉพาะบริษัท</span>
            </div>
            {showAddH&&(
              <div style={{background:"#e6faf9",border:"1px solid #9FE1CB",borderRadius:14,padding:16,marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:500,color:"#007d75",marginBottom:10}}>เพิ่มวันหยุดใหม่</div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10,marginBottom:10}}>
                  <input value={newH.name} onChange={e=>setNewH({...newH,name:e.target.value})} placeholder="ชื่อวันหยุด"
                    style={{fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #9FE1CB",fontFamily:F,background:WHITE,color:INK,outline:"none"}}/>
                  <input type="date" value={newH.date} onChange={e=>setNewH({...newH,date:e.target.value})}
                    style={{fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #9FE1CB",fontFamily:F,background:WHITE,color:INK,outline:"none"}}/>
                  <select value={newH.isNational?"national":"company"} onChange={e=>setNewH({...newH,isNational:e.target.value==="national"})}
                    style={{fontSize:13,padding:"8px 12px",borderRadius:8,border:"1px solid #9FE1CB",fontFamily:F,background:WHITE,color:INK}}>
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
            <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,tableLayout:"fixed"}}>
                <thead><tr style={{background:BG}}>
                  {[["วันที่","24%"],["ชื่อวันหยุด","44%"],["ประเภท","20%"],["","12%"]].map(([h,w])=>(
                    <th key={h} style={{padding:"9px 14px",textAlign:"left",fontSize:11,color:INK3,fontWeight:500,width:w}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {holidays.length===0&&<tr><td colSpan={4} style={{padding:24,textAlign:"center",color:INK3,fontSize:13}}>ยังไม่มีวันหยุดในปีนี้</td></tr>}
                  {holidays.map(h=>(
                    <tr key={h.id} style={{borderTop:"1px solid #f0f2f5",background:h.isNational?WHITE:"#fffdf0"}}>
                      <td style={{padding:"11px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <Dot color={h.isNational?TEAL:YELLOW}/>
                          <span style={{fontWeight:500,color:INK}}>{formatThai(h.date)}</span>
                        </div>
                      </td>
                      <td style={{padding:"11px 14px",color:INK}}>{h.name}</td>
                      <td style={{padding:"11px 14px"}}>
                        <span style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:h.isNational?"#e6faf9":"#fffbea",color:h.isNational?"#007d75":"#8a6d00"}}>
                          {h.isNational?"นักขัตฤกษ์":"เฉพาะบริษัท"}
                        </span>
                      </td>
                      <td style={{padding:"11px 14px"}}>
                        {canEdit&&<button onClick={()=>delHoliday(h)} style={{background:"transparent",border:"1px solid #eaecef",borderRadius:7,cursor:"pointer",padding:"4px 8px",color:INK3,display:"flex",alignItems:"center"}}><Trash2 size={13} strokeWidth={1.8}/></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Leave Tab (placeholder — ยังไม่มี API) ── */}
        {tab==="leave"&&(
          <div style={{maxWidth:660}}>
            <div style={{padding:32,textAlign:"center",color:INK3,background:WHITE,borderRadius:14,border:"1px dashed #dde2e8"}}>
              <Umbrella size={32} strokeWidth={1.4} color={INK3} style={{margin:"0 auto 10px",display:"block"}}/>
              <div style={{fontSize:14,fontWeight:500,color:INK2,marginBottom:4}}>ประเภทการลา</div>
              <div style={{fontSize:12}}>อยู่ระหว่างพัฒนา API สำหรับประเภทการลา</div>
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
            <FI label="ที่อยู่" value={infoForm.address} onChange={v=>setInfoForm({...infoForm,address:v})} placeholder="เลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <FI label="โทรศัพท์" value={infoForm.phone} onChange={v=>setInfoForm({...infoForm,phone:v})} placeholder="02-xxx-xxxx"/>
              <FI label="อีเมล HR" type="email" value={infoForm.email} onChange={v=>setInfoForm({...infoForm,email:v})} placeholder="hr@company.co.th"/>
              <FI label="เว็บไซต์" value={infoForm.website} onChange={v=>setInfoForm({...infoForm,website:v})} placeholder="www.company.co.th"/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #eaecef",paddingTop:14}}>
            <Btn variant="ghost" onClick={()=>setModal(null)}>ยกเลิก</Btn>
            <Btn variant="primary" onClick={saveInfo} disabled={saving}><Check size={13} strokeWidth={2.5}/> {saving?"กำลังบันทึก...":"บันทึก"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════
export default function CompaniesPage(){
  const {user}=useAuth();
  const canEdit=user?.role==="ADMIN"||user?.role==="HR";
  const [selected,setSelected]=useState<Company|null>(null);

  return selected
    ?<CompanyDetail company={selected} onBack={()=>setSelected(null)} canEdit={canEdit}/>
    :<CompanyList onSelect={setSelected} canEdit={canEdit}/>;
}
