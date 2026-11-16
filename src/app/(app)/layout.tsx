import { requireUser } from "@/lib/auth";
import { logout } from "../actions";
import { coachMode } from "@/lib/coach";
import { TabBar, ThemeToggle, TopLinks } from "@/components/AppNav";
import { Wordmark } from "@/components/Wordmark";
import { Icon } from "@/components/Icon";

// Coach answers and plan builds can take up to ~1 minute; allow up to 5 minutes on the host.
export const maxDuration = 300;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <header className="topnav">
        <div className="topnav-inner">
          <Wordmark />
          <TopLinks />
          <div className="who">
            {user.isDemo && <span className="badge warn">Demo data</span>}
            {coachMode() === "demo" && <span className="badge warn">Coach: demo</span>}
            <span className="bizname">{user.businessName}</span>
            <ThemeToggle />
            <form action={logout}><button className="iconbtn" title="Log out" aria-label="Log out"><Icon name="logout" size={16} /></button></form>
          </div>
        </div>
      </header>
      <main className="main">{children}</main>
      <TabBar />
    </>
  );
}
