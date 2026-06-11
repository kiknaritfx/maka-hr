"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { useAuth } from "@/hooks/useAuth";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) { setError("กรุณากรอกอีเมลและรหัสผ่าน"); return; }
    setLoading(true); setError("");
    const result = await login(email, password);
    if (result.ok) { router.push("/dashboard"); }
    else { setError(result.message || "เข้าสู่ระบบไม่สำเร็จ"); setLoading(false); }
  }

  const inp: React.CSSProperties = {
    width:"100%", boxSizing:"border-box", fontSize:14, padding:"11px 14px",
    borderRadius:10, border:"1.5px solid #dde2e8", fontFamily:"'Prompt','Kanit',sans-serif",
    background:"#fff", color:"#1C2833", outline:"none",
  };

  return (
    <div style={{ flex:1, display:"flex", fontFamily:"'Prompt','Kanit',sans-serif" }}>
      {/* Left branding */}
      <div style={{ width:360, background:"linear-gradient(145deg,#00B4A9 0%,#007d75 60%,#005c4a 100%)", display:"flex", flexDirection:"column", padding:"40px 36px", flexShrink:0 }}>
        <div style={{ marginBottom:"auto" }}>
          <div style={{ fontSize:36, fontWeight:500, color:"#fff", letterSpacing:-1 }}>MA<span style={{ color:"#FFD93D" }}>KA</span></div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.65)", marginTop:4 }}>HR Management System</div>
        </div>
        <div style={{ marginBottom:40 }}>
          <div style={{ fontSize:22, fontWeight:500, color:"#fff", lineHeight:1.4, marginBottom:10 }}>จัดการทรัพยากรบุคคล<br/>ให้ง่ายกว่าเดิม</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.7)", lineHeight:1.7 }}>บริหารพนักงาน เงินเดือน กะการทำงาน<br/>และรายงานในระบบเดียว</div>
        </div>
      </div>
      {/* Right form */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#F4F6F8", padding:32 }}>
        <div style={{ width:"100%", maxWidth:360 }}>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:22, fontWeight:500, color:"#1C2833" }}>เข้าสู่ระบบ</div>
            <div style={{ fontSize:13, color:"#9aaab8", marginTop:4 }}>กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <div style={{ fontSize:11, color:"#9aaab8", marginBottom:5, fontWeight:500 }}>อีเมล</div>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key==="Enter" && handleSubmit()} placeholder="name@company.co.th" style={inp}/>
            </div>
            <div>
              <div style={{ fontSize:11, color:"#9aaab8", marginBottom:5, fontWeight:500 }}>รหัสผ่าน</div>
              <div style={{ position:"relative" }}>
                <input type={showPw?"text":"password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key==="Enter" && handleSubmit()} placeholder="••••••••"
                  style={{ ...inp, paddingRight:42 }}/>
                <button onClick={() => setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", cursor:"pointer", color:"#9aaab8", display:"flex" }}>
                  {showPw ? <EyeOff size={16} strokeWidth={1.8}/> : <Eye size={16} strokeWidth={1.8}/>}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 12px", background:"#fff0f0", border:"1px solid #f5c4b3", borderRadius:9, fontSize:12, color:"#cc4444" }}>
                <AlertCircle size={14} strokeWidth={2}/>{error}
              </div>
            )}
            <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:13, borderRadius:11, background:loading?"#9acecb":"#00B4A9", color:"#fff", fontSize:14, fontWeight:500, border:"none", cursor:loading?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {loading ? (<><div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", animation:"spin .7s linear infinite" }}/> กำลังเข้าสู่ระบบ...</>) : "เข้าสู่ระบบ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <div style={{ display:"flex", minHeight:"100vh" }}>
        <LoginForm/>
      </div>
    </AuthProvider>
  );
}
