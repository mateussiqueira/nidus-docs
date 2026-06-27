"use client";

import { useEffect, useState, useRef } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

const langMap: Record<string, string> = {
  typescript: "TypeScript",
  tsx: "TSX",
  ts: "TypeScript",
  javascript: "JavaScript",
  js: "JavaScript",
  go: "Go",
  rust: "Rust",
  rs: "Rust",
  python: "Python",
  bash: "Bash",
  sh: "Shell",
  json: "JSON",
  yaml: "YAML",
  toml: "TOML",
  dockerfile: "Dockerfile",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
};

export default function CodeBlock({ code, language = "typescript", filename }: CodeBlockProps) {
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    let cancelled = false;
    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki");
        const result = await codeToHtml(code, { lang: language, theme: "github-dark" });
        if (!cancelled) setHtml(result);
      } catch {
        setHtml("");
      }
    }
    highlight();
    return () => { cancelled = true; };
  }, [code, language]);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  const langLabel = langMap[language] || language.toUpperCase();

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-header-filename">{filename || langLabel.toLowerCase()}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="code-header-lang">{langLabel}</span>
          <button onClick={handleCopy} className="copy-btn">
            {copied ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
            )}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>
      {html ? (
        <div className="code-content" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="code-content"><pre style={{ margin: 0 }}><code>{code}</code></pre></div>
      )}
    </div>
  );
}
