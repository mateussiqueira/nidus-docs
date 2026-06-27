"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const COLORS = {
  nidus: "#3b82f6",
  coolify: "#f97316",
  vercel: "#a3a3a3",
  nginx: "#009639",
  traefik: "#ef4444",
  haproxy: "#009ee0",
  node: "#68a063",
  python: "#3776ab",
  php: "#777bb4",
};

const CHART_STYLE = {
  background: "var(--bg-tertiary)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
  padding: "1.5rem",
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-strong)",
        borderRadius: "8px",
        padding: "0.75rem 1rem",
        boxShadow: "var(--shadow-lg)",
        fontSize: "0.8rem",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--fg-primary)" }}>
        {label}
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color, margin: "0.15rem 0" }}>
          {entry.name}: <strong>{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

export function MemoryChart() {
  const data = [
    { name: "API Server", Nidus: 15, Coolify: 80 },
    { name: "Reverse Proxy", Nidus: 8, Coolify: 60 },
    { name: "Worker", Nidus: 12, Coolify: 80 },
    { name: "Dashboard", Nidus: 50, Coolify: 50 },
    { name: "Database", Nidus: 4, Coolify: 12 },
  ];

  return (
    <div style={CHART_STYLE}>
      <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 600, color: "var(--fg-primary)" }}>
        Memory Usage by Component
      </h4>
      <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--fg-muted)" }}>
        Idle RAM in MB — lower is better
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--fg-muted)" }} />
          <YAxis tick={{ fontSize: 12, fill: "var(--fg-muted)" }} unit="MB" />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
          <Bar dataKey="Nidus" fill={COLORS.nidus} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Coolify" fill={COLORS.coolify} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ThroughputChart() {
  const data = [
    { name: "Nidus (Rust)", reqs: 54656, color: COLORS.nidus },
    { name: "HAProxy", reqs: 51200, color: COLORS.haproxy },
    { name: "Nginx", reqs: 48234, color: COLORS.nginx },
    { name: "Traefik", reqs: 32456, color: COLORS.traefik },
  ];

  return (
    <div style={CHART_STYLE}>
      <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 600, color: "var(--fg-primary)" }}>
        Reverse Proxy Throughput
      </h4>
      <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--fg-muted)" }}>
        Requests/sec at 400 concurrent connections — higher is better
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: "var(--fg-muted)" }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--fg-muted)" }} width={110} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="reqs" name="req/s" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DeploySpeedChart() {
  const data = [
    { name: "Nidus", cold: 12.3, cached: 3.8 },
    { name: "Vercel", cold: 18.7, cached: 11.2 },
    { name: "Coolify", cold: 34.2, cached: 18.5 },
  ];

  return (
    <div style={CHART_STYLE}>
      <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 600, color: "var(--fg-primary)" }}>
        Deploy Speed Comparison
      </h4>
      <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--fg-muted)" }}>
        Seconds to deploy a Next.js app — lower is better
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--fg-muted)" }} />
          <YAxis tick={{ fontSize: 12, fill: "var(--fg-muted)" }} unit="s" />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
          <Bar dataKey="cold" name="Cold Deploy" fill={COLORS.nidus} radius={[4, 4, 0, 0]} />
          <Bar dataKey="cached" name="Cached Deploy" fill="#93c5fd" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostChart() {
  const data = [
    { name: "$5 VPS", Nidus: 5, Coolify: 15, Vercel: 20 },
    { name: "$10 VPS", Nidus: 10, Coolify: 15, Vercel: 50 },
    { name: "10 Apps", Nidus: 10, Coolify: 15, Vercel: 100 },
  ];

  return (
    <div style={CHART_STYLE}>
      <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 600, color: "var(--fg-primary)" }}>
        Monthly Cost Comparison
      </h4>
      <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--fg-muted)" }}>
        Cost in USD/month to run deployments
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--fg-muted)" }} />
          <YAxis tick={{ fontSize: 12, fill: "var(--fg-muted)" }} unit="$" />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
          <Bar dataKey="Nidus" fill={COLORS.nidus} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Coolify" fill={COLORS.coolify} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Vercel" fill={COLORS.vercel} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CpuChart() {
  const data = [
    { name: "Nidus (Rust)", cpu: 8, color: COLORS.nidus },
    { name: "Nidus (Go)", cpu: 12, color: "#60a5fa" },
    { name: "Nginx", cpu: 15, color: COLORS.nginx },
    { name: "Traefik", cpu: 22, color: COLORS.traefik },
    { name: "Node.js", cpu: 45, color: COLORS.node },
    { name: "Laravel", cpu: 65, color: COLORS.php },
  ];

  return (
    <div style={CHART_STYLE}>
      <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 600, color: "var(--fg-primary)" }}>
        CPU Usage at 10K req/s
      </h4>
      <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--fg-muted)" }}>
        CPU utilization under load — lower is better
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" barSize={24}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: "var(--fg-muted)" }} unit="%" domain={[0, 80]} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--fg-muted)" }} width={110} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="cpu" name="CPU %" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StartupChart() {
  const data = [
    { name: "Nidus (Rust)", cold: 45, warm: 8 },
    { name: "Nidus (Go)", cold: 85, warm: 12 },
    { name: "Coolify (PHP)", cold: 1200, warm: 350 },
  ];

  return (
    <div style={CHART_STYLE}>
      <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 600, color: "var(--fg-primary)" }}>
        Startup Time
      </h4>
      <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: "var(--fg-muted)" }}>
        Milliseconds from binary start to ready-to-serve
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} />
          <YAxis tick={{ fontSize: 12, fill: "var(--fg-muted)" }} unit="ms" />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
          <Bar dataKey="cold" name="Cold Start" fill={COLORS.nidus} radius={[4, 4, 0, 0]} />
          <Bar dataKey="warm" name="Warm Start" fill="#93c5fd" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
