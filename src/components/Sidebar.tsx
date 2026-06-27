"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const enSections: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { href: "/en", label: "Overview" },
      { href: "/en/docs/quickstart", label: "Quick Start" },
      { href: "/en/docs/architecture", label: "Architecture" },
    ],
  },
  {
    title: "Core",
    items: [
      { href: "/en/docs/deployment", label: "Deployment" },
      { href: "/en/docs/configuration", label: "Configuration" },
      { href: "/en/docs/cli", label: "CLI Reference" },
      { href: "/en/docs/api", label: "API Reference" },
    ],
  },
  {
    title: "Deep Dives",
    items: [
      { href: "/en/docs/performance", label: "Performance" },
      { href: "/en/docs/security", label: "Security" },
      { href: "/en/docs/benchmarks", label: "Benchmarks" },
    ],
  },
  {
    title: "Resources",
    items: [{ href: "/en/docs/faq", label: "FAQ" }],
  },
];

const ptSections: NavSection[] = [
  {
    title: "Começando",
    items: [
      { href: "/pt", label: "Visão Geral" },
      { href: "/pt/docs/quickstart", label: "Primeiros Passos" },
      { href: "/pt/docs/architecture", label: "Arquitetura" },
    ],
  },
  {
    title: "Core",
    items: [
      { href: "/pt/docs/deployment", label: "Deploy" },
      { href: "/pt/docs/configuration", label: "Configuração" },
      { href: "/pt/docs/cli", label: "Referência CLI" },
      { href: "/pt/docs/api", label: "Referência API" },
    ],
  },
  {
    title: "Aprofundamento",
    items: [
      { href: "/pt/docs/performance", label: "Performance" },
      { href: "/pt/docs/security", label: "Segurança" },
      { href: "/pt/docs/benchmarks", label: "Benchmarks" },
    ],
  },
  {
    title: "Recursos",
    items: [{ href: "/pt/docs/faq", label: "FAQ" }],
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      style={{
        transition: "transform 0.2s ease",
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
        opacity: 0.5,
        flexShrink: 0,
      }}
    >
      <path d="M4.5 2.5L7.5 6L4.5 9.5" />
    </svg>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const isPt = pathname.startsWith("/pt");
  const sections = isPt ? ptSections : enSections;
  const lang = isPt ? "pt" : "en";
  const otherLang = isPt ? "en" : "pt";
  const otherLabel = isPt ? "EN" : "PT";

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((s) => {
      const isActive = s.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
      initial[s.title] = isActive;
    });
    setOpenSections(initial);
  }, [pathname, sections]);

  function toggleSection(title: string) {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div
        style={{
          padding: "1.25rem 1rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href={`/${lang}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: "0.8rem",
            }}
          >
            N
          </div>
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--fg-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Nidus
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 500,
              color: "var(--fg-muted)",
              background: "var(--bg-tertiary)",
              padding: "0.1rem 0.4rem",
              borderRadius: "4px",
              border: "1px solid var(--border)",
            }}
          >
            docs
          </span>
        </Link>

        {/* Mobile close */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "var(--fg-muted)",
              cursor: "pointer",
              padding: "4px",
            }}
            className="mobile-close-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Language switch + GitHub */}
      <div
        style={{
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <Link
          href={`/${otherLang}`}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            padding: "0.4rem",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--fg-muted)",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--fg-muted)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          {otherLabel}
        </Link>
        <a
          href="https://github.com/mateussiqueira/nidus"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            padding: "0.4rem",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--fg-muted)",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--fg-primary)";
            e.currentTarget.style.color = "var(--fg-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--fg-muted)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.75rem 0.5rem",
        }}
      >
        {sections.map((section) => {
          const isOpen = openSections[section.title] !== false;
          return (
            <div key={section.title} style={{ marginBottom: "0.25rem" }}>
              <button
                onClick={() => toggleSection(section.title)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--fg-muted)",
                  textAlign: "left",
                  borderRadius: "6px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--sidebar-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <ChevronIcon open={isOpen} />
                {section.title}
              </button>
              <div
                style={{
                  maxHeight: isOpen ? "500px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.25s ease",
                  marginLeft: "0.5rem",
                  borderLeft: "1px solid var(--border)",
                  paddingLeft: "0.5rem",
                }}
              >
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link ${isActive ? "active" : ""}`}
                      onClick={onClose}
                      style={{
                        position: "relative",
                        marginTop: "1px",
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "0.75rem 1rem",
          borderTop: "1px solid var(--border)",
          fontSize: "0.7rem",
          color: "var(--fg-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>v1.0.0</span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 4px #22c55e",
            }}
          />
          Online
        </span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{
          display: "none",
          position: "fixed",
          top: "1rem",
          left: "1rem",
          zIndex: 50,
          padding: "0.5rem",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          color: "var(--fg-primary)",
          cursor: "pointer",
          boxShadow: "var(--shadow-md)",
        }}
        className="mobile-hamburger"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside
        style={{
          width: 280,
          flexShrink: 0,
          height: "100vh",
          position: "sticky",
          top: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--sidebar-bg)",
          overflow: "hidden",
        }}
        className="desktop-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
          }}
          className="mobile-overlay"
        >
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          />
          <aside
            style={{
              position: "relative",
              width: 280,
              height: "100%",
              background: "var(--sidebar-bg)",
              boxShadow: "var(--shadow-lg)",
              zIndex: 1,
            }}
          >
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <style>{`
        .mobile-hamburger { display: none !important; }
        .mobile-close-btn { display: none !important; }
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-hamburger { display: flex !important; }
          .mobile-close-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
