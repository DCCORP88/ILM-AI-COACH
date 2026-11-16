import { formatValue, type MetricUnit } from "@/lib/metrics";
export function NumberCell({ value, unit }: { value: number | null | undefined; unit: MetricUnit }) {
  const text = formatValue(value, unit);
  return <span className={value == null ? "stat empty" : "stat"}>{text}</span>;
}
