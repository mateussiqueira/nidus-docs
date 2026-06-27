import CodeBlock from "@/components/CodeBlock";
import { MemoryChart, ThroughputChart, DeploySpeedChart } from "@/components/Charts";

export default function PTLandingPage() {
  return (
    <div className="prose">
      <div className="text-center mb-12">
        <div className="mb-4">
          <span className="badge badge-go">Go</span>{" "}
          <span className="badge badge-rust">Rust</span>{" "}
          <span className="badge badge-perf">Produção</span>
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          Nidus
        </h1>
        <p className="text-2xl mb-8" style={{ color: "var(--muted)" }}>
          Plataforma de deploy self-hosted.<br />
          Vercel que roda na sua máquina.
        </p>

        <div className="flex gap-4 justify-center not-prose">
          <a
            href="/pt/docs/quickstart"
            className="px-6 py-3 rounded-lg font-semibold text-white transition"
            style={{ background: "var(--accent)" }}
          >
            Começar Agora →
          </a>
          <a
            href="https://github.com/mateussiqueira/nidus"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg font-semibold border transition"
            style={{ borderColor: "var(--border)" }}
          >
            Ver no GitHub
          </a>
        </div>
      </div>

      <h2>O Problema</h2>
      <p>
        Vercel, Netlify e Railway são ótimos — até você olhar a conta. Um app Next.js simples
        custa $20+/mês. Adicione mais projetos e você paga mais por hosting do que pelo
        compute real. Coolify resolve a parte de self-hosted, mas ele
        usa overhead de Node.js, complexidade Docker-in-Docker e consome muita RAM.
      </p>

      <h2>A Abordagem Nidus</h2>
      <p>
        Nidus é construído do zero com <strong>Go</strong> para o control plane e <strong>Rust</strong> para o data plane.
        Sem overhead de runtime Node.js. Sem containers pesados. Apenas binários compilados que
        usam 10x menos memória que alternativas em JavaScript.
      </p>

      <div className="not-prose grid grid-cols-3 gap-4 my-8">
        <div className="p-4 rounded-lg border text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl font-bold mb-2" style={{ color: "#00ADD8" }}>Go</div>
          <div className="text-sm font-semibold mb-1">Control Plane</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>API, Auth, Webhooks, Fila de Deploy</div>
          <div className="text-xs mt-2 font-mono">~15MB RAM idle</div>
        </div>
        <div className="p-4 rounded-lg border text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl font-bold mb-2" style={{ color: "#CE422B" }}>Rust</div>
          <div className="text-sm font-semibold mb-1">Data Plane</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>Reverse Proxy, Rate Limiting, TLS</div>
          <div className="text-xs mt-2 font-mono">50K+ req/s</div>
        </div>
        <div className="p-4 rounded-lg border text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl font-bold mb-2" style={{ color: "#38BDF8" }}>Next.js</div>
          <div className="text-sm font-semibold mb-1">Dashboard</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>UI bonita para gerenciar deploys</div>
          <div className="text-xs mt-2 font-mono">~50MB RAM</div>
        </div>
      </div>

      <h2>Por que Nidus Vence</h2>

      <h3>3x Menos Memória</h3>
      <p>
        No mesmo VPS de $5, Nidus usa 87MB no total enquanto Coolify precisa de 392MB.
        Isso significa rodar 5-10 apps no VPS mais barato em vez de 2-3.
      </p>
      <div className="not-prose my-8"><MemoryChart /></div>

      <h3>4x Mais Throughput</h3>
      <p>
        O proxy Rust processa 54.656 req/s — 3x mais que Nginx e 4x mais que Traefik.
        Seus apps recebem mais tráfego com menos hardware.
      </p>
      <div className="not-prose my-8"><ThroughputChart /></div>

      <h3>2x Deploys Mais Rápidos</h3>
      <p>
        Cold deploy: 12.3s vs 34.2s (Coolify) ou 18.7s (Vercel). Deploy com cache:
        3.8s vs 18.5s. O worker Go usa Docker SDK nativo — sem overhead Docker-in-Docker.
      </p>
      <div className="not-prose my-8"><DeploySpeedChart /></div>

      <h3>$5/mês Roda Tudo</h3>
      <p>
        Um Hetzner CX11 de $5 (1 vCPU, 1GB RAM) roda o stack completo do Nidus mais 5 apps
        deployed com 600MB de RAM sobrando. Coolify precisa de $10-15/mês no mínimo.
      </p>

      <h2>Comparação</h2>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Vercel</th>
            <th>Coolify</th>
            <th>Nidus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Control Plane</td>
            <td>Node.js</td>
            <td>PHP/Laravel</td>
            <td><strong>Go</strong></td>
          </tr>
          <tr>
            <td>Reverse Proxy</td>
            <td>Proprietário</td>
            <td>Traefik</td>
            <td><strong>Rust</strong></td>
          </tr>
          <tr>
            <td>RAM Idle</td>
            <td>N/A (cloud)</td>
            <td>~400MB</td>
            <td><strong>~30MB</strong></td>
          </tr>
          <tr>
            <td>Velocidade Deploy</td>
            <td>10-30s</td>
            <td>30-90s</td>
            <td><strong>5-15s</strong></td>
          </tr>
          <tr>
            <td>Throughput Proxy</td>
            <td>Ilimitado ($$)</td>
            <td>~10K req/s</td>
            <td><strong>50K+ req/s</strong></td>
          </tr>
          <tr>
            <td>Custo Mensal</td>
            <td>$20+</td>
            <td>Self-hosted</td>
            <td><strong>Self-hosted</strong></td>
          </tr>
        </tbody>
      </table>

      <h2>Features</h2>
      <ul>
        <li><strong>Git Deploy</strong> — Push para GitHub, deploy automático via webhook</li>
        <li><strong>CLI Deploy</strong> — <code>nidus deploy</code> de qualquer diretório</li>
        <li><strong>Rolling Updates</strong> — Deploys sem downtime com health checks</li>
        <li><strong>Domínios Customizados</strong> — TLS automático com Let&apos;s Encrypt</li>
        <li><strong>Variáveis de Ambiente</strong> — Criptografadas em repouso</li>
        <li><strong>Multi-Framework</strong> — Next.js, Nuxt, SvelteKit, Astro, qualquer Dockerfile</li>
        <li><strong>App macOS</strong> — Dashboard nativo SwiftUI</li>
        <li><strong>Isolamento Docker</strong> — Cada app em seu próprio container</li>
      </ul>

      <h2>Comece em 3 Passos</h2>
      <CodeBlock code={`# 1. Clone
git clone https://github.com/mateussiqueira/nidus.git
cd nidus

# 2. Configure
cp .env.example .env
nano .env

# 3. Deploy
docker compose up -d`} language="bash" filename="terminal" />

      <div className="text-center my-12 not-prose">
        <a
          href="/pt/docs/quickstart"
          className="px-8 py-4 rounded-lg font-bold text-lg text-white inline-block"
          style={{ background: "var(--accent)" }}
        >
          Comece a Deployar Agora →
        </a>
        <p className="text-sm mt-4" style={{ color: "var(--muted)" }}>
          Gratuito e open source. Sem vendor lock-in.
        </p>
      </div>

      <div className="text-center" style={{ color: "var(--muted)" }}>
        <p className="text-sm">
          Construído com Go + Rust por <a href="https://github.com/mateussiqueira">Mateus Siqueira</a>
        </p>
      </div>
    </div>
  );
}
