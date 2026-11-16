export function ProgressRing({ value, total, size = 84, label }: { value: number; total: number; size?: number; label?: string }) {
  const pct = total ? Math.min(1, value / total) : 0;
  const r = (size - 10) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }} role="img" aria-label={`${value} of ${total} ${label ?? "done"}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={7} strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", lineHeight: 1.1 }}>
        <div><div style={{ fontWeight: 600, fontSize: size > 70 ? "1.15rem" : ".9rem" }}>{value}/{total}</div>{label && <div className="small muted" style={{ fontSize: ".62rem", letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</div>}</div>
      </div>
    </div>
  );
}
