"use client";

import { useEffect, useState, useRef } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      const { codeToHtml } = await import("shiki");
      const result = await codeToHtml(code, {
        lang: language,
        theme: "github-dark",
        transformers: [
          {
            pre(node) {
              this.addClassToHast(node, "code-block");
            },
          },
        ],
      });
      if (!cancelled) setHtml(result);
    }

    highlight();
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  const langMap: Record<string, string> = {
    typescript: "TypeScript",
    tsx: "TSX",
    ts: "TypeScript",
    javascript: "JavaScript",
    jsx: "JSX",
    js: "JavaScript",
    go: "Go",
    rust: "Rust",
    rs: "Rust",
    python: "Python",
    py: "Python",
    bash: "Bash",
    sh: "Shell",
    shell: "Shell",
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    toml: "TOML",
    dockerfile: "Dockerfile",
    sql: "SQL",
    html: "HTML",
    css: "CSS",
  };

  const langLabel = langMap[language] || language.toUpperCase();

  const lines = code.split("\n");
  const lineCount = lines.length;

  return (
    <div className="code-block-wrapper" style={{ marginBottom: "1.5rem" }}>
      {/* Header bar */}
      <div
        className="code-block-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 1rem",
          background: "var(--bg-tertiary)",
          borderTop: "1px solid var(--border-strong)",
          borderLeft: "1px solid var(--border-strong)",
          borderRight: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          fontSize: "0.8rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Traffic lights */}
          <div style={{ display: "flex", gap: "6px" }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ff5f57",
              }}
            />
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#febc2e",
              }}
            />
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#28c840",
              }}
            />
          </div>
          {filename && (
            <span
              style={{
                color: "var(--fg-muted)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
              }}
            >
              {filename}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              color: "var(--fg-muted)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {langLabel}
          </span>
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              color: copied ? "#22c55e" : "var(--fg-muted)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontFamily: "'JetBrains Mono', monospace",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = copied ? "#22c55e" : "var(--fg-muted)";
            }}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Code content */}
      {html ? (
        <div
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
            overflow: "hidden",
            border: "1px solid var(--border-strong)",
            borderTop: "none",
          }}
        />
      ) : (
        <pre
          style={{
            background: "var(--code-bg)",
            color: "var(--code-fg)",
            padding: "1rem",
            borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
            border: "1px solid var(--border-strong)",
            borderTop: "none",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            overflowX: "auto",
          }}
        >
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
