"use client";
import { useState } from "react";
import { pricingWorksheet, rebookScenario, revenueGoal } from "@/lib/calc";
import { deriveMetrics, formatValue } from "@/lib/metrics";

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return <label>{label} {hint && <span className="hint">{hint}</span>}<input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Out({ label, value, unit, formula }: { label: string; value: number | null; unit: "money" | "percent" | "count" | "number"; formula?: string }) {
  return <div><div className="small muted">{label}</div><div className={value == null ? "stat empty" : "stat"}>{value == null ? "Not enough data" : formatValue(value, unit)}</div>{formula && <div className="small muted">{formula}</div>}</div>;
}
function useForm<T extends Record<string, string>>(init: T) {
  const [v, setV] = useState(init);
  return [v, (k: keyof T) => (x: string) => setV({ ...v, [k]: x })] as const;
}
function Missing({ list }: { list: string[] }) {
  return list.length ? <div className="notice warn small">Add: {list.join(", ")}</div> : null;
}

export function Tools() {
  const [p, setP] = useForm({ price: "", minutes: "", productCost: "", monthlyFixedCosts: "", monthlyWages: "", bookableHoursPerMonth: "" });
  const [gst, setGst] = useState(false);
  const pr = pricingWorksheet({ ...p, gstRegistered: gst });

  const [r, setR] = useForm({ currentVisitsPerMonth: "", currentAvgSpend: "", targetRevenuePerMonth: "", extraVisits: "", avgSpendIncrease: "", capacityPerMonth: "" });
  const rg = revenueGoal(r);

  const [b, setB] = useForm({ visitsPerMonth: "", currentRebookRate: "", targetRebookRate: "", avgSpend: "" });
  const rb = rebookScenario(b);

  const [a, setA] = useForm({ ad_spend: "", ad_impressions: "", ad_clicks: "", ad_leads: "", new_clients: "" });
  const num = (s: string) => (s.trim() === "" || !Number.isFinite(Number(s)) ? undefined : Number(s));
  const ad = deriveMetrics({ ad_spend: num(a.ad_spend), ad_impressions: num(a.ad_impressions), ad_clicks: num(a.ad_clicks), ad_leads: num(a.ad_leads) });
  const costPerRealClient = num(a.ad_spend) != null && num(a.new_clients) ? num(a.ad_spend)! / num(a.new_clients)! : null;

  return (
    <>
      <div className="card" id="pricing">
        <h2>Service pricing worksheet</h2>
        <p className="small muted">Deanna&apos;s method: price from your real costs (fixed costs, product costs and wages, including your own pay), then check local rates. Don&apos;t undercut.</p>
        <div className="grid g3">
          <Field label="Price charged" hint="($)" value={p.price} onChange={setP("price")} />
          <Field label="Appointment length" hint="(minutes, incl. setup and clean)" value={p.minutes} onChange={setP("minutes")} />
          <Field label="Products + consumables per service" hint="($)" value={p.productCost} onChange={setP("productCost")} />
          <Field label="Monthly fixed costs" hint="(rent, insurance, software…)" value={p.monthlyFixedCosts} onChange={setP("monthlyFixedCosts")} />
          <Field label="Monthly wages" hint="(including yours)" value={p.monthlyWages} onChange={setP("monthlyWages")} />
          <Field label="Bookable client hours per month" value={p.bookableHoursPerMonth} onChange={setP("bookableHoursPerMonth")} />
        </div>
        <label style={{ fontWeight: 400 }}><input type="checkbox" checked={gst} onChange={(e) => setGst(e.target.checked)} /> I&apos;m registered for GST (price includes GST)</label>
        <Missing list={pr.missing} />
        {pr.notes.map((n) => <div key={n} className="small muted">{n}</div>)}
        <div className="grid g3" style={{ marginTop: 12 }}>
          <Out label="Overhead per client hour" value={pr.overheadPerHour} unit="money" formula="(Fixed costs + wages) ÷ bookable hours" />
          <Out label="Full cost per service (break-even price)" value={pr.costPerService} unit="money" formula="Product cost + overhead per hour × minutes ÷ 60" />
          <Out label="Price ex GST" value={pr.priceExGst} unit="money" />
          <Out label="Contribution per service" value={pr.contribution} unit="money" formula="Price ex GST − product cost" />
          <Out label="Margin after all costs" value={pr.margin} unit="percent" formula="(Price ex GST − full cost) ÷ price ex GST" />
        </div>
        {pr.margin != null && pr.margin < 0 && <div className="notice err small">This price is below your full cost, so you lose money on every one of these services.</div>}
      </div>

      <div className="card" id="revenue">
        <h2>Revenue goal calculator</h2>
        <p className="small muted">{rg.formula}</p>
        <div className="grid g3">
          <Field label="Current visits per month" value={r.currentVisitsPerMonth} onChange={setR("currentVisitsPerMonth")} />
          <Field label="Current average spend" hint="($)" value={r.currentAvgSpend} onChange={setR("currentAvgSpend")} />
          <Field label="Target monthly revenue" hint="($)" value={r.targetRevenuePerMonth} onChange={setR("targetRevenuePerMonth")} />
          <Field label="Scenario: extra visits per month" value={r.extraVisits} onChange={setR("extraVisits")} />
          <Field label="Scenario: increase in average spend" hint="($)" value={r.avgSpendIncrease} onChange={setR("avgSpendIncrease")} />
          <Field label="Max visits per month (capacity)" value={r.capacityPerMonth} onChange={setR("capacityPerMonth")} />
        </div>
        <Missing list={rg.missing} />
        <div className="grid g3" style={{ marginTop: 12 }}>
          <Out label="Current monthly revenue" value={rg.current} unit="money" />
          <Out label="Scenario monthly revenue" value={rg.scenario} unit="money" />
          <Out label="Gap to target" value={rg.gap} unit="money" />
          <Out label="Visits needed at current spend" value={rg.visitsNeededAtCurrentSpend} unit="number" />
          <Out label="Average spend needed at current visits" value={rg.spendNeededAtCurrentVisits} unit="money" />
        </div>
        {rg.overCapacity && <div className="notice warn small">This scenario needs more visits than your capacity. Look at price or average spend instead of more clients.</div>}
      </div>

      <div className="card" id="rebook">
        <h2>Rebooking scenario</h2>
        <p className="small muted">{rb.formula}</p>
        <div className="grid g3">
          <Field label="Visits per month" value={b.visitsPerMonth} onChange={setB("visitsPerMonth")} />
          <Field label="Current rebook rate" hint="(%)" value={b.currentRebookRate} onChange={setB("currentRebookRate")} />
          <Field label="Target rebook rate" hint="(%; Lash'd aims for 80)" value={b.targetRebookRate} onChange={setB("targetRebookRate")} />
          <Field label="Average spend" hint="($)" value={b.avgSpend} onChange={setB("avgSpend")} />
        </div>
        <Missing list={rb.missing} />
        <div className="grid g3" style={{ marginTop: 12 }}>
          <Out label="Extra rebooked visits per month" value={rb.extraRebooks} unit="number" />
          <Out label="Extra revenue per month" value={rb.extraRevenue} unit="money" />
        </div>
      </div>

      <div className="card" id="ads">
        <h2>Ad metrics</h2>
        <p className="small muted">From Meta Ads Manager. Leads are Meta-attributed estimates, so compare with real new clients from your booking system.</p>
        <div className="grid g3">
          <Field label="Ad spend" hint="($)" value={a.ad_spend} onChange={setA("ad_spend")} />
          <Field label="Impressions" value={a.ad_impressions} onChange={setA("ad_impressions")} />
          <Field label="Link clicks" value={a.ad_clicks} onChange={setA("ad_clicks")} />
          <Field label="Leads (Meta-attributed)" value={a.ad_leads} onChange={setA("ad_leads")} />
          <Field label="Real new clients from the ad" hint="(your records)" value={a.new_clients} onChange={setA("new_clients")} />
        </div>
        <div className="grid g3" style={{ marginTop: 12 }}>
          {ad.filter((d) => ["ctr", "cpc", "cpl"].includes(d.key)).map((d) => <Out key={d.key} label={d.label} value={d.value} unit={d.unit} formula={d.formula} />)}
          <Out label="Cost per real new client" value={costPerRealClient} unit="money" formula="Ad spend ÷ real new clients" />
        </div>
      </div>
      <p className="small muted">Calculators show scenarios, not forecasts. Nothing here is saved; lodge real results on the Numbers page or in a project.</p>
    </>
  );
}
