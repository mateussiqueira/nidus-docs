import CodeBlock from "@/components/CodeBlock";
import { MemoryChart, ThroughputChart, DeploySpeedChart, CostChart } from "@/components/Charts";

export default function PTLandingPage() {
  return (
    <div className="prose">
      {/* Hero */}
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.75rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          Plataforma de deploy self-hosted.<br />
          <span style={{ color: "var(--accent)" }}>10x mais leve, 4x mais rápido.</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--fg-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          Nidus é construído em Go + Rust. Sem Node.js, sem Docker-in-Docker, sem bloat.
          87MB de RAM total. 50K+ req/s. Roda em qualquer VPS de $5.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a
            href="/pt/docs/quickstart"
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

      {/* Stats cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem",
        marginBottom: "2.5rem",
      }}>
        {[
          { label: "RAM Idle", value: "87MB", sub: "vs 392MB Coolify" },
          { label: "Throughput", value: "50K+", sub: "req/s (proxy Rust)" },
          { label: "Deploy", value: "3.8s", sub: "com cache / 12.3s cold" },
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

      <h2>O Problema</h2>
      <p>
        Vercel, Netlify e Railway são ótimos — até você ver a conta. Um app Next.js simples
        custa $20+/mês. Adicione mais alguns projetos e você paga mais de hosting do que
        de cloud compute real.
      </p>
      <p>
        Coolify e Conecthu resolvem o self-hosted, mas empilham camadas: PHP/Laravel rodando
        Docker-in-Docker que orquestra Traefik que gerencia containers. O resultado são mais
        de 300MB de RAM só pra manter a plataforma rodando — antes mesmo de deployar qualquer app.
      </p>
      <p>
        E esse overhead não é gratuito: cada camada extra adiciona latência, pontos de falha
        e complexidade operacional. Docker-in-Docker, em particular, é uma fonte conhecida de
        problemas: builds que falham sem motivo aparente, consumo extra de CPU e disco, e uma
        sensação constante de que algo vai quebrar.
      </p>

      <h2>A Abordagem Nidus</h2>
      <p>
        Nidus foi construído do zero com <strong>Go</strong> para o control plane e
        <strong>Rust</strong> para o data plane. Sem runtime Node.js, sem PHP, sem
        Docker-in-Docker. Dois binários compilados que somados ocupam menos de 20MB de RAM.
      </p>
      <p>
        A filosofia é simples: cada componente deve fazer uma coisa e fazer bem. O proxy em
        Rust roteia tráfego com latência mínima. O servidor em Go gerencia deploys e
        autenticação. O worker em Go constrói imagens Docker chamando a API nativa — sem
        overlays desnecessários.
      </p>

      <h2>Por que Nidus Vence</h2>

      <h3>3x Menos Memória</h3>
      <p>
        No mesmo VPS de $5, Nidus usa 87MB totais. Coolify precisa de 392MB — e isso sem
        contar os apps deployados. Com Nidus, seu VPS de $5 roda o stack completo da
        plataforma <em>mais</em> 5-10 aplicações. Com Coolify, você chega no limite de RAM
        depois de 2 ou 3 apps.
      </p>
      <MemoryChart />

      <h3>4x Mais Throughput</h3>
      <p>
        O proxy em Rust processa 54.656 req/s em um VPS de $5. Isso é 3x mais que Nginx
        (48.234 req/s) e 4x mais que Traefik (32.456 req/s). A diferença vem do Tokio
        (runtime async do Rust) combinado com zero garbage collection — não há pausas,
        não há overhead, apenas throughput bruto.
      </p>
      <ThroughputChart />

      <h3>2x Deploys Mais Rápidos</h3>
      <p>
        Deploy cold em 12.3s — contra 34.2s do Coolify e 18.7s do Vercel. Deploy com cache
        em 3.8s. A diferença principal é o uso do Docker SDK nativo (Go) em vez de
        Docker-in-Docker, que elimina uma camada inteira de I/O e syscalls.
      </p>
      <DeploySpeedChart />

      <h3>$5/mês Roda Tudo</h3>
      <p>
        Um Hetzner CX11 de $5/mês (1 vCPU, 1GB RAM, 40GB NVMe) roda o stack completo do
        Nidus mais 5 aplicações com 600MB de RAM sobrando. Coolify no mesmo hardware
        começa a dar OOM kill na terceira aplicação.
      </p>

      <h2>Stack</h2>
      <table>
        <thead>
          <tr><th>Componente</th><th>Tecnologia</th><th>RAM Idle</th><th>Função</th></tr>
        </thead>
        <tbody>
          <tr><td>API Server</td><td><span className="badge badge-go">Go</span></td><td>15MB</td><td>REST API, autenticação, webhooks</td></tr>
          <tr><td>Reverse Proxy</td><td><span className="badge badge-rust">Rust</span></td><td>8MB</td><td>Rate limiting, TLS, load balance</td></tr>
          <tr><td>Worker</td><td><span className="badge badge-go">Go</span></td><td>12MB</td><td>Build Docker, deploy, health check</td></tr>
          <tr><td>Dashboard</td><td>Next.js</td><td>50MB</td><td>Interface web de gerenciamento</td></tr>
          <tr><td>Redis</td><td>—</td><td>4MB</td><td>Job queue, sessão, cache</td></tr>
          <tr><td><strong>Total</strong></td><td></td><td><strong>~87MB</strong></td><td></td></tr>
        </tbody>
      </table>

      <h2>Comparação</h2>
      <table>
        <thead>
          <tr><th>Feature</th><th>Vercel</th><th>Coolify</th><th>Nidus</th></tr>
        </thead>
        <tbody>
          <tr><td>Control Plane</td><td>Node.js</td><td>PHP/Laravel</td><td><strong>Go</strong></td></tr>
          <tr><td>Reverse Proxy</td><td>Proprietário</td><td>Traefik</td><td><strong>Rust</strong></td></tr>
          <tr><td>RAM Idle</td><td>N/A (cloud)</td><td>~400MB</td><td><strong>~30MB</strong></td></tr>
          <tr><td>Deploy Speed</td><td>10-30s</td><td>30-90s</td><td><strong>5-15s</strong></td></tr>
          <tr><td>Throughput</td><td>Ilimitado ($$)</td><td>~10K req/s</td><td><strong>50K+ req/s</strong></td></tr>
          <tr><td>Docker-in-Docker</td><td>N/A</td><td>Sim</td><td><strong>Não</strong></td></tr>
          <tr><td>Binário Único</td><td>N/A</td><td>Não</td><td><strong>Sim (Go)</strong></td></tr>
          <tr><td>Proxy Dinâmico</td><td>N/A</td><td>Não</td><td><strong>Sim (API)</strong></td></tr>
          <tr><td>Custo Mensal</td><td>$20+</td><td>Self-hosted</td><td><strong>Self-hosted</strong></td></tr>
        </tbody>
      </table>

      <h2>Funcionalidades</h2>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem",
        marginBottom: "1.5rem",
      }}>
        {[
          "Git Deploy — push no GitHub, deploy automático via webhook",
          "CLI Deploy — `nidus deploy` de qualquer diretório",
          "Rolling Updates — zero downtime com health checks",
          "Domínios Customizados — TLS automático com Let's Encrypt",
          "Variáveis de Ambiente — criptografadas em repouso",
          "Multi-Framework — Next.js, Nuxt, SvelteKit, Astro, qualquer Dockerfile",
          "App macOS — dashboard nativo SwiftUI",
          "Isolamento Docker — cada app em seu próprio container",
        ].map((feat) => (
          <div key={feat} style={{
            padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", fontSize: "0.875rem",
          }}>
            {feat}
          </div>
        ))}
      </div>

      <h2>Roadmap</h2>
      <p>
        Nidus está em alpha, mas já é funcional para uso pessoal e projetos pequenos.
        O que está por vir:
      </p>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem",
        marginBottom: "1.5rem",
      }}>
        <div style={{
          padding: "1rem", borderRadius: "var(--radius)",
          border: "1px solid var(--border)", background: "var(--bg-secondary)",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>🧪 Alpha (Atual)</div>
          <ul style={{ fontSize: "0.8rem", paddingLeft: "1rem", margin: 0 }}>
            <li>Deploy via Git</li>
            <li>CLI + API</li>
            <li>Proxy dinâmico</li>
            <li>Health checks</li>
          </ul>
        </div>
        <div style={{
          padding: "1rem", borderRadius: "var(--radius)",
          border: "1px solid var(--border)", background: "var(--bg-secondary)",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>🔧 Beta (Q3 2026)</div>
          <ul style={{ fontSize: "0.8rem", paddingLeft: "1rem", margin: 0 }}>
            <li>Dashboard web</li>
            <li>Métricas em tempo real</li>
            <li>Rolling updates</li>
            <li>App macOS</li>
          </ul>
        </div>
        <div style={{
          padding: "1rem", borderRadius: "var(--radius)",
          border: "1px solid var(--border)", background: "var(--bg-secondary)",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>🚀 GA (Q4 2026)</div>
          <ul style={{ fontSize: "0.8rem", paddingLeft: "1rem", margin: 0 }}>
            <li>Multi-node</li>
            <li>Auto-scaling</li>
            <li>Observabilidade</li>
            <li>Template marketplace</li>
          </ul>
        </div>
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
          href="/pt/docs/quickstart"
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
          Gratuito e open source. Construído com Go + Rust. Sem vendor lock-in.
        </p>
      </div>
    </div>
  );
}
