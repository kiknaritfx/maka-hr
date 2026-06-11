import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAKA HR Management",
  description: "ระบบจัดการทรัพยากรบุคคล MAKA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600&display=swap" rel="stylesheet"/>
      </head>
      <body style={{ fontFamily:"'Prompt','Kanit',sans-serif", margin:0, background:"#F4F6F8" }}>
        {children}
      </body>
    </html>
  );
}
