"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = {
  en: [
    { title: "Introdução", items: [
      { href: "/en", label: "Visão Geral" },
      { href: "/en/docs/quickstart", label: "Início Rápido" },
      { href: "/en/docs/architecture", label: "Arquitetura" },
    ]},
    { title: "Guias", items: [
      { href: "/en/docs/deployment", label: "Deploy" },
      { href: "/en/docs/configuration", label: "Configuração" },
      { href: "/en/docs/cli", label: "CLI" },
      { href: "/en/docs/api", label: "API" },
    ]},
    { title: "Referência", items: [
      { href: "/en/docs/performance", label: "Performance" },
      { href: "/en/docs/security", label: "Segurança" },
      { href: "/en/docs/benchmarks", label: "Benchmarks" },
      { href: "/en/docs/faq", label: "FAQ" },
    ]},
  ],
  pt: [
    { title: "Introdução", items: [
      { href: "/pt", label: "Visão Geral" },
      { href: "/pt/docs/quickstart", label: "Início Rápido" },
      { href: "/pt/docs/architecture", label: "Arquitetura" },
    ]},
    { title: "Guias", items: [
      { href: "/pt/docs/deployment", label: "Deploy" },
      { href: "/pt/docs/configuration", label: "Configuração" },
      { href: "/pt/docs/cli", label: "CLI" },
      { href: "/pt/docs/api", label: "API" },
    ]},
    { title: "Referência", items: [
      { href: "/pt/docs/performance", label: "Performance" },
      { href: "/pt/docs/security", label: "Segurança" },
      { href: "/pt/docs/benchmarks", label: "Benchmarks" },
      { href: "/pt/docs/faq", label: "FAQ" },
    ]},
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const isPt = pathname.startsWith("/pt");
  const nav = sections[isPt ? "pt" : "en"];
  const lang = isPt ? "pt" : "en";
  const otherLang = isPt ? "en" : "pt";

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: "0.5rem" }}>
        {nav.map((section) => (
          <div key={section.title} style={{ marginBottom: "0.25rem" }}>
            <span className="sidebar-section-title">{section.title}</span>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
        <Link
          href={`/${otherLang}`}
          className="sidebar-link"
          style={{ fontWeight: 500, color: "var(--fg-muted)", fontSize: "0.8rem" }}
        >
          {isPt ? "🌐 English" : "🌐 Português"}
        </Link>
        <a
          href="https://github.com/mateussiqueira/nidus"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link"
          style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}
        >
          GitHub →
        </a>
      </div>
    </aside>
  );
}
