"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPt = pathname.startsWith("/pt");
  const lang = isPt ? "pt" : "en";
  const otherLang = isPt ? "en" : "pt";
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const t = stored || (prefersDark ? "dark" : "light");
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  const isHome = pathname === `/${lang}` || pathname === `/${otherLang}` || pathname === "/";

  const navLinks = [
    { href: `/${lang}`, label: isPt ? "Home" : "Home" },
    { href: `/${lang}/docs/quickstart`, label: isPt ? "Início Rápido" : "Quickstart" },
    { href: `/${lang}/docs/architecture`, label: "Arquitetura" },
    { href: `/${lang}/docs/benchmarks`, label: "Benchmarks" },
    { href: `/${lang}/docs/faq`, label: "FAQ" },
  ];

  return (
    <>
      {/* Header */}
      <header className="layout-header" style={{ height: 56, display: "flex", alignItems: "center", padding: "0 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flex: 1 }}>
          <Link href={`/${lang}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 800, fontSize: "0.75rem",
            }}>N</div>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--fg)", letterSpacing: "-0.02em" }}>
              Nidus
            </span>
          </Link>

          <nav style={{ display: "flex", gap: "0.25rem" }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${pathname === link.href ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {mounted && (
            <button onClick={toggleTheme} className="theme-btn" title={theme === "dark" ? "Modo claro" : "Modo escuro"}>
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              )}
            </button>
          )}
          <Link
            href={`/${otherLang}`}
            style={{
              fontSize: "0.8rem", fontWeight: 600, color: "var(--fg-muted)",
              textDecoration: "none", padding: "0.3rem 0.5rem", borderRadius: "var(--radius-sm)",
            }}
            className="nav-link"
          >
            {otherLang === "pt" ? "PT" : "EN"}
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="layout-body">
        {!isHome && <Sidebar />}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </>
  );
}
