"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export type NavItem = { href: string; label: string; icon: string };
export const PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/program", label: "My program", icon: "program" },
  { href: "/chat", label: "Ask the coach", icon: "chat" },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/community", label: "Community", icon: "community" },
  { href: "/numbers", label: "My numbers", icon: "numbers" },
];
export const SECONDARY: NavItem[] = [
  { href: "/checkin", label: "Weekly check-in", icon: "checkin" },
  { href: "/marketing", label: "Marketing", icon: "marketing" },
  { href: "/tools", label: "Tools", icon: "tools" },
  { href: "/resources", label: "Saved resources", icon: "resources" },
  { href: "/profile", label: "Profile & reminders", icon: "profile" },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");

/** Desktop links in the white top menu bar. */
export function TopLinks() {
  const path = usePathname();
  const moreActive = SECONDARY.some((i) => isActive(path, i.href));
  return (
    <nav className="nav" aria-label="Main menu">
      {PRIMARY.map((i) => (
        <Link key={i.href} href={i.href} className={isActive(path, i.href) ? "active" : ""} aria-current={isActive(path, i.href) ? "page" : undefined}>
          <Icon name={i.icon} size={16} />{i.label}
        </Link>
      ))}
      <details key={path}>
        <summary className={moreActive ? "active" : ""}><Icon name="more" size={16} />More</summary>
        <div className="dropdown">
          {SECONDARY.map((i) => (
            <Link key={i.href} href={i.href} className={isActive(path, i.href) ? "active" : ""}><Icon name={i.icon} size={16} />{i.label}</Link>
          ))}
        </div>
      </details>
    </nav>
  );
}

/** Phone: bottom tab bar with the 4 main places plus "More". */
export function TabBar() {
  const path = usePathname();
  const tabs = PRIMARY.slice(0, 4);
  const more = [...PRIMARY.slice(4), ...SECONDARY];
  return (
    <nav className="tabbar" aria-label="Main menu">
      {tabs.map((i) => (
        <Link key={i.href} href={i.href} className={isActive(path, i.href) ? "active" : ""} aria-current={isActive(path, i.href) ? "page" : undefined}>
          <Icon name={i.icon} size={22} />{i.label === "Ask the coach" ? "Coach" : i.label === "My program" ? "Program" : i.label}
        </Link>
      ))}
      <details key={path}>
        <summary className={more.some((i) => isActive(path, i.href)) ? "active" : ""}><Icon name="more" size={22} />More</summary>
        <div className="more">
          {more.map((i) => <Link key={i.href} href={i.href} className={isActive(path, i.href) ? "active" : ""}><Icon name={i.icon} size={18} />{i.label}</Link>)}
        </div>
      </details>
    </nav>
  );
}

/** Light / dark switch. Default follows the device; a choice is remembered on this device. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    try { setTheme(localStorage.getItem("theme")); } catch {}
    setSystemDark(window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
    setMounted(true);
  }, []);
  const isDark = theme ? theme === "dark" : systemDark;
  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
  };
  return (
    <button type="button" className="iconbtn" onClick={toggle} title={!mounted ? "Switch light/dark mode" : isDark ? "Switch to light mode" : "Switch to dark mode"} aria-label={!mounted ? "Switch light/dark mode" : isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <Icon name={!mounted ? "moon" : isDark ? "sun" : "moon"} size={17} />
    </button>
  );
}
