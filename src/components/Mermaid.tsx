"use client";

import { useEffect, useRef } from "react";

interface MermaidProps {
  chart: string;
  id?: string;
}

let mermaidId = 0;

export default function Mermaid({ chart, id }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const chartId = id || `mermaid-${++mermaidId}`;

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!ref.current) return;

      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#1a1a2e",
          primaryTextColor: "#e0e0e0",
          primaryBorderColor: "#3a3a5e",
          lineColor: "#6c63ff",
          secondaryColor: "#16213e",
          tertiaryColor: "#0f3460",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "14px",
        },
        flowchart: {
          htmlLabels: true,
          curve: "basis",
        },
      });

      const { svg } = await mermaid.render(chartId, chart);
      if (!cancelled && ref.current) {
        ref.current.innerHTML = svg;
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, chartId]);

  return (
    <div
      ref={ref}
      className="my-6 p-4 rounded-lg overflow-x-auto"
      style={{
        background: "var(--bg-secondary, #0d1117)",
        border: "1px solid var(--border)",
      }}
    />
  );
}
