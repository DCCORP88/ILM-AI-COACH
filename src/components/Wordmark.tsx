import Link from "next/link";

// The ILM logo is at public/logo.png (served as /logo.png). Set to false to show the text wordmark instead.
const hasLogo = true;

/** ILM logo if public/logo.png exists, otherwise an elegant text wordmark. */
export function Wordmark({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="wordmark" aria-label="International Lash Masters Business Coach, home">
      {hasLogo ? (
        <span className="logo-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={56} height={46} />
          <span className="logo-text"><span className="full">International Lash Masters</span><span className="sub">Business Coach</span></span>
        </span>
      ) : (
        <>
          <span className="ilm">ILM</span>
          <span className="sub">Business Coach</span>
        </>
      )}
    </Link>
  );
}
