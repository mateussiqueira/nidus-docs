import CodeBlock from "@/components/CodeBlock";
import { MemoryChart, ThroughputChart, DeploySpeedChart } from "@/components/Charts";

export default function LandingPage() {
  return (
    <div className="prose">
      {/* Hero */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <span className="badge badge-go">Go</span>
          <span className="badge badge-rust">Rust</span>
        </div>
        <h1 style={{ fontSize: "2.75rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          Self-hosted deploy platform.<br />
          <span style={{ color: "var(--accent)" }}>10x menor, 4x mais rápido.</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--fg-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          Nidus é construído em Go + Rust. Sem Node.js, sem Docker-in-Docker, sem bloat.
          87MB de RAM total. 50K+ req/s. Roda em qualquer VPS de $5.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a
            href="/en/docs/quickstart"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.6rem 1.25rem", borderRadius: "var(--radius)",
              background: "var(--accent)", color: "white", fontWeight: 600,
              fontSize: "0.9rem", textDecoration: "none",
            }}
          >
            Começar Agora →
          </a>
          <a
            href="https://github.com/mateussiqueira/nidus"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.6rem 1.25rem", borderRadius: "var(--radius)",
              border: "1px solid var(--border)", color: "var(--fg-secondary)",
              fontWeight: 500, fontSize: "0.9rem", textDecoration: "none",
            }}
          >
            GitHub
          </a>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem",
        marginBottom: "2.5rem",
      }}>
        {[
          { label: "RAM Idle", value: "87MB", sub: "vs 392MB Coolify" },
          { label: "Throughput", value: "50K+", sub: "req/s (Rust)" },
          { label: "Deploy", value: "3.8s", sub: "cached / 12.3s cold" },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "1rem", borderRadius: "var(--radius)",
            border: "1px solid var(--border)", background: "var(--bg-secondary)",
          }}>
            <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: "0.25rem" }}>{stat.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em" }}>{stat.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <h2>Por que Nidus?</h2>
      <p>
        Vercel, Netlify e Railway são ótimos — até você ver a conta. Coolify resolve o
        self-hosted, mas com PHP, Docker-in-Docker e alto consumo de RAM. Nidus foi
        construído do zero com Go e Rust para ser <strong>10x mais leve</strong>.
      </p>

      <h3>3x Menos Memória</h3>
      <p>No mesmo VPS de $5, Nidus usa 87MB. Coolify precisa de 392MB. Isso significa rodar 5-10 apps em vez de 2-3.</p>
      <MemoryChart />

      <h3>4x Mais Throughput</h3>
      <p>O proxy Rust processa 54.656 req/s — 3x mais que Nginx, 4x mais que Traefik.</p>
      <ThroughputChart />

      <h3>2x Deploys Mais Rápidos</h3>
      <p>Cold deploy em 12.3s. Deploy com cache em 3.8s. O worker Go usa Docker SDK nativo — sem Docker-in-Docker.</p>
      <DeploySpeedChart />

      <h2>Stack</h2>
      <table>
        <thead>
          <tr><th>Componente</th><th>Tecnologia</th><th>RAM</th></tr>
        </thead>
        <tbody>
          <tr><td>API Server</td><td>Go</td><td>15MB</td></tr>
          <tr><td>Reverse Proxy</td><td>Rust</td><td>8MB</td></tr>
          <tr><td>Worker</td><td>Go</td><td>12MB</td></tr>
          <tr><td>Dashboard</td><td>Next.js</td><td>50MB</td></tr>
          <tr><td>Redis</td><td>—</td><td>4MB</td></tr>
          <tr><td><strong>Total</strong></td><td></td><td><strong>~87MB</strong></td></tr>
        </tbody>
      </table>

      <h2>Comparação</h2>
      <table>
        <thead>
          <tr><th>Feature</th><th>Vercel</th><th>Coolify</th><th>Nidus</th></tr>
        </thead>
        <tbody>
          <tr><td>Control Plane</td><td>Node.js</td><td>PHP</td><td><strong>Go</strong></td></tr>
          <tr><td>Proxy</td><td>Proprietário</td><td>Traefik</td><td><strong>Rust</strong></td></tr>
          <tr><td>RAM Idle</td><td>N/A</td><td>~400MB</td><td><strong>~30MB</strong></td></tr>
          <tr><td>Deploy Speed</td><td>10-30s</td><td>30-90s</td><td><strong>5-15s</strong></td></tr>
          <tr><td>Throughput</td><td>$$$</td><td>10K req/s</td><td><strong>50K+ req/s</strong></td></tr>
          <tr><td>Custo/mês</td><td>$20+</td><td>Self-hosted</td><td><strong>Self-hosted</strong></td></tr>
        </tbody>
      </table>

      <h2>Funcionalidades</h2>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem",
        marginBottom: "1.5rem",
      }}>
        {[
          "Git Deploy — push no GitHub, deploy automático",
          "CLI — `nidus deploy` de qualquer diretório",
          "Rolling Updates — zero downtime com health checks",
          "Domínios Customizados — TLS automático com Let's Encrypt",
          "Variáveis de Ambiente — criptografadas",
          "Multi-Framework — Next.js, Nuxt, SvelteKit, Astro, Dockerfile",
          "App macOS — dashboard nativo SwiftUI",
          "Isolamento Docker — cada app em seu container",
        ].map((feat) => (
          <div key={feat} style={{
            padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", fontSize: "0.875rem",
          }}>
            {feat}
          </div>
        ))}
      </div>

      <h2>Comece em 3 Passos</h2>
      <CodeBlock
        code={`git clone https://github.com/mateussiqueira/nidus.git
cd nidus
cp .env.example .env
nano .env
docker compose up -d`}
        language="bash"
        filename="terminal"
      />

      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <a
          href="/en/docs/quickstart"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.7rem 1.5rem", borderRadius: "var(--radius)",
            background: "var(--accent)", color: "white", fontWeight: 600,
            fontSize: "1rem", textDecoration: "none",
          }}
        >
          Comece a Deployar Agora →
        </a>
        <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: "0.75rem" }}>
          Gratuito e open source. Construído com Go + Rust.
        </p>
      </div>
    </div>
  );
}
