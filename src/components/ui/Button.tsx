import { ButtonHTMLAttributes, ReactNode } from "react";
const V = {
  primary: { background:"#FF6B6B", color:"#fff", border:"none" },
  teal:    { background:"#00B4A9", color:"#fff", border:"none" },
  ghost:   { background:"transparent", color:"#5a6a78", border:"1px solid #dde2e8" },
  danger:  { background:"#fff0f0", color:"#cc4444", border:"1px solid #f5c4b3" },
};
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof V;
  children: ReactNode;
}
export function Button({ variant="ghost", children, style, ...props }: Props) {
  return (
    <button
      {...props}
      style={{
        display:"inline-flex", alignItems:"center", gap:5,
        padding:"8px 14px", borderRadius:10, fontSize:13,
        fontWeight:500, cursor: props.disabled?"default":"pointer",
        fontFamily:"'Prompt','Kanit',sans-serif",
        opacity: props.disabled ? 0.45 : 1,
        ...V[variant], ...style,
      }}
    >
      {children}
    </button>
  );
}
