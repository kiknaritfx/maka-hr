"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Building2, Users, X, Check,
  ChevronRight, MapPin, Calendar, Briefcase, Settings
} from "lucide-react";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

const TEAL="#00B4A9"; const CORAL="#FF6B6B"; const INK="#1C2833"; const INK2="#5a6a78"; const INK3="#9aaab8"; const BG="#F4F6F8"; const WHITE="#fff";
const F="'Prompt','Kanit',sans-serif";

interface Dept     { id:number; name:string; }
interface Pos      { id:number; name:string; }
interface Holiday  { id:number; name:string; date:string; year:number; isNational:boolean; }
interface Company  { id:number; code:string; name:string; nameTH:string; color:string; textColor:string; payrollCycle:string; status:string; departments:Dept[]; positions:Pos[]; _count?:{employees:number}; }

// ── Shared UI ──
function Btn({children,onClick,variant="ghost",disabled=false,style:sx={}}:{children:React.ReactNode;onClick?:()=>void;variant?:"primary"|"teal"|"ghost"|"danger";disabled?:boolean;style?:React.CSSProperties}){
  const v={primary:{background:CORAL,color:WHITE,border:"none"},teal:{background:TEAL,color:WHITE,border:"none"},ghost:{background:WHITE,color:INK2,border:"1px solid #dde2e8"},danger:{background:"#fff0f0",color:"#cc4444",border:"1px solid #f5c4b3"}};
  return <button onClick={disabled?undefined:onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:500,cursor:disabled?"default":"pointer",fontFamily:F,opacity:disabled?.5:1,...v[variant],...sx}}>{children}</button>;
}
function Modal({title,sub,onClose,children,width=500}:{title:string;sub?:string;onClose:()=>void;children:React.ReactNode;width?:number}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(28,40,51,.48)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,fontFamily:F}}>
      <div style={{background:WHITE,borderRadius:16,width,maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #eaecef"}}>
          <div><div style={{fontSize:15,fontWeight:500,color:INK}}>{title}</div>{sub&&<div style={{fontSize:12,color:INK3,marginTop:1}}>{sub}</div>}</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:INK3,display:"flex"}}><X size={18} strokeWidth={1.8}/></button>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"18px 20px"}}>{children}</div>
      </div>
    </div>
  );
}
function FI({label,value,onChange,placeholder,req=false,type="text"}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;req?:boolean;type?:string}){
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,color:INK3,marginBottom:4,textTransform:"uppercase" as const,letterSpacing:".4px"}}>{label}{req&&<span style={{color:CORAL}}> *</span>}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",boxSizing:"border-box" as const,fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none",background:WHITE}}/>
    </div>
  );
}
function Tag({label,onDelete}:{label:string;onDelete?:()=>void}){
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:5,background:BG,borderRadius:20,padding:"4px 10px",fontSize:12,color:INK2}}>
      {label}
      {onDelete&&<button onClick={onDelete} style={{background:"transparent",border:"none",cursor:"pointer",color:INK3,display:"flex",padding:0}}><X size={11} strokeWidth={2}/></button>}
    </div>
  );
}

