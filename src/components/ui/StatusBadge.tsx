const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:     { bg:"#e6faf9", color:"#007d75", label:"ทำงาน" },
  PROBATION:  { bg:"#fffbea", color:"#8a6d00", label:"ทดลองงาน" },
  RESIGNED:   { bg:"#f4f6f8", color:"#5a6a78", label:"ลาออก" },
  TERMINATED: { bg:"#fff0f0", color:"#cc4444", label:"พ้นสภาพ" },
  REVIEW:     { bg:"#e6f1fb", color:"#185fa5", label:"รอตรวจสอบ" },
  APPROVED:   { bg:"#e6faf9", color:"#007d75", label:"อนุมัติแล้ว" },
  PAID:       { bg:"#eeedfe", color:"#534ab7", label:"จ่ายแล้ว" },
  DRAFT:      { bg:"#f4f6f8", color:"#9aaab8", label:"ยังไม่ Run" },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] || STATUS.DRAFT;
  return (
    <span style={{ background:s.bg, color:s.color, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:500, whiteSpace:"nowrap" }}>
      {s.label}
    </span>
  );
}
