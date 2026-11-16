import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ILM Business Coach",
  description: "AI business coaching for beauty business owners, built on Deanna Campese's methods.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet" />
        {/* Apply a saved light/dark choice before first paint (default: follow the device). */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}` }} />
      </head>
      <body>
        {process.env.DEMO_MODE === "true" && (
          <div className="demo-banner">Prototype: private pilot build. Commercial terms, pricing and coaching content are drafts.</div>
        )}
        {children}
      </body>
    </html>
  );
}
