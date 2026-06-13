"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, Check, X, ArrowLeft,
  Clock, ChevronLeft, ChevronRight, ChevronDown, Sun, Moon, Sunrise,
  UserCheck, Search, Calendar, LayoutList, Coffee, Umbrella, Download
} from "lucide-react";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

const TEAL="#00B4A9"; const CORAL="#FF6B6B"; const YELLOW="#FFD93D";
const BG="#F4F6F8"; const INK="#1C2833"; const INK2="#5a6a78"; const INK3="#9aaab8"; const WHITE="#fff";
const F="'Prompt','Kanit',sans-serif";

interface Company { id:number; code:string; name:string; nameTH:string; color:string; textColor:string; logoUrl?:string; _count?:{employees:number}; }
interface Shift {
  id:number; companyId:number; name:string; code:string;
  startTime:string; endTime:string; breakMins:number; hoursPerDay:number;
  workDays:number[]; shiftType:string; color:string; textColor:string;
  _count?:{employees:number};
}
interface Employee {
  id:number; empCode:string; firstName:string; lastName:string;
  shiftId:number|null; profileColor:string; profileTextColor:string;
  department?:{name:string}; position?:{name:string};
}
type CellType = "shift"|"off"|"leave";
interface CellEntry { shiftId:number|null; type:CellType; }
type Schedule = Record<string, Record<string, CellEntry>>; // "empId" -> "YYYY-MM-DD" -> entry

const SHIFT_TYPES:Record<string,{bg:string;color:string;label:string}> = {
  STANDARD: {bg:"#e6faf9",color:"#007d75",label:"ปกติ (จ–ศ)"},
  SHIFT:    {bg:"#eeedfe",color:"#534ab7",label:"กะหมุนเวียน"},
  ROTATING: {bg:"#faeeda",color:"#854f0b",label:"หมุนเวียนวันหยุด"},
  FLEXIBLE: {bg:"#EAF3DE",color:"#3B6D11",label:"ยืดหยุ่น"},
};
const SHIFT_COLORS=[
  {c:"#e6faf9",t:"#007d75"},{c:"#fffbea",t:"#8a6d00"},{c:"#eeedfe",t:"#534ab7"},
  {c:"#fff0f0",t:"#cc4444"},{c:"#faeeda",t:"#854f0b"},{c:"#e6f1fb",t:"#185fa5"},
  {c:"#EAF3DE",t:"#3B6D11"},{c:"#fbeaf0",t:"#993556"},
];
const DAYS_TH=["อา","จ","อ","พ","พฤ","ศ","ส"];
const DAYS_FULL=["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
const TH_MONTHS=["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function pad2(n:number){ return String(n).padStart(2,"0"); }
function dateKey(y:number,m:number,d:number){ return `${y}-${pad2(m+1)}-${pad2(d)}`; }
function initials(e:Employee){ return (e.firstName[0]||"")+(e.lastName[0]||""); }
function daysInMonth(y:number,m:number){ return new Date(y,m+1,0).getDate(); }

// ── helpers ──
function Avatar({emp,size=30}:{emp:Employee;size?:number}){
  return <div style={{width:size,height:size,borderRadius:Math.round(size*.3),background:emp.profileColor,color:emp.profileTextColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*.38),fontWeight:500,flexShrink:0}}>{initials(emp)}</div>;
}
function TimeIcon({start}:{start:string}){
  const h=parseInt(start);
  if(h>=5&&h<12)  return <Sunrise size={14} strokeWidth={1.8} color="#8a6d00"/>;
  if(h>=12&&h<18) return <Sun size={14} strokeWidth={1.8} color="#534ab7"/>;
  return <Moon size={14} strokeWidth={1.8} color="#185fa5"/>;
}
function Btn({children,onClick,variant="ghost",disabled=false,style:sx={}}:{children:React.ReactNode;onClick?:()=>void;variant?:string;disabled?:boolean;style?:React.CSSProperties}){
  const s:Record<string,React.CSSProperties>={
    primary:{background:CORAL,color:WHITE,border:"none"},
    teal:{background:TEAL,color:WHITE,border:"none"},
    ghost:{background:WHITE,color:INK2,border:"1px solid #dde2e8"},
    danger:{background:"#fff0f0",color:"#cc4444",border:"1px solid #f5c4b3"},
    active:{background:TEAL,color:WHITE,border:`1px solid ${TEAL}`},
  };
  return <button onClick={disabled?undefined:onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:10,fontSize:13,fontWeight:500,cursor:disabled?"default":"pointer",border:"none",fontFamily:F,opacity:disabled?.4:1,...(s[variant]||s.ghost),...sx}}>{children}</button>;
}
function IBtn({Icon,onClick,label,color=INK3}:{Icon:React.ElementType;onClick?:()=>void;label?:string;color?:string}){
  return <button aria-label={label} onClick={onClick} style={{width:28,height:28,borderRadius:7,background:"transparent",border:"1px solid #eaecef",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color}}><Icon size={13} strokeWidth={1.8}/></button>;
}
function FL({children,req=false}:{children:React.ReactNode;req?:boolean}){
  return <div style={{fontSize:11,color:INK3,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>{children}{req&&<span style={{color:CORAL}}> *</span>}</div>;
}
function FInput({label,value,onChange,placeholder,type="text",req=false}:{label:string;value:string;onChange:(e:any)=>void;placeholder?:string;type?:string;req?:boolean}){
  return <div><FL req={req}>{label}</FL><input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK,outline:"none"}}/></div>;
}
function FSelect({label,value,onChange,options}:{label:string;value:string;onChange:(e:any)=>void;options:{value:string;label:string}[]}){
  return <div><FL>{label}</FL><select value={value} onChange={onChange} style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
}
function Modal({title,sub,onClose,children,width=520}:{title:string;sub?:string;onClose:()=>void;children:React.ReactNode;width?:number}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(28,40,51,.46)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,fontFamily:F}}>
      <div style={{background:WHITE,borderRadius:16,width,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #eaecef"}}>
          <div><div style={{fontSize:15,fontWeight:500,color:INK}}>{title}</div>{sub&&<div style={{fontSize:12,color:INK3,marginTop:2}}>{sub}</div>}</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:INK3,display:"flex"}}><X size={18} strokeWidth={1.8}/></button>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"18px 20px"}}>{children}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  SCHEDULE CALENDAR
