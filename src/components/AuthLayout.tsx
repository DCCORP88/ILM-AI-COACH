import { Wordmark } from "./Wordmark";

export function AuthLayout({ children, title, intro }: { children: React.ReactNode; title: string; intro: string }) {
  return (
    <div className="auth-wrap">
      <aside className="auth-brand">
        <div className="wordmark-light"><Wordmark href="/" /></div>
        <div>
          <h1 className="display" style={{ marginTop: 32 }}>Grow your beauty business, one clear step at a time.</h1>
          <ul>
            <li>A coach built on Deanna Campese&apos;s methods</li>
            <li>Advice based on your real numbers</li>
            <li>A step-by-step program with tasks you can tick off</li>
            <li>Results tracked against your goals</li>
          </ul>
        </div>
        <p className="small legal" style={{ color: "#a99fa2", position: "relative", zIndex: 1, margin: 0 }}>The coach is AI. Results are goals, not guarantees.</p>
      </aside>
      <div className="auth-form">
        <div>
          <h1 style={{ fontSize: "1.3rem" }}>{title}</h1>
          <p className="muted">{intro}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