const CO_COLORS:[string,string][]=[["#fff0f0","#cc4444"],["#e6faf9","#007d75"],["#eeedfe","#534ab7"],["#faeeda","#854f0b"],["#e6f1fb","#185fa5"],["#EAF3DE","#3B6D11"],["#fbeaf0","#993556"]];
const CYCLES=["สิ้นเดือน","วันที่ 25","วันที่ 15","ทุก 2 สัปดาห์"];
const THAI_MONTHS=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function formatDateTH(iso:string){
  const d=new Date(iso);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear()+543}`;
}

// ════════════════════════════════════════
//  COMPANY DETAIL PANEL (tabs)
// ════════════════════════════════════════
function CompanyDetail({company,onClose,onUpdate,canEdit}:{company:Company;onClose:()=>void;onUpdate:(c:Company)=>void;canEdit:boolean}){
  const [tab,setTab]=useState<"info"|"dept"|"position"|"holiday">("info");
  const [co,setCo]=useState<Company>(company);

  // Dept state
  const [depts,setDepts]=useState<Dept[]>([]);
  const [deptInput,setDeptInput]=useState("");
  const [deptEdit,setDeptEdit]=useState<Dept|null>(null);
  const [deptEditVal,setDeptEditVal]=useState("");

  // Position state
  const [positions,setPositions]=useState<Pos[]>([]);
  const [posInput,setPosInput]=useState("");
  const [posEdit,setPosEdit]=useState<Pos|null>(null);
  const [posEditVal,setPosEditVal]=useState("");

  // Holiday state
  const [holidays,setHolidays]=useState<Holiday[]>([]);
  const [hForm,setHForm]=useState({name:"",date:"",isNational:false});
  const [hYear,setHYear]=useState(new Date().getFullYear());

  // Info edit
  const [editInfo,setEditInfo]=useState(false);
  const [infoForm,setInfoForm]=useState({name:co.name,nameTH:co.nameTH,code:co.code,color:co.color,textColor:co.textColor,payrollCycle:co.payrollCycle});
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
    if(r.data){const updated={...co,...r.data};setCo(updated);onUpdate(updated);}
    setSaving(false);setEditInfo(false);
  }
  async function addDept(){
    if(!deptInput.trim())return;
    const r=await apiFetch<Dept>(`/api/companies/${co.id}/departments`,{method:"POST",body:JSON.stringify({name:deptInput.trim()})});
    if(r.data){setDepts([...depts,r.data]);setDeptInput("");}
    else alert(r.error);
  }
  async function saveDept(){
    if(!deptEdit||!deptEditVal.trim())return;
    const r=await apiFetch<Dept>(`/api/companies/${co.id}/departments/${deptEdit.id}`,{method:"PATCH",body:JSON.stringify({name:deptEditVal.trim()})});
    if(r.data){setDepts(depts.map(d=>d.id===deptEdit.id?r.data!:d));setDeptEdit(null);}
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
  async function savePos(){
    if(!posEdit||!posEditVal.trim())return;
    const r=await apiFetch<Pos>(`/api/companies/${co.id}/positions/${posEdit.id}`,{method:"PATCH",body:JSON.stringify({name:posEditVal.trim()})});
    if(r.data){setPositions(positions.map(p=>p.id===posEdit.id?r.data!:p));setPosEdit(null);}
  }
  async function delPos(p:Pos){
    const r=await apiFetch(`/api/companies/${co.id}/positions/${p.id}`,{method:"DELETE"});
    if(r.error){alert(r.error);return;}
    setPositions(positions.filter(x=>x.id!==p.id));
  }
  async function addHoliday(){
    if(!hForm.name.trim()||!hForm.date)return;
    const r=await apiFetch<Holiday>(`/api/companies/${co.id}/holidays`,{method:"POST",body:JSON.stringify(hForm)});
    if(r.data){setHolidays([...holidays,r.data].sort((a,b)=>a.date.localeCompare(b.date)));setHForm({name:"",date:"",isNational:false});}
  }
  async function delHoliday(h:Holiday){
    await apiFetch(`/api/companies/${co.id}/holidays/${h.id}`,{method:"DELETE"});
    setHolidays(holidays.filter(x=>x.id!==h.id));
  }

  const TABS=[{key:"info",Icon:Building2,label:"ข้อมูล"},{key:"dept",Icon:Users,label:`แผนก (${depts.length})`},{key:"position",Icon:Briefcase,label:`ตำแหน่ง (${positions.length})`},{key:"holiday",Icon:Calendar,label:"วันหยุด"}];

  return(
    <Modal title={co.name} sub={co.nameTH||co.code} onClose={onClose} width={620}>
      {/* Tabs */}
      <div style={{display:"flex",gap:4,borderBottom:"1px solid #eaecef",marginBottom:18,marginTop:-4}}>
        {TABS.map(({key,Icon,label})=>{
          const on=tab===key;
          return(
            <button key={key} onClick={()=>setTab(key as typeof tab)}
              style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",fontSize:12,fontWeight:on?500:400,color:on?TEAL:INK2,borderBottom:`2px solid ${on?TEAL:"transparent"}`,background:"transparent",border:"none",borderBottom:`2px solid ${on?TEAL:"transparent"}`,cursor:"pointer",fontFamily:F}}>
              <Icon size={13} strokeWidth={1.8}/>{label}
            </button>
          );
        })}
      </div>

      {/* Tab: ข้อมูล */}
      {tab==="info"&&(
        editInfo?(
          <div>
            <FI label="ชื่อบริษัท (EN)" req value={infoForm.name} onChange={v=>setInfoForm({...infoForm,name:v})}/>
            <FI label="ชื่อบริษัท (TH)" value={infoForm.nameTH} onChange={v=>setInfoForm({...infoForm,nameTH:v})}/>
            <FI label="รหัสบริษัท" req value={infoForm.code} onChange={v=>setInfoForm({...infoForm,code:v.toUpperCase()})}/>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:INK3,marginBottom:6,textTransform:"uppercase",letterSpacing:".4px"}}>รอบเงินเดือน</div>
              <select value={infoForm.payrollCycle} onChange={e=>setInfoForm({...infoForm,payrollCycle:e.target.value})}
                style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
                {CYCLES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:INK3,marginBottom:6,textTransform:"uppercase",letterSpacing:".4px"}}>สีประจำบริษัท</div>
              <div style={{display:"flex",gap:8}}>
                {CO_COLORS.map(([bg,tc])=>(
                  <button key={bg} onClick={()=>setInfoForm({...infoForm,color:bg,textColor:tc})}
                    style={{width:32,height:32,borderRadius:8,background:bg,border:infoForm.color===bg?`2.5px solid ${TEAL}`:"2px solid #eaecef",cursor:"pointer"}}/>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #eaecef",paddingTop:14}}>
              <Btn variant="ghost" onClick={()=>setEditInfo(false)}>ยกเลิก</Btn>
              <Btn variant="teal" onClick={saveInfo} disabled={saving}><Check size={13} strokeWidth={2}/> {saving?"กำลังบันทึก...":"บันทึก"}</Btn>
            </div>
          </div>
        ):(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:co.color,borderRadius:12,marginBottom:16}}>
              <div style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,.3)",color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500}}>{co.code}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:500,color:INK}}>{co.name}</div>
                <div style={{fontSize:12,color:INK2,marginTop:2}}>{co.nameTH}</div>
              </div>
              {canEdit&&<Btn variant="ghost" onClick={()=>{setInfoForm({name:co.name,nameTH:co.nameTH,code:co.code,color:co.color,textColor:co.textColor,payrollCycle:co.payrollCycle});setEditInfo(true);}} style={{fontSize:12}}><Pencil size={12} strokeWidth={1.8}/> แก้ไข</Btn>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[["จำนวนพนักงาน",`${co._count?.employees??0} คน`],["แผนก",`${depts.length} แผนก`],["ตำแหน่งงาน",`${positions.length} ตำแหน่ง`],["รอบเงินเดือน",co.payrollCycle],["สถานะ",co.status==="ACTIVE"?"ใช้งาน":"ปิดใช้งาน"]].map(([l,v])=>(
                <div key={l} style={{background:BG,borderRadius:9,padding:"10px 14px"}}>
                  <div style={{fontSize:11,color:INK3,marginBottom:3}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:500,color:INK}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Tab: แผนก */}
      {tab==="dept"&&(
        <div>
          {canEdit&&(
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <input value={deptInput} onChange={e=>setDeptInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addDept()} placeholder="ชื่อแผนกใหม่..."
                style={{flex:1,fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
              <Btn variant="teal" onClick={addDept} disabled={!deptInput.trim()}><Plus size={13} strokeWidth={2}/> เพิ่ม</Btn>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {depts.map(d=>(
              <div key={d.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:BG,borderRadius:9}}>
                {deptEdit?.id===d.id?(
                  <>
                    <input value={deptEditVal} onChange={e=>setDeptEditVal(e.target.value)} autoFocus
                      style={{flex:1,fontSize:13,padding:"5px 9px",borderRadius:7,border:`1px solid ${TEAL}`,fontFamily:F,outline:"none"}}/>
                    <button onClick={saveDept} style={{width:26,height:26,borderRadius:7,background:TEAL,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:WHITE}}><Check size={11} strokeWidth={2.5}/></button>
                    <button onClick={()=>setDeptEdit(null)} style={{width:26,height:26,borderRadius:7,background:"transparent",border:"1px solid #dde2e8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:INK3}}><X size={11} strokeWidth={2}/></button>
                  </>
                ):(
                  <>
                    <span style={{flex:1,fontSize:13,color:INK}}>{d.name}</span>
                    {canEdit&&<>
                      <button onClick={()=>{setDeptEdit(d);setDeptEditVal(d.name);}} style={{width:26,height:26,borderRadius:7,background:WHITE,border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:INK3}}><Pencil size={11} strokeWidth={1.8}/></button>
                      <button onClick={()=>delDept(d)} style={{width:26,height:26,borderRadius:7,background:WHITE,border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#cc4444"}}><Trash2 size={11} strokeWidth={1.8}/></button>
                    </>}
                  </>
                )}
              </div>
            ))}
            {depts.length===0&&<div style={{textAlign:"center",color:INK3,fontSize:12,padding:20}}>ยังไม่มีแผนก</div>}
          </div>
        </div>
      )}

      {/* Tab: ตำแหน่ง */}
      {tab==="position"&&(
        <div>
          {canEdit&&(
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <input value={posInput} onChange={e=>setPosInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPos()} placeholder="ชื่อตำแหน่งใหม่..."
                style={{flex:1,fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
              <Btn variant="teal" onClick={addPos} disabled={!posInput.trim()}><Plus size={13} strokeWidth={2}/> เพิ่ม</Btn>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {positions.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:BG,borderRadius:9}}>
                {posEdit?.id===p.id?(
                  <>
                    <input value={posEditVal} onChange={e=>setPosEditVal(e.target.value)} autoFocus
                      style={{flex:1,fontSize:13,padding:"5px 9px",borderRadius:7,border:`1px solid ${TEAL}`,fontFamily:F,outline:"none"}}/>
                    <button onClick={savePos} style={{width:26,height:26,borderRadius:7,background:TEAL,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:WHITE}}><Check size={11} strokeWidth={2.5}/></button>
                    <button onClick={()=>setPosEdit(null)} style={{width:26,height:26,borderRadius:7,background:"transparent",border:"1px solid #dde2e8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:INK3}}><X size={11} strokeWidth={2}/></button>
                  </>
                ):(
                  <>
                    <span style={{flex:1,fontSize:13,color:INK}}>{p.name}</span>
                    {canEdit&&<>
                      <button onClick={()=>{setPosEdit(p);setPosEditVal(p.name);}} style={{width:26,height:26,borderRadius:7,background:WHITE,border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:INK3}}><Pencil size={11} strokeWidth={1.8}/></button>
                      <button onClick={()=>delPos(p)} style={{width:26,height:26,borderRadius:7,background:WHITE,border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#cc4444"}}><Trash2 size={11} strokeWidth={1.8}/></button>
                    </>}
                  </>
                )}
              </div>
            ))}
            {positions.length===0&&<div style={{textAlign:"center",color:INK3,fontSize:12,padding:20}}>ยังไม่มีตำแหน่ง</div>}
          </div>
        </div>
      )}

      {/* Tab: วันหยุด */}
      {tab==="holiday"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <span style={{fontSize:12,color:INK3}}>ปี พ.ศ.</span>
            <select value={hYear} onChange={e=>setHYear(Number(e.target.value))}
              style={{fontSize:13,padding:"6px 10px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
              {[2566,2567,2568,2569,2570].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <span style={{fontSize:12,color:INK3,marginLeft:"auto"}}>{holidays.length} วัน</span>
          </div>
          {canEdit&&(
            <div style={{background:BG,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:500,color:INK,marginBottom:10}}>เพิ่มวันหยุด</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <input value={hForm.name} onChange={e=>setHForm({...hForm,name:e.target.value})} placeholder="ชื่อวันหยุด"
                  style={{fontSize:13,padding:"8px 10px",borderRadius:7,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
                <input type="date" value={hForm.date} onChange={e=>setHForm({...hForm,date:e.target.value})}
                  style={{fontSize:13,padding:"8px 10px",borderRadius:7,border:"1px solid #dde2e8",fontFamily:F,color:INK,outline:"none"}}/>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:INK2,cursor:"pointer"}}>
                  <input type="checkbox" checked={hForm.isNational} onChange={e=>setHForm({...hForm,isNational:e.target.checked})} style={{accentColor:TEAL}}/>
                  วันหยุดนักขัตฤกษ์
                </label>
                <Btn variant="teal" onClick={addHoliday} disabled={!hForm.name||!hForm.date} style={{fontSize:12,padding:"6px 12px"}}>
                  <Plus size={12} strokeWidth={2}/> เพิ่ม
                </Btn>
              </div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {holidays.map(h=>(
              <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:BG,borderRadius:9}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:h.isNational?CORAL:TEAL,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:INK}}>{h.name}</div>
                  <div style={{fontSize:11,color:INK3}}>{formatDateTH(h.date)}{h.isNational&&" · วันหยุดนักขัตฤกษ์"}</div>
                </div>
                {canEdit&&<button onClick={()=>delHoliday(h)} style={{width:26,height:26,borderRadius:7,background:WHITE,border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#cc4444"}}><Trash2 size={11} strokeWidth={1.8}/></button>}
              </div>
            ))}
            {holidays.length===0&&<div style={{textAlign:"center",color:INK3,fontSize:12,padding:20}}>ยังไม่มีวันหยุดในปีนี้</div>}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════
export default function CompaniesPage(){
  const {user}=useAuth();
  const canEdit=user?.role==="ADMIN"||user?.role==="HR";
  const [companies,setCompanies]=useState<Company[]>([]);
  const [loading,setLoading]=useState(true);
  const [addModal,setAddModal]=useState(false);
  const [detail,setDetail]=useState<Company|null>(null);
  const [form,setForm]=useState({name:"",nameTH:"",code:"",color:"#e6faf9",textColor:"#007d75",payrollCycle:"สิ้นเดือน"});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    apiFetch<Company[]>("/api/companies").then(r=>{if(r.data)setCompanies(r.data);}).finally(()=>setLoading(false));
  },[]);

  async function addCompany(){
    if(!form.name||!form.code)return;
    setSaving(true);
    const r=await apiFetch<Company>("/api/companies",{method:"POST",body:JSON.stringify(form)});
    if(r.data)setCompanies([...companies,{...r.data,departments:[],positions:[],_count:{employees:0}}]);
    else alert(r.error);
    setSaving(false);setAddModal(false);
  }

  function handleUpdate(updated:Company){
    setCompanies(companies.map(c=>c.id===updated.id?updated:c));
    if(detail?.id===updated.id)setDetail(updated);
  }

  return(
    <div style={{padding:"20px 28px",fontFamily:F,minHeight:"100%"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <div style={{fontSize:20,fontWeight:500,color:INK}}>จัดการบริษัท</div>
          <div style={{fontSize:12,color:INK3,marginTop:2}}>{companies.length} บริษัท ในระบบ</div>
        </div>
        {user?.role==="ADMIN"&&(
          <Btn variant="teal" onClick={()=>{setForm({name:"",nameTH:"",code:"",color:"#e6faf9",textColor:"#007d75",payrollCycle:"สิ้นเดือน"});setAddModal(true);}}>
            <Plus size={14} strokeWidth={2.5}/> เพิ่มบริษัท
          </Btn>
        )}
      </div>

      {/* Grid */}
      {loading?(
        <div style={{textAlign:"center",color:INK3,padding:48,fontSize:13}}>กำลังโหลด...</div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
          {companies.map(co=>(
            <div key={co.id} onClick={()=>setDetail(co)}
              style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:"16px 18px",cursor:"pointer",transition:"border-color .15s"}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=co.textColor)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#eaecef")}>
              {/* Card header */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,flexShrink:0}}>{co.code}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:500,fontSize:14,color:INK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.name}</div>
                  <div style={{fontSize:11,color:INK3,marginTop:1}}>{co.nameTH}</div>
                </div>
                <ChevronRight size={15} strokeWidth={1.8} color={INK3}/>
              </div>
              {/* Stats row */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                {[[co._count?.employees??0,"พนักงาน",TEAL],[co.departments?.length??0,"แผนก",CORAL],[co.positions?.length??0,"ตำแหน่ง","#534ab7"]].map(([v,l,c])=>(
                  <div key={String(l)} style={{background:BG,borderRadius:8,padding:"7px 8px",textAlign:"center"}}>
                    <div style={{fontSize:16,fontWeight:500,color:String(c)}}>{v}</div>
                    <div style={{fontSize:9,color:INK3,marginTop:1}}>{l}</div>
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:11,background:co.status==="ACTIVE"?"#e6faf9":"#f4f6f8",color:co.status==="ACTIVE"?TEAL:INK3,borderRadius:20,padding:"2px 9px",fontWeight:500}}>
                  {co.status==="ACTIVE"?"ใช้งาน":"ปิดใช้งาน"}
                </span>
                <span style={{fontSize:11,color:INK3}}>{co.payrollCycle}</span>
              </div>
            </div>
          ))}
          {companies.length===0&&(
            <div style={{gridColumn:"1/-1",textAlign:"center",padding:48,color:INK3}}>
              <Building2 size={40} strokeWidth={1.4} color={INK3} style={{margin:"0 auto 12px",display:"block"}}/>
              <div style={{fontSize:14,fontWeight:500,color:INK2,marginBottom:4}}>ยังไม่มีบริษัท</div>
              <div style={{fontSize:12}}>กดปุ่ม "เพิ่มบริษัท" เพื่อเริ่มต้น</div>
            </div>
          )}
        </div>
      )}

      {/* Add Company Modal */}
      {addModal&&(
        <Modal title="เพิ่มบริษัทใหม่" onClose={()=>setAddModal(false)}>
          <FI label="ชื่อบริษัท (EN)" req value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="Alpha Group Co., Ltd."/>
          <FI label="ชื่อบริษัท (TH)" value={form.nameTH} onChange={v=>setForm({...form,nameTH:v})} placeholder="อัลฟ่า กรุ๊ป"/>
          <FI label="รหัสบริษัท" req value={form.code} onChange={v=>setForm({...form,code:v.toUpperCase()})} placeholder="AG (2-5 ตัวอักษร)"/>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:INK3,marginBottom:4,textTransform:"uppercase",letterSpacing:".4px"}}>รอบเงินเดือน</div>
            <select value={form.payrollCycle} onChange={e=>setForm({...form,payrollCycle:e.target.value})}
              style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,color:INK}}>
              {CYCLES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:INK3,marginBottom:6,textTransform:"uppercase",letterSpacing:".4px"}}>สีประจำบริษัท</div>
            <div style={{display:"flex",gap:8}}>
              {CO_COLORS.map(([bg,tc])=>(
                <button key={bg} onClick={()=>setForm({...form,color:bg,textColor:tc})}
                  style={{width:32,height:32,borderRadius:8,background:bg,border:form.color===bg?`2.5px solid ${TEAL}`:"2px solid #eaecef",cursor:"pointer"}}/>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #eaecef",paddingTop:14}}>
            <Btn variant="ghost" onClick={()=>setAddModal(false)}>ยกเลิก</Btn>
            <Btn variant="teal" onClick={addCompany} disabled={saving||!form.name||!form.code}>
              <Plus size={13} strokeWidth={2}/> {saving?"กำลังบันทึก...":"เพิ่มบริษัท"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Detail panel */}
      {detail&&(
        <CompanyDetail
          company={detail}
          onClose={()=>setDetail(null)}
          onUpdate={handleUpdate}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
