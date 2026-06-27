import CodeBlock from "@/components/CodeBlock";
import { MemoryChart, ThroughputChart, DeploySpeedChart } from "@/components/Charts";

export default function LandingPage() {
  return (
    <div className="prose">
      <div className="text-center mb-12">
        <div className="mb-4">
          <span className="badge badge-go">Go</span>{" "}
          <span className="badge badge-rust">Rust</span>{" "}
          <span className="badge badge-perf">Production Ready</span>
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          Nidus
        </h1>
        <p className="text-2xl mb-8" style={{ color: "var(--muted)" }}>
          Self-hosted deploy platform.<br />
          Think Vercel that runs on your own machine.
        </p>

        <div className="flex gap-4 justify-center not-prose">
          <a
            href="/en/docs/quickstart"
            className="px-6 py-3 rounded-lg font-semibold text-white transition"
            style={{ background: "var(--accent)" }}
          >
            Get Started →
          </a>
          <a
            href="https://github.com/mateussiqueira/nidus"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg font-semibold border transition"
            style={{ borderColor: "var(--border)" }}
          >
            View on GitHub
          </a>
        </div>
      </div>

      <h2>The Problem</h2>
      <p>
        Vercel, Netlify, and Railway are great — until you hit the bill. A simple Next.js app
        costs $20+/mo. Add a few more projects and you&apos;re paying more for hosting than your
        actual cloud compute. Coolify solves the self-hosted part, but it
        ships with PHP overhead, Docker-in-Docker complexity, and memory hogs.
      </p>

      <h2>The Nidus Approach</h2>
      <p>
        Nidus is built from scratch with <strong>Go</strong> for the control plane and <strong>Rust</strong> for the data plane.
        No Node.js runtime overhead. No bloated containers. Just compiled binaries that
        use 10x less memory than JavaScript alternatives.
      </p>

      <div className="not-prose grid grid-cols-3 gap-4 my-8">
        <div className="p-4 rounded-lg border text-center" style={{ borderColor: "var(--border)" }}>
          <div className="text-4xl font-bold mb-2" style={{ color: "#00ADD8" }}>Go</div>
          <div className="text-sm font-semibold mb-1">Control Plane</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>API, Auth, Webhooks, Deploy Queue</div>
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
          <div className="text-xs" style={{ color: "var(--muted)" }}>Beautiful UI for managing deploys</div>
          <div className="text-xs mt-2 font-mono">~50MB RAM</div>
        </div>
      </div>

      <h2>Why Nidus Wins</h2>

      <h3>3x Less Memory</h3>
      <p>
        On the same $5 VPS, Nidus uses 87MB total while Coolify needs 392MB.
        That means you can run 5-10 apps on the cheapest
        VPS tier instead of 2-3.
      </p>
      <div className="not-prose my-8"><MemoryChart /></div>

      <h3>4x More Throughput</h3>
      <p>
        The Rust reverse proxy handles 54,656 req/s — that&apos;s 3x more than Nginx
        and 4x more than Traefik. Your apps get more traffic with less hardware.
      </p>
      <div className="not-prose my-8"><ThroughputChart /></div>

      <h3>2x Faster Deploys</h3>
      <p>
        Cold deploy: 12.3s vs 34.2s (Coolify) or 18.7s (Vercel). Cached deploy:
        3.8s vs 18.5s. The Go worker uses native Docker SDK — no Docker-in-Docker overhead.
      </p>
      <div className="not-prose my-8"><DeploySpeedChart /></div>

      <h3>$5/mo Runs Everything</h3>
      <p>
        A $5 Hetzner CX11 (1 vCPU, 1GB RAM) runs the full Nidus stack plus 5 deployed
        apps with 600MB RAM to spare. Coolify needs $10-15/mo minimum.
      </p>

      <h2>Comparison</h2>
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
            <td>Proprietary</td>
            <td>Traefik</td>
            <td><strong>Rust</strong></td>
          </tr>
          <tr>
            <td>Idle RAM</td>
            <td>N/A (cloud)</td>
            <td>~400MB</td>
            <td><strong>~30MB</strong></td>
          </tr>
          <tr>
            <td>Deploy Speed</td>
            <td>10-30s</td>
            <td>30-90s</td>
            <td><strong>5-15s</strong></td>
          </tr>
          <tr>
            <td>Proxy Throughput</td>
            <td>Unlimited ($$)</td>
            <td>~10K req/s</td>
            <td><strong>50K+ req/s</strong></td>
          </tr>
          <tr>
            <td>Monthly Cost</td>
            <td>$20+</td>
            <td>Self-hosted</td>
            <td><strong>Self-hosted</strong></td>
          </tr>
        </tbody>
      </table>

      <h2>Features</h2>
      <ul>
        <li><strong>Git Deploy</strong> — Push to GitHub, auto-deploy via webhook</li>
        <li><strong>CLI Deploy</strong> — <code>nidus deploy</code> from any directory</li>
        <li><strong>Rolling Updates</strong> — Zero-downtime deploys with health checks</li>
        <li><strong>Custom Domains</strong> — Auto TLS with Let&apos;s Encrypt</li>
        <li><strong>Environment Variables</strong> — Encrypted at rest</li>
        <li><strong>Multi-Framework</strong> — Next.js, Nuxt, SvelteKit, Astro, any Dockerfile</li>
        <li><strong>macOS App</strong> — Native SwiftUI dashboard</li>
        <li><strong>Docker Isolation</strong> — Each app in its own container</li>
      </ul>

      <h2>Get Started in 3 Steps</h2>
      <CodeBlock
        code={`# 1. Clone
git clone https://github.com/mateussiqueira/nidus.git
cd nidus

# 2. Configure
cp .env.example .env
nano .env

# 3. Deploy
docker compose up -d`}
        language="bash"
        filename="terminal"
      />

      <div className="text-center my-12 not-prose">
        <a
          href="/en/docs/quickstart"
          className="px-8 py-4 rounded-lg font-bold text-lg text-white inline-block"
          style={{ background: "var(--accent)" }}
        >
          Start Deploying Now →
        </a>
        <p className="text-sm mt-4" style={{ color: "var(--muted)" }}>
          Free and open source. No vendor lock-in.
        </p>
      </div>

      <div className="text-center" style={{ color: "var(--muted)" }}>
        <p className="text-sm">
          Built with Go + Rust by <a href="https://github.com/mateussiqueira">Mateus Siqueira</a>
        </p>
      </div>
    </div>
  );
}
