// Single-series charts in the brand accent (one series → no legend; the card title names it).
// Hover: each bar/point carries a native tooltip and a highlighted hit area; a table view is offered beside.
import { formatValue, type MetricUnit } from "@/lib/metrics";

type Pt = { label: string; value: number | null };

export function Sparkline({ data, width = 120, height = 34 }: { data: Pt[]; width?: number; height?: number }) {
  const vals = data.map((d) => d.value).filter((v): v is number => v != null);
  if (vals.length < 2) return <div className="small muted" style={{ height }}>{vals.length ? "Trend after 2+ months" : ""}</div>;
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const x = (i: number) => (data.length === 1 ? width / 2 : 3 + (i * (width - 6)) / (data.length - 1));
  const y = (v: number) => height - 4 - ((v - min) / span) * (height - 8);
  // Break the line at missing months instead of drawing through them.
  const segs: string[] = []; let cur = "";
  data.forEach((d, i) => { if (d.value == null) { if (cur) segs.push(cur); cur = ""; } else cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`; });
  if (cur) segs.push(cur);
  const last = data.map((d, i) => ({ ...d, i })).filter((d) => d.value != null).at(-1)!;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      {segs.map((d, k) => <path key={k} d={d} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
      <circle cx={x(last.i)} cy={y(last.value!)} r={3.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
    </svg>
  );
}

export function BarChart({ data, unit, height = 220 }: { data: Pt[]; unit: MetricUnit; height?: number }) {
  const vals = data.map((d) => d.value).filter((v): v is number => v != null);
  if (!vals.length) return <p className="muted small">No data for this number yet.</p>;
  const max = Math.max(...vals, 0), min = Math.min(...vals, 0);
  const W = 640, padL = 8, padB = 26, padT = 18, H = height;
  const plotH = H - padB - padT;
  const n = data.length, slot = (W - padL * 2) / n, bw = Math.max(6, Math.min(44, slot - 2 - slot * 0.35));
  const scale = (v: number) => ((v - min) / (max - min || 1)) * plotH;
  const zeroY = padT + plotH - scale(0);
  const lastIdx = data.map((d) => d.value).lastIndexOf(data.filter((d) => d.value != null).at(-1)!.value);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Monthly chart" className="barchart">
      <line x1={padL} x2={W - padL} y1={zeroY} y2={zeroY} stroke="var(--line)" strokeWidth={1} />
      {data.map((d, i) => {
        const cx = padL + slot * i + slot / 2;
        if (d.value == null) {
          return <g key={i}><text x={cx} y={zeroY - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">–</text>
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.label}</text></g>;
        }
        const h = Math.max(1, Math.abs(scale(d.value) - scale(0)));
        const top = d.value >= 0 ? zeroY - h : zeroY;
        return (
          <g key={i} className="bar-g">
            <title>{`${d.label}: ${formatValue(d.value, unit)}`}</title>
            <rect x={cx - slot / 2} y={padT} width={slot} height={plotH} fill="transparent" />
            <rect className="bar-mark" x={cx - bw / 2} y={top} width={bw} height={h} rx={4} fill="var(--accent)" />
            {i === lastIdx && <text x={cx} y={top - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink)">{formatValue(d.value, unit)}</text>}
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