// ════════════════════════════════════════════════════════
function ScheduleCalendar({company,shifts,emps}:{company:Company;shifts:Shift[];emps:Employee[]}){
  const today=new Date();
  const [viewMode,setViewMode]=useState<"month"|"week">("month");
  const [year,setYear]=useState(today.getFullYear());
  const [month,setMonth]=useState(today.getMonth());
  const [weekStart,setWeekStart]=useState<Date>(()=>{
    const d=new Date(today);
    d.setDate(d.getDate()-d.getDay()+1);
    return d;
  });
  const [schedule,setSchedule]=useState<Schedule>({});
  const [popover,setPopover]=useState<{empId:number;dateKey:string;x:number;y:number}|null>(null);
  const popRef=useRef<HTMLDivElement>(null);
  const [saving,setSaving]=useState<string|null>(null); // dateKey+empId being saved

  // close popover on outside click
  useEffect(()=>{
    function h(e:MouseEvent){ if(popRef.current&&!popRef.current.contains(e.target as Node)) setPopover(null); }
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  // Generate date columns
  const dates:Date[] = viewMode==="month"
    ? Array.from({length:daysInMonth(year,month)},(_,i)=>new Date(year,month,i+1))
    : Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; });

  function navPrev(){
    if(viewMode==="month"){ if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }
    else { const d=new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); }
  }
  function navNext(){
    if(viewMode==="month"){ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }
    else { const d=new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); }
  }

  // Get entry for a cell
  function getEntry(empId:number,dk:string):CellEntry|null{
    return schedule[String(empId)]?.[dk]??null;
  }

  // Cell click → show popover
  function handleCellClick(empId:number,dk:string,e:React.MouseEvent<HTMLTableCellElement>){
    const rect=e.currentTarget.getBoundingClientRect();
    setPopover({empId,dateKey:dk,x:rect.left,y:rect.bottom+4});
  }

  // Set entry
  async function setEntry(empId:number,dk:string,entry:CellEntry|null){
    setSaving(`${empId}-${dk}`);
    setSchedule(prev=>{
      const next={...prev};
      if(!next[String(empId)]) next[String(empId)]={};
      if(entry===null){
        const copy={...next[String(empId)]};
        delete copy[dk];
        next[String(empId)]=copy;
      } else {
        next[String(empId)]={...next[String(empId)],[dk]:entry};
      }
      return next;
    });
    setPopover(null);
    setSaving(null);
  }

  // Fill entire row with a shift
  function fillRow(empId:number,shiftId:number,shiftObj:Shift){
    setSchedule(prev=>{
      const next={...prev};
      if(!next[String(empId)]) next[String(empId)]={};
      const copy={...next[String(empId)]};
      for(const d of dates){
        const dk=dateKey(d.getFullYear(),d.getMonth(),d.getDate());
        const dow=d.getDay();
        copy[dk]=shiftObj.workDays.includes(dow)
          ?{shiftId,type:"shift"}
          :{shiftId:null,type:"off"};
      }
      next[String(empId)]=copy;
      return next;
    });
  }

  // Summary per employee
  function calcSummary(empId:number){
    const empSched=schedule[String(empId)]||{};
    let workDays=0; let offDays=0; let leaveDays=0; let totalHours=0;
    for(const d of dates){
      const dk=dateKey(d.getFullYear(),d.getMonth(),d.getDate());
      const entry=empSched[dk];
      if(!entry){ /* unset */ continue; }
      if(entry.type==="off") offDays++;
      else if(entry.type==="leave") leaveDays++;
      else if(entry.type==="shift"){
        workDays++;
        const sh=shifts.find(s=>s.id===entry.shiftId);
        if(sh) totalHours+=sh.hoursPerDay;
      }
    }
    return {workDays,offDays,leaveDays,totalHours};
  }

  // Column count per date (for footer)
  function colCount(dk:string){
    return emps.filter(e=>{
      const en=getEntry(e.id,dk);
      return en?.type==="shift";
    }).length;
  }

  const periodLabel=viewMode==="month"
    ? `${TH_MONTHS[month]} ${year+543}`
    : (()=>{
        const end=new Date(weekStart); end.setDate(end.getDate()+6);
        return `${weekStart.getDate()} ${TH_MONTHS[weekStart.getMonth()]} – ${end.getDate()} ${TH_MONTHS[end.getMonth()]} ${end.getFullYear()+543}`;
      })();

  return(
    <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",overflow:"hidden",marginTop:20}}>
      {/* ── Header ── */}
      <div style={{padding:"14px 18px",borderBottom:"1px solid #eaecef",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Calendar size={16} strokeWidth={1.8} color={TEAL}/>
          <span style={{fontSize:14,fontWeight:500,color:INK}}>ตารางมอบหมายกะ</span>
        </div>

        {/* Period nav */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <IBtn Icon={ChevronLeft} label="ก่อน" onClick={navPrev}/>
          <span style={{fontSize:13,fontWeight:500,color:INK,minWidth:160,textAlign:"center"}}>{periodLabel}</span>
          <IBtn Icon={ChevronRight} label="ถัดไป" onClick={navNext}/>
        </div>

        {/* View toggle + actions */}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",background:BG,borderRadius:9,padding:3,gap:2}}>
            {(["week","month"] as const).map(v=>(
              <button key={v} onClick={()=>setViewMode(v)} style={{padding:"5px 12px",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",border:"none",fontFamily:F,background:viewMode===v?WHITE:BG,color:viewMode===v?INK:INK3,boxShadow:viewMode===v?"0 1px 4px rgba(0,0,0,.08)":"none"}}>
                {v==="week"?"สัปดาห์":"เดือน"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{padding:"8px 18px",borderBottom:"1px solid #f0f2f5",display:"flex",gap:14,flexWrap:"wrap",background:"#fafbfc"}}>
        {shifts.map(sh=>(
          <div key={sh.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
            <span style={{width:16,height:16,borderRadius:4,background:sh.color,display:"inline-block"}}/>
            <span style={{color:INK2,fontWeight:500}}>{sh.code}</span>
            <span style={{color:INK3}}>{sh.name}</span>
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
          <span style={{width:16,height:16,borderRadius:4,background:"#f0f2f5",display:"inline-block"}}/>
          <span style={{color:INK3}}>หยุด</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
          <span style={{width:16,height:16,borderRadius:4,background:"#fff0f0",display:"inline-block"}}/>
          <span style={{color:"#cc4444"}}>ลา</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{overflowX:"auto"}}>
        <table style={{borderCollapse:"collapse",fontSize:12,fontFamily:F,minWidth:"100%"}}>
          <thead>
            <tr style={{background:BG}}>
              {/* sticky employee col */}
              <th style={{position:"sticky",left:0,zIndex:10,background:BG,padding:"8px 14px",textAlign:"left",fontSize:11,color:INK3,fontWeight:500,minWidth:160,borderRight:"1px solid #eaecef"}}>พนักงาน</th>
              <th style={{position:"sticky",left:160,zIndex:10,background:BG,padding:"8px 10px",textAlign:"center",fontSize:11,color:INK3,fontWeight:500,minWidth:52,borderRight:"1px solid #f0f2f5"}}>ชม.</th>
              {dates.map(d=>{
                const isToday=d.toDateString()===today.toDateString();
                const isSun=d.getDay()===0; const isSat=d.getDay()===6;
                return(
                  <th key={d.toISOString()} style={{padding:"6px 4px",textAlign:"center",minWidth:42,fontSize:10,color:isToday?CORAL:isSat||isSun?"#cc4444":INK3,fontWeight:isToday?600:400,background:isToday?"#fff4f4":BG,borderLeft:"1px solid #f0f2f5"}}>
                    <div style={{fontSize:9,opacity:.7}}>{DAYS_TH[d.getDay()]}</div>
                    <div style={{fontSize:11,fontWeight:isToday?700:500,color:isToday?CORAL:isSat||isSun?"#cc4444":INK}}>{d.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {emps.map((emp,ei)=>{
              const {workDays,offDays,leaveDays,totalHours}=calcSummary(emp.id);
              return(
                <tr key={emp.id} style={{borderTop:"1px solid #f0f2f5",background:ei%2===0?WHITE:"#fafbfc"}}>
                  {/* Employee info - sticky */}
                  <td style={{position:"sticky",left:0,zIndex:9,background:ei%2===0?WHITE:"#fafbfc",padding:"8px 14px",borderRight:"1px solid #eaecef",minWidth:160}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Avatar emp={emp} size={26}/>
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:500,color:INK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{emp.firstName} {emp.lastName}</div>
                        <div style={{fontSize:10,color:INK3}}>{emp.empCode}</div>
                      </div>
                    </div>
                    {/* Quick fill buttons */}
                    <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
                      {shifts.map(sh=>(
                        <button key={sh.id} title={`เติมทั้งหมดด้วย ${sh.name}`} onClick={()=>fillRow(emp.id,sh.id,sh)}
                          style={{fontSize:9,padding:"2px 6px",borderRadius:4,border:"none",background:sh.color,color:sh.textColor,cursor:"pointer",fontFamily:F,fontWeight:500}}>
                          {sh.code}
                        </button>
                      ))}
                    </div>
                  </td>
                  {/* Hours summary - sticky */}
                  <td style={{position:"sticky",left:160,zIndex:9,background:ei%2===0?WHITE:"#fafbfc",padding:"4px 8px",textAlign:"center",borderRight:"1px solid #f0f2f5",minWidth:52}}>
                    <div style={{fontSize:13,fontWeight:600,color:TEAL,lineHeight:1.2}}>{totalHours>0?totalHours:"—"}</div>
                    <div style={{fontSize:9,color:INK3}}>ชม.</div>
                    {(offDays>0||leaveDays>0)&&(
                      <div style={{fontSize:9,color:INK3,marginTop:2,lineHeight:1.3}}>
                        {offDays>0&&<span>หยุด {offDays}ว</span>}
                        {leaveDays>0&&<span style={{color:"#cc4444",display:"block"}}>ลา {leaveDays}ว</span>}
                      </div>
                    )}
                  </td>
                  {/* Date cells */}
                  {dates.map(d=>{
                    const dk=dateKey(d.getFullYear(),d.getMonth(),d.getDate());
                    const entry=getEntry(emp.id,dk);
                    const sh=entry?.type==="shift"?shifts.find(s=>s.id===entry.shiftId):null;
                    const isToday=d.toDateString()===today.toDateString();
                    const isSun=d.getDay()===0; const isSat=d.getDay()===6;
                    const isActive=popover?.empId===emp.id&&popover?.dateKey===dk;
                    let bg=isToday?"#fffbe6":isSat||isSun?"#fafbfc":WHITE;
                    let cellContent:React.ReactNode=null;
                    if(entry?.type==="off"){ bg="#f4f6f8"; cellContent=<span style={{fontSize:9,color:INK3}}>หยุด</span>; }
                    else if(entry?.type==="leave"){ bg="#fff0f0"; cellContent=<span style={{fontSize:9,color:"#cc4444",fontWeight:500}}>ลา</span>; }
                    else if(sh){ bg=sh.color; cellContent=<span style={{fontSize:10,fontWeight:600,color:sh.textColor}}>{sh.code}</span>; }
                    return(
                      <td key={dk} onClick={ev=>handleCellClick(emp.id,dk,ev)}
                        style={{padding:"2px 2px",textAlign:"center",cursor:"pointer",background:isActive?"#e6faf9":bg,borderLeft:"1px solid #f0f2f5",transition:"background .1s",height:44,verticalAlign:"middle",outline:isActive?`2px solid ${TEAL}`:"none",outlineOffset:-2}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}>
                          {cellContent||<span style={{fontSize:9,color:"#dde2e8"}}>·</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Footer - count per day */}
            <tr style={{borderTop:"2px solid #eaecef",background:BG}}>
              <td style={{position:"sticky",left:0,zIndex:9,background:BG,padding:"6px 14px",fontSize:11,color:INK3,fontWeight:500,borderRight:"1px solid #eaecef"}}>รวม</td>
              <td style={{position:"sticky",left:160,zIndex:9,background:BG,borderRight:"1px solid #f0f2f5"}}/>
              {dates.map(d=>{
                const dk=dateKey(d.getFullYear(),d.getMonth(),d.getDate());
                const cnt=colCount(dk);
                return(
                  <td key={dk} style={{padding:"6px 4px",textAlign:"center",fontSize:11,fontWeight:500,color:cnt>0?TEAL:INK3,borderLeft:"1px solid #f0f2f5"}}>
                    {cnt>0?cnt:"—"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Cell Popover ── */}
      {popover&&(
        <div ref={popRef} style={{position:"fixed",left:Math.min(popover.x,window.innerWidth-220),top:popover.y,zIndex:600,background:WHITE,borderRadius:12,boxShadow:"0 4px 20px rgba(28,40,51,.15)",border:"1px solid #eaecef",padding:10,width:210,fontFamily:F}}>
          <div style={{fontSize:11,color:INK3,marginBottom:8,fontWeight:500}}>เลือกกะ / สถานะ</div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {shifts.map(sh=>(
              <button key={sh.id} onClick={()=>setEntry(popover.empId,popover.dateKey,{shiftId:sh.id,type:"shift"})}
                style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:`1px solid ${sh.textColor}33`,background:sh.color,cursor:"pointer",fontFamily:F,textAlign:"left"}}>
                <div style={{width:28,height:28,borderRadius:7,background:"rgba(255,255,255,.5)",color:sh.textColor,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <TimeIcon start={sh.startTime}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:sh.textColor}}>{sh.code} — {sh.name}</div>
                  <div style={{fontSize:10,color:sh.textColor,opacity:.8}}>{sh.startTime}–{sh.endTime} · {sh.hoursPerDay}ชม.</div>
                </div>
                {getEntry(popover.empId,popover.dateKey)?.shiftId===sh.id&&<Check size={12} strokeWidth={2.5} color={sh.textColor}/>}
              </button>
            ))}
            <div style={{borderTop:"1px solid #f0f2f5",marginTop:4,paddingTop:4,display:"flex",gap:4}}>
              <button onClick={()=>setEntry(popover.empId,popover.dateKey,{shiftId:null,type:"off"})}
                style={{flex:1,padding:"6px 8px",borderRadius:8,border:"1px solid #eaecef",background:"#f4f6f8",cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:500,color:INK3,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <Coffee size={11} strokeWidth={2}/> วันหยุด
              </button>
              <button onClick={()=>setEntry(popover.empId,popover.dateKey,{shiftId:null,type:"leave"})}
                style={{flex:1,padding:"6px 8px",borderRadius:8,border:"1px solid #f5c4c4",background:"#fff0f0",cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:500,color:"#cc4444",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <Umbrella size={11} strokeWidth={2}/> วันลา
              </button>
              <button onClick={()=>setEntry(popover.empId,popover.dateKey,null)}
                style={{width:30,padding:"6px",borderRadius:8,border:"1px solid #eaecef",background:WHITE,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:INK3}}>
                <X size={11} strokeWidth={2}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  SHIFT MODAL (Add/Edit)
// ════════════════════════════════════════════════════════
function ShiftModal({shift,companyId,onClose,onSave}:{shift:Shift|null;companyId:number;onClose:()=>void;onSave:(s:Shift)=>void}){
  const isEdit=!!shift;
  const [form,setForm]=useState({
    name:shift?.name??"", code:shift?.code??"",
    startTime:shift?.startTime??"08:00", endTime:shift?.endTime??"17:00",
    breakMins:shift?.breakMins??60, hoursPerDay:shift?.hoursPerDay??8,
    workDays:shift?.workDays??[1,2,3,4,5],
    shiftType:shift?.shiftType??"STANDARD",
    color:shift?.color??"#e6faf9", textColor:shift?.textColor??"#007d75",
  });
  const [saving,setSaving]=useState(false);

  function calcHours(start:string,end:string,brk:number){
    if(!start||!end) return form.hoursPerDay;
    const [sh,sm]=start.split(":").map(Number);
    const [eh,em]=end.split(":").map(Number);
    let mins=(eh*60+em)-(sh*60+sm);
    if(mins<=0) mins+=1440;
    const net=Math.round(((mins-brk)/60)*10)/10;
    return net>0?net:0;
  }
  function toggleDay(d:number){
    setForm(f=>({...f,workDays:f.workDays.includes(d)?f.workDays.filter((x:number)=>x!==d):[...f.workDays,d].sort((a:number,b:number)=>a-b)}));
  }
  async function save(){
    setSaving(true);
    const payload={...form,companyId,hoursPerDay:calcHours(form.startTime,form.endTime,form.breakMins)};
    const r:any=isEdit
      ? await apiFetch(`/api/shifts/${shift!.id}`,{method:"PATCH",body:JSON.stringify(payload)})
      : await apiFetch("/api/shifts",{method:"POST",body:JSON.stringify(payload)});
    if(r.data) onSave(r.data as Shift);
    setSaving(false);
  }
  const isNight=(()=>{ const [sh,sm]=form.startTime.split(":").map(Number); const [eh,em]=form.endTime.split(":").map(Number); return (eh*60+em)-(sh*60+sm)<=0; })();

  return(
    <Modal title={isEdit?"แก้ไขกะการทำงาน":"เพิ่มกะการทำงาน"} onClose={onClose} width={540}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:form.color,borderRadius:12,marginBottom:18}}>
        <div style={{width:40,height:40,borderRadius:11,background:"rgba(255,255,255,.4)",color:form.textColor,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><TimeIcon start={form.startTime}/></div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:500,color:form.textColor}}>{form.name||"ชื่อกะ"}</div>
          <div style={{fontSize:12,color:form.textColor,opacity:.8}}>{form.startTime} – {form.endTime} · {calcHours(form.startTime,form.endTime,form.breakMins)} ชม./วัน</div>
        </div>
        <div style={{display:"flex",gap:4}}>{DAYS_TH.map((d,i)=>(<div key={d} style={{width:22,height:22,borderRadius:6,background:form.workDays.includes(i)?"rgba(255,255,255,.5)":"rgba(255,255,255,.15)",color:form.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500}}>{d}</div>))}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <FInput req label="ชื่อกะ" value={form.name} onChange={(e:any)=>setForm({...form,name:e.target.value})} placeholder="เช่น กะเช้า"/>
        <FInput req label="รหัสกะ" value={form.code} onChange={(e:any)=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="เช่น AM"/>
        <div><FL>เวลาเริ่ม</FL><input type="time" value={form.startTime} onChange={(e:any)=>{const s=e.target.value;setForm((f:any)=>({...f,startTime:s,hoursPerDay:calcHours(s,f.endTime,f.breakMins)}));}} style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK,outline:"none"}}/></div>
        <div><FL>เวลาสิ้นสุด</FL><input type="time" value={form.endTime} onChange={(e:any)=>{const en=e.target.value;setForm((f:any)=>({...f,endTime:en,hoursPerDay:calcHours(f.startTime,en,f.breakMins)}));}} style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK,outline:"none"}}/></div>
        <div><FL>พักกลางวัน (นาที)</FL><input type="number" value={String(form.breakMins)} onChange={(e:any)=>{const b=parseInt(e.target.value)||0;setForm((f:any)=>({...f,breakMins:b,hoursPerDay:calcHours(f.startTime,f.endTime,b)}));}} style={{width:"100%",boxSizing:"border-box",fontSize:13,padding:"9px 12px",borderRadius:8,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK,outline:"none"}}/></div>
        <div><FL>ชั่วโมงทำงาน/วัน</FL><div style={{fontSize:16,fontWeight:500,color:TEAL,padding:"9px 12px",background:BG,borderRadius:8}}>{calcHours(form.startTime,form.endTime,form.breakMins)} ชั่วโมง</div></div>
        <div style={{gridColumn:"1/-1"}}><FSelect label="ประเภทกะ" value={form.shiftType} onChange={(e:any)=>setForm({...form,shiftType:e.target.value})} options={Object.entries(SHIFT_TYPES).map(([k,v])=>({value:k,label:v.label}))}/></div>
      </div>
      <div style={{marginBottom:14}}>
        <FL>วันทำงาน ({form.workDays.length} วัน/สัปดาห์)</FL>
        <div style={{display:"flex",gap:6}}>
          {DAYS_FULL.map((d,i)=>{const on=form.workDays.includes(i);const isWknd=i===0||i===6;return(<button key={d} type="button" onClick={()=>toggleDay(i)} style={{flex:1,padding:"8px 4px",borderRadius:9,border:`2px solid ${on?form.textColor:"#dde2e8"}`,background:on?form.color:WHITE,cursor:"pointer",fontFamily:F}}><div style={{fontSize:11,fontWeight:on?500:400,color:on?form.textColor:isWknd?"#cc4444":INK2}}>{DAYS_TH[i]}</div></button>);})}
        </div>
        <div style={{display:"flex",gap:6,marginTop:8}}>
          {([["จ–ศ",[1,2,3,4,5]],["จ–เสาร์",[1,2,3,4,5,6]],["ทุกวัน",[0,1,2,3,4,5,6]]] as [string,number[]][]).map(([label,days])=>(<button key={label} type="button" onClick={()=>setForm({...form,workDays:days})} style={{fontSize:11,padding:"4px 10px",borderRadius:7,border:"1px solid #dde2e8",background:WHITE,cursor:"pointer",fontFamily:F,color:INK2}}>{label}</button>))}
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <FL>สีกะ</FL>
        <div style={{display:"flex",gap:6}}>{SHIFT_COLORS.map((sc,i)=>(<button key={i} type="button" onClick={()=>setForm({...form,color:sc.c,textColor:sc.t})} style={{width:28,height:28,borderRadius:7,background:sc.c,border:form.color===sc.c?`2.5px solid ${TEAL}`:"2px solid transparent",cursor:"pointer"}}/>))}</div>
      </div>
      {isNight&&<div style={{background:"#e6f1fb",border:"1px solid #b3d4f5",borderRadius:9,padding:"9px 12px",marginBottom:14,display:"flex",gap:7,fontSize:12,color:"#185fa5"}}><Moon size={13} strokeWidth={2} style={{flexShrink:0,marginTop:1}}/> กะข้ามคืน</div>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #eaecef",paddingTop:14}}>
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn variant="primary" onClick={save} disabled={saving||!form.name.trim()||!form.code.trim()}><Check size={13} strokeWidth={2.5}/> {saving?"กำลังบันทึก...":isEdit?"บันทึก":"เพิ่มกะ"}</Btn>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════
//  SHIFT ASSIGN MODAL
// ════════════════════════════════════════════════════════
function ShiftAssignModal({shift,allShifts,emps,onClose,onSave}:{shift:Shift;allShifts:Shift[];emps:Employee[];onClose:()=>void;onSave:(empId:number,shiftId:number|null)=>void}){
  const [localEmps,setLocalEmps]=useState(emps.map(e=>({...e})));
  const [search,setSearch]=useState("");
  const [saving,setSaving]=useState(false);
  const inShift=localEmps.filter(e=>e.shiftId===shift.id);
  const notInShift=localEmps.filter(e=>e.shiftId!==shift.id&&(`${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())||e.empCode.toLowerCase().includes(search.toLowerCase())));

  async function save(){
    setSaving(true);
    const original=new Map(emps.map(e=>[e.id,e.shiftId]));
    const changed=localEmps.filter(e=>e.shiftId!==original.get(e.id));
    for(const e of changed){ await apiFetch(`/api/employees/${e.id}`,{method:"PATCH",body:JSON.stringify({shiftId:e.shiftId})}); onSave(e.id,e.shiftId); }
    setSaving(false); onClose();
  }

  return(
    <Modal title={`กะเริ่มต้น — ${shift.name}`} sub={`กำหนดพนักงานที่ใช้กะนี้เป็นค่าเริ่มต้น · ${shift.startTime}–${shift.endTime}`} onClose={onClose} width={540}>
      <div style={{marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:500,color:INK}}>พนักงานในกะนี้</div>
          <span style={{fontSize:11,background:shift.color,color:shift.textColor,borderRadius:20,padding:"2px 9px",fontWeight:500}}>{inShift.length} คน</span>
        </div>
        {inShift.length===0?<div style={{padding:"16px",textAlign:"center",color:INK3,fontSize:12,background:BG,borderRadius:10}}>ยังไม่มีพนักงานในกะนี้</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {inShift.map(e=>(
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:shift.color,borderRadius:10,border:`1px solid ${shift.textColor}33`}}>
                <Avatar emp={e} size={30}/>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:INK}}>{e.firstName} {e.lastName}</div><div style={{fontSize:11,color:INK3}}>{e.empCode}</div></div>
                {allShifts.length>1&&(<select value={e.shiftId??""} onChange={ev=>setLocalEmps(prev=>prev.map(x=>x.id===e.id?{...x,shiftId:Number(ev.target.value)}:x))} style={{fontSize:11,padding:"4px 8px",borderRadius:7,border:"1px solid #dde2e8",fontFamily:F,background:WHITE,color:INK,maxWidth:110}}>{allShifts.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>)}
                <button onClick={()=>setLocalEmps(prev=>prev.map(x=>x.id===e.id?{...x,shiftId:null}:x))} style={{width:26,height:26,borderRadius:7,background:"rgba(255,255,255,.6)",border:`1px solid ${shift.textColor}44`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#cc4444"}}><X size={12} strokeWidth={2.5}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{borderTop:"1px solid #eaecef",paddingTop:16}}>
        <div style={{fontSize:13,fontWeight:500,color:INK,marginBottom:10}}>เพิ่มพนักงานเข้ากะ</div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:BG,border:"1px solid #dde2e8",borderRadius:9,padding:"0 12px",height:36,marginBottom:10}}>
          <Search size={13} strokeWidth={1.8} color={INK3}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อหรือรหัสพนักงาน..." style={{border:"none",background:"transparent",outline:"none",fontSize:12,color:INK,fontFamily:F,flex:1}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"transparent",border:"none",cursor:"pointer",color:INK3,display:"flex"}}><X size={12} strokeWidth={2}/></button>}
        </div>
        {notInShift.length===0?<div style={{padding:"12px",textAlign:"center",color:INK3,fontSize:12}}>{search?"ไม่พบพนักงาน":"พนักงานทุกคนอยู่ในกะนี้แล้ว"}</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:180,overflow:"auto"}}>
            {notInShift.map(e=>{const curShift=allShifts.find(s=>s.id===e.shiftId);return(
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"#fafbfc",borderRadius:10,border:"1px solid #eaecef"}}>
                <Avatar emp={e} size={30}/>
                <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500,color:INK}}>{e.firstName} {e.lastName}</div><div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}><span style={{fontSize:10,color:INK3}}>{e.empCode}</span>{curShift&&<span style={{fontSize:10,background:curShift.color,color:curShift.textColor,borderRadius:20,padding:"1px 7px",fontWeight:500}}>กะ: {curShift.name}</span>}</div></div>
                <button onClick={()=>setLocalEmps(prev=>prev.map(x=>x.id===e.id?{...x,shiftId:shift.id}:x))} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 11px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${shift.textColor}55`,background:shift.color,color:shift.textColor,fontFamily:F,whiteSpace:"nowrap"}}><Plus size={12} strokeWidth={2.5}/> ย้ายเข้ากะนี้</button>
              </div>
            );})}
          </div>
        )}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid #eaecef",paddingTop:14,marginTop:16}}>
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn variant="primary" onClick={save} disabled={saving}><Check size={13} strokeWidth={2.5}/> {saving?"กำลังบันทึก...":"บันทึก"}</Btn>
      </div>
    </Modal>
  );
}


// ════════════════════════════════════════════════════════
//  DEFAULT SHIFT TABLE
// ════════════════════════════════════════════════════════
function DefaultShiftTable({shifts,emps,onEmpShiftChange}:{shifts:Shift[];emps:Employee[];onEmpShiftChange:(empId:number,shiftId:number|null)=>void}){
  const [savingId,setSavingId]=useState<number|null>(null);
  const [search,setSearch]=useState("");

  const filtered=emps.filter(e=>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())||
    e.empCode.toLowerCase().includes(search.toLowerCase())||
    (e.department?.name||"").toLowerCase().includes(search.toLowerCase())
  );

  async function handleChange(empId:number,shiftId:number|null){
    setSavingId(empId);
    await apiFetch(`/api/employees/${empId}`,{method:"PATCH",body:JSON.stringify({shiftId})});
    onEmpShiftChange(empId,shiftId);
    setSavingId(null);
  }

  return(
    <div style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"14px 18px",borderBottom:"1px solid #eaecef",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div>
          <div style={{fontSize:14,fontWeight:500,color:INK}}>กะเริ่มต้นพนักงาน</div>
          <div style={{fontSize:12,color:INK3,marginTop:2}}>กำหนดกะประจำที่พนักงานแต่ละคนใช้เป็นค่าเริ่มต้น สามารถเปลี่ยนรายวันได้ที่ตารางมอบหมายกะ</div>
        </div>
        {/* Search */}
        <div style={{display:"flex",alignItems:"center",gap:8,background:BG,border:"1px solid #dde2e8",borderRadius:9,padding:"0 12px",height:34,minWidth:220}}>
          <Search size={13} strokeWidth={1.8} color={INK3}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาพนักงาน..." style={{border:"none",background:"transparent",outline:"none",fontSize:12,color:INK,fontFamily:F,flex:1}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"transparent",border:"none",cursor:"pointer",color:INK3,display:"flex"}}><X size={11} strokeWidth={2}/></button>}
        </div>
      </div>

      {/* Shift color legend */}
      <div style={{padding:"8px 18px",borderBottom:"1px solid #f0f2f5",display:"flex",gap:12,flexWrap:"wrap",background:"#fafbfc"}}>
        {shifts.map(sh=>(
          <div key={sh.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
            <span style={{width:14,height:14,borderRadius:4,background:sh.color,border:`1px solid ${sh.textColor}44`,display:"inline-block",flexShrink:0}}/>
            <span style={{fontWeight:500,color:sh.textColor}}>{sh.code}</span>
            <span style={{color:INK3}}>{sh.name} · {sh.startTime}–{sh.endTime}</span>
          </div>
        ))}
      </div>

      {/* Summary badges */}
      <div style={{padding:"10px 18px",borderBottom:"1px solid #f0f2f5",display:"flex",gap:10,flexWrap:"wrap"}}>
        {shifts.map(sh=>{
          const cnt=emps.filter(e=>e.shiftId===sh.id).length;
          return(
            <div key={sh.id} style={{display:"flex",alignItems:"center",gap:6,background:sh.color,borderRadius:8,padding:"5px 10px",border:`1px solid ${sh.textColor}33`}}>
              <span style={{fontSize:16,fontWeight:600,color:sh.textColor,lineHeight:1}}>{cnt}</span>
              <div>
                <div style={{fontSize:11,fontWeight:500,color:sh.textColor}}>{sh.code}</div>
                <div style={{fontSize:9,color:sh.textColor,opacity:.7}}>{sh.name}</div>
              </div>
            </div>
          );
        })}
        <div style={{display:"flex",alignItems:"center",gap:6,background:BG,borderRadius:8,padding:"5px 10px",border:"1px solid #eaecef"}}>
          <span style={{fontSize:16,fontWeight:600,color:INK3,lineHeight:1}}>{emps.filter(e=>!e.shiftId).length}</span>
          <div>
            <div style={{fontSize:11,fontWeight:500,color:INK3}}>ไม่มีกะ</div>
            <div style={{fontSize:9,color:INK3}}>พนักงาน</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr style={{background:BG}}>
            {[["พนักงาน","35%"],["แผนก / ตำแหน่ง","25%"],["กะเริ่มต้น","40%"]].map(([h,w])=>(
              <th key={h} style={{padding:"9px 16px",textAlign:"left",fontSize:11,color:INK3,fontWeight:500,width:w}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((emp,ei)=>{
            const curShift=shifts.find(s=>s.id===emp.shiftId);
            const isSaving=savingId===emp.id;
            return(
              <tr key={emp.id} style={{borderTop:"1px solid #f0f2f5",background:ei%2===0?WHITE:"#fafbfc"}}>
                {/* Employee */}
                <td style={{padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Avatar emp={emp} size={32}/>
                    <div>
                      <div style={{fontWeight:500,color:INK,fontSize:13}}>{emp.firstName} {emp.lastName}</div>
                      <div style={{fontSize:11,color:INK3}}>{emp.empCode}</div>
                    </div>
                  </div>
                </td>
                {/* Dept / Position */}
                <td style={{padding:"12px 16px"}}>
                  <div style={{fontSize:12,color:INK2}}>{emp.department?.name||"—"}</div>
                  <div style={{fontSize:11,color:INK3}}>{emp.position?.name||""}</div>
                </td>
                {/* Default shift selector */}
                <td style={{padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    {/* Current badge */}
                    <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:curShift?curShift.color:BG,border:`1px solid ${curShift?curShift.textColor+"44":"#eaecef"}`}}>
                      {curShift?(
                        <>
                          <TimeIcon start={curShift.startTime}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:600,color:curShift.textColor}}>{curShift.code} — {curShift.name}</div>
                            <div style={{fontSize:10,color:curShift.textColor,opacity:.8}}>{curShift.startTime}–{curShift.endTime} · {curShift.hoursPerDay} ชม./วัน · {curShift.workDays.length} วัน/สัปดาห์</div>
                          </div>
                        </>
                      ):(
                        <span style={{fontSize:12,color:INK3}}>— ยังไม่ได้กำหนดกะ</span>
                      )}
                    </div>
                    {/* Change dropdown */}
                    <div style={{position:"relative"}}>
                      <select
                        value={emp.shiftId??0}
                        onChange={e=>handleChange(emp.id,Number(e.target.value)||null)}
                        disabled={isSaving}
                        style={{fontSize:12,padding:"7px 10px",borderRadius:9,border:`1px solid ${TEAL}55`,fontFamily:F,background:WHITE,color:TEAL,fontWeight:500,cursor:"pointer",appearance:"none",paddingRight:28,opacity:isSaving?.5:1}}>
                        <option value={0}>— เปลี่ยนกะ —</option>
                        {shifts.map(s=>(
                          <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} strokeWidth={2} color={TEAL} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
                    </div>
                    {isSaving&&<div style={{fontSize:11,color:TEAL}}>บันทึก...</div>}
                  </div>
                </td>
              </tr>
            );
          })}
          {filtered.length===0&&(
            <tr><td colSpan={3} style={{padding:32,textAlign:"center",color:INK3,fontSize:13}}>ไม่พบพนักงาน</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  SHIFT LIST (per company)
// ════════════════════════════════════════════════════════
function ShiftList({company,shifts,emps,loading,onBack,onAdd,onEdit,onDelete,onEmpShiftChange}:any){
  const [assignTarget,setAssignTarget]=useState<Shift|null>(null);
  const [deleteConfirm,setDeleteConfirm]=useState<number|null>(null);
  const [activeTab,setActiveTab]=useState<"shifts"|"default"|"schedule">("shifts");

  async function confirmDelete(id:number){
    await apiFetch(`/api/shifts/${id}`,{method:"DELETE"});
    onDelete(id); setDeleteConfirm(null);
  }

  return(
    <div style={{fontFamily:F,padding:"28px 32px",background:BG,minHeight:"100vh"}}>
      {/* Back */}
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",cursor:"pointer",color:TEAL,fontSize:13,marginBottom:16,fontFamily:F,padding:0}}>
        <ArrowLeft size={13} strokeWidth={2}/> กะการทำงาน
      </button>

      {/* Header */}
      <div style={{background:WHITE,borderRadius:16,padding:"18px 22px",marginBottom:0,border:"1px solid #eaecef",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {company.logoUrl
            ?<img src={company.logoUrl} alt={company.code} style={{width:46,height:46,borderRadius:12,objectFit:"cover"}}/>
            :<div style={{width:46,height:46,borderRadius:12,background:company.color,color:company.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:600}}>{company.code}</div>
          }
          <div>
            <div style={{fontSize:17,fontWeight:500,color:INK}}>{company.name}</div>
            <div style={{fontSize:12,color:INK3,marginTop:2}}>{shifts.length} กะ · {emps.length} พนักงาน</div>
          </div>
        </div>
        {activeTab==="shifts"&&<Btn variant="teal" onClick={onAdd}><Plus size={13} strokeWidth={2.5}/> เพิ่มกะ</Btn>}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,borderBottom:"2px solid #eaecef",marginBottom:20,background:WHITE,borderRadius:"0 0 0 0",paddingLeft:22}}>
        {([["shifts","กะการทำงาน",LayoutList],["default","กะเริ่มต้นพนักงาน",UserCheck],["schedule","ตารางมอบหมายกะ",Calendar]] as [string,string,React.ElementType][]).map(([key,label,Icon])=>(
          <button key={key} onClick={()=>setActiveTab(key as any)} style={{display:"flex",alignItems:"center",gap:6,padding:"12px 16px",border:"none",borderBottom:activeTab===key?`2px solid ${TEAL}`:"2px solid transparent",marginBottom:-2,background:"transparent",cursor:"pointer",fontFamily:F,fontSize:13,fontWeight:activeTab===key?500:400,color:activeTab===key?TEAL:INK2}}>
            <Icon size={14} strokeWidth={1.8}/>{label}
          </button>
        ))}
      </div>

      {loading?<div style={{textAlign:"center",padding:48,color:INK3,fontSize:13}}>กำลังโหลด...</div>:(
        <>
          {/* ── Tab: Shifts ── */}
          {activeTab==="shifts"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:14}}>
              {shifts.map((sh:Shift)=>{
                const wt=SHIFT_TYPES[sh.shiftType];
                const shEmps=emps.filter((e:Employee)=>e.shiftId===sh.id);
                return(
                  <div key={sh.id} style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:"18px 20px"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14}}>
                      <div style={{width:42,height:42,borderRadius:11,background:sh.color,color:sh.textColor,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><TimeIcon start={sh.startTime}/></div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:500,fontSize:14,color:INK}}>{sh.name}</div>
                        <div style={{fontSize:11,color:INK3,marginTop:1}}>รหัส: {sh.code}</div>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <IBtn Icon={Pencil} label="แก้ไข" onClick={()=>onEdit(sh)}/>
                        <IBtn Icon={Trash2} label="ลบ" color="#cc4444" onClick={()=>setDeleteConfirm(sh.id)}/>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                      <Clock size={13} strokeWidth={1.8} color={INK3}/>
                      <span style={{fontSize:13,fontWeight:500,color:INK}}>{sh.startTime} – {sh.endTime}</span>
                      <span style={{fontSize:11,color:INK3}}>· พัก {sh.breakMins} นาที · {sh.hoursPerDay} ชม./วัน</span>
                    </div>
                    <div style={{display:"flex",gap:4,marginBottom:14}}>
                      {DAYS_TH.map((d,i)=>{const w=sh.workDays.includes(i);return <div key={d} style={{width:26,height:26,borderRadius:7,background:w?sh.color:BG,color:w?sh.textColor:INK3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:w?500:400,border:`1px solid ${w?sh.textColor+"44":"#eaecef"}`}}>{d}</div>;})}
                      <span style={{fontSize:11,color:INK3,alignSelf:"center",marginLeft:4}}>{sh.workDays.length} วัน/สัปดาห์</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid #f0f2f5",paddingTop:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{display:"flex"}}>
                          {shEmps.slice(0,4).map((e:Employee,i:number)=>(<div key={e.id} style={{width:24,height:24,borderRadius:"50%",background:e.profileColor,color:e.profileTextColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500,marginLeft:i>0?-7:0,border:`2px solid ${WHITE}`}}>{initials(e)}</div>))}
                          {shEmps.length>4&&<div style={{width:24,height:24,borderRadius:"50%",background:"#eaecef",color:INK3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500,marginLeft:-7,border:`2px solid ${WHITE}`}}>+{shEmps.length-4}</div>}
                        </div>
                        <span style={{fontSize:12,color:INK2,fontWeight:500}}>{sh._count?.employees??0} คน</span>
                      </div>
                      <button onClick={()=>setAssignTarget(sh)} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${sh.textColor}55`,background:sh.color,color:sh.textColor,fontFamily:F}}>
                        <UserCheck size={13} strokeWidth={1.8}/> จัดการพนักงาน
                      </button>
                    </div>
                    {wt&&<div style={{marginTop:10}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:wt.bg,color:wt.color,fontWeight:500}}>{wt.label}</span></div>}
                  </div>
                );
              })}
              {shifts.length===0&&(
                <div style={{gridColumn:"1/-1",padding:40,textAlign:"center",color:INK3,fontSize:13,background:WHITE,borderRadius:14,border:"1px dashed #dde2e8"}}>
                  <Clock size={28} strokeWidth={1.4} color={INK3} style={{margin:"0 auto 12px",display:"block"}}/>
                  ยังไม่มีกะการทำงาน — กด เพิ่มกะ เพื่อเริ่มต้น
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Default Shift ── */}
          {activeTab==="default"&&(
            <DefaultShiftTable shifts={shifts} emps={emps} onEmpShiftChange={onEmpShiftChange}/>
          )}

          {/* ── Tab: Schedule Calendar ── */}
          {activeTab==="schedule"&&(
            <ScheduleCalendar company={company} shifts={shifts} emps={emps}/>
          )}
        </>
      )}

      {/* Modals */}
      {assignTarget&&(
        <ShiftAssignModal shift={assignTarget} allShifts={shifts} emps={emps} onClose={()=>setAssignTarget(null)} onSave={(empId,shiftId)=>onEmpShiftChange(empId,shiftId)}/>
      )}
      {deleteConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(28,40,51,.46)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:600,fontFamily:F}}>
          <div style={{background:WHITE,borderRadius:14,padding:24,width:360,textAlign:"center"}}>
            <div style={{fontSize:15,fontWeight:500,color:INK,marginBottom:8}}>ยืนยันการลบกะ?</div>
            <div style={{fontSize:12,color:INK3,marginBottom:20}}>พนักงานในกะนี้จะไม่มีกะการทำงาน</div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <Btn variant="ghost" onClick={()=>setDeleteConfirm(null)}>ยกเลิก</Btn>
              <Btn variant="danger" onClick={()=>confirmDelete(deleteConfirm)}><Trash2 size={13} strokeWidth={2}/> ลบกะ</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  COMPANY PICKER
// ════════════════════════════════════════════════════════
function CompanyPicker({companies,shifts,onSelect}:{companies:Company[];shifts:Record<number,Shift[]>;onSelect:(c:Company)=>void}){
  return(
    <div style={{fontFamily:F,padding:"28px 32px",background:BG,minHeight:"100vh"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:500,color:INK}}>กะการทำงาน</div>
        <div style={{fontSize:12,color:INK3,marginTop:4}}>จัดการกะ ตารางกะ และมอบหมายกะพนักงานแต่ละบริษัท</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {companies.map(co=>{
          const coShifts=shifts[co.id]||[];
          const types=Array.from(new Set(coShifts.map((s:Shift)=>s.shiftType)));
          return(
            <div key={co.id} onClick={()=>onSelect(co)} style={{background:WHITE,borderRadius:14,border:"1px solid #eaecef",padding:"18px 20px",cursor:"pointer",transition:"border-color .15s"}}
              onMouseEnter={e=>(e.currentTarget.style.borderColor=TEAL)}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="#eaecef")}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                {co.logoUrl?<img src={co.logoUrl} alt={co.code} style={{width:42,height:42,borderRadius:11,objectFit:"cover"}}/>
                  :<div style={{width:42,height:42,borderRadius:11,background:co.color,color:co.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,flexShrink:0}}>{co.code}</div>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:500,fontSize:13,color:INK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.name}</div>
                  <div style={{fontSize:11,color:INK3}}>{co.nameTH}</div>
                </div>
                <ChevronRight size={15} strokeWidth={1.8} color={INK3}/>
              </div>
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                {([[coShifts.length,"กะทั้งหมด",TEAL],[co._count?.employees??0,"พนักงาน",CORAL]] as [number,string,string][]).map(([v,l,c])=>(
                  <div key={l} style={{flex:1,background:BG,borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:18,fontWeight:600,color:c,lineHeight:1}}>{v}</div>
                    <div style={{fontSize:10,color:INK3,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {types.map(t=>{const wt=SHIFT_TYPES[t];return wt?<span key={t} style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:wt.bg,color:wt.color,fontWeight:500}}>{wt.label}</span>:null;})}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  ROOT PAGE
// ════════════════════════════════════════════════════════
export default function ShiftsPage(){
  const {user}=useAuth();
  const [companies,setCompanies]=useState<Company[]>([]);
  const [company,setCompany]=useState<Company|null>(null);
  const [shifts,setShifts]=useState<Record<number,Shift[]>>({});
  const [emps,setEmps]=useState<Employee[]>([]);
  const [loading,setLoading]=useState(true);
  const [empLoading,setEmpLoading]=useState(false);
  const [editTarget,setEditTarget]=useState<Shift|null|"add">(null);

  useEffect(()=>{
    apiFetch<Company[]>("/api/companies").then((r:any)=>{
      if(r.data) setCompanies(r.data as Company[]);
    }).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(!company) return;
    setEmpLoading(true);
    Promise.all([
      apiFetch<Shift[]>(`/api/shifts?companyId=${company.id}`),
      apiFetch<Employee[]>(`/api/employees?companyId=${company.id}`),
    ]).then(([sr,er]:[any,any])=>{
      if(sr.data) setShifts(prev=>({...prev,[company.id]:sr.data as Shift[]}));
      if(er.data) setEmps(er.data as Employee[]);
    }).finally(()=>setEmpLoading(false));
  },[company?.id]);

  function handleAdd(sh:Shift){ setShifts(prev=>({...prev,[company!.id]:[...(prev[company!.id]||[]),sh]})); setEditTarget(null); }
  function handleEdit(sh:Shift){ setShifts(prev=>({...prev,[company!.id]:(prev[company!.id]||[]).map(s=>s.id===sh.id?sh:s)})); setEditTarget(null); }
  function handleDelete(id:number){ setShifts(prev=>({...prev,[company!.id]:(prev[company!.id]||[]).filter(s=>s.id!==id)})); }
  async function handleEmpShiftChange(empId:number,shiftId:number|null){
    await apiFetch(`/api/employees/${empId}`,{method:"PATCH",body:JSON.stringify({shiftId})});
    setEmps(prev=>prev.map(e=>e.id===empId?{...e,shiftId}:e));
  }

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:INK3,fontFamily:F,fontSize:13}}>กำลังโหลด...</div>;

  if(!company) return <CompanyPicker companies={companies} shifts={shifts} onSelect={co=>setCompany(co)}/>;

  return(
    <>
      <ShiftList
        company={company} shifts={shifts[company.id]||[]} emps={emps} loading={empLoading}
        onBack={()=>{setCompany(null);setEmps([]);}}
        onAdd={()=>setEditTarget("add")}
        onEdit={(sh:Shift)=>setEditTarget(sh)}
        onDelete={handleDelete}
        onEmpShiftChange={handleEmpShiftChange}
      />
      {editTarget==="add"&&<ShiftModal shift={null} companyId={company.id} onClose={()=>setEditTarget(null)} onSave={handleAdd}/>}
      {editTarget&&editTarget!=="add"&&<ShiftModal shift={editTarget as Shift} companyId={company.id} onClose={()=>setEditTarget(null)} onSave={handleEdit}/>}
    </>
  );
}
