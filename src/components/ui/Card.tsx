import { ReactNode, CSSProperties } from "react";
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, border:"1px solid #eaecef", padding:20, ...style }}>
      {children}
    </div>
  );
}
