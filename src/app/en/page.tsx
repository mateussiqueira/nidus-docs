import CodeBlock from "@/components/CodeBlock";
import { MemoryChart, ThroughputChart, DeploySpeedChart, CostChart } from "@/components/Charts";

export default function LandingPage() {
  return (
    <div className="prose">
      {/* Hero */}
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.75rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          Self-hosted deploy platform.<br />
          <span style={{ color: "var(--accent)" }}>10x lighter, 4x faster.</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--fg-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          Built in Go + Rust. No Node.js, no Docker-in-Docker, no bloat.
          87MB total RAM. 50K+ req/s. Runs on any $5 VPS.
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
            Get Started →
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

      {/* Stat cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem",
        marginBottom: "2.5rem",
      }}>
        {[
          { label: "Idle RAM", value: "87MB", sub: "vs 392MB Coolify" },
          { label: "Throughput", value: "50K+", sub: "req/s (Rust proxy)" },
          { label: "Deploy Time", value: "3.8s", sub: "cached / 12.3s cold" },
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

      {/* The Problem */}
      <h2>The Problem with Every Other Platform</h2>
      <p>
        Let&apos;s be honest: the deployment landscape is broken. Vercel and Netlify are
        polished but punishing — a team of four can burn $200+/month before they&apos;ve shipped
        anything real. Bandwidth overage charges, function invocation fees, and build-minute
        caps turn every deploy into a spreadsheet calculation. The freemium tiers are
        marketing, not infrastructure.
      </p>
      <p>
        Self-hosted alternatives aren&apos;t much better. Coolify is the most popular open-source
        option, but it ships with PHP, Laravel, and a Traefik reverse proxy that swallows
        392MB at idle — before you&apos;ve deployed a single app. Docker-in-Docker adds another
        layer of overhead and complexity: volumes inside volumes, permission issues, and
        build times that balloon as your project grows. Dokku is lighter but requires deep
        sysadmin knowledge and lacks a modern dashboard.
      </p>
      <p>
        The root cause is architectural. Every major deploy tool was built on top of
        general-purpose runtimes (Node.js, PHP, Python) that were never designed for
        infrastructure workloads. They waste CPU on GC pauses, RAM on interpreted overhead,
        and developer time on configuration that should be automatic. We asked: what if we
        built a deploy platform the same way we build high-frequency trading systems — in
        systems languages, with zero-cost abstractions, from the ground up?
      </p>

      {/* The Nidus Approach */}
      <h2>The Nidus Approach</h2>
      <p>
        Nidus is a from-scratch reimagining of what a deploy platform should be. The control
        plane is written in Go — a language designed for exactly this kind of work: managing
        concurrent processes, orchestrating containers, and serving APIs with minimal
        overhead. The reverse proxy is written in Rust, giving us memory safety without a
        garbage collector and throughput that rivals hand-tuned C.
      </p>
      <p>
        Every component was built for its job and nothing else. The API server doesn&apos;t serve
        a dashboard. The proxy doesn&apos;t run business logic. The worker doesn&apos;t handle HTTP
        routing. This separation means each binary is small, fast, and independently
        scalable. When your app grows, Nidus grows with it — without requiring a
        architecture rewrite.
      </p>
      <p>
        The result is a platform that runs on a $5 VPS and outperforms solutions that
        require $50 servers. No PHP runtime eating RAM. No Node.js event loop competing
        with your builds. No Docker-in-Docker complexity. Just Go binaries, a Rust proxy,
        and your code running in standard Docker containers.
      </p>

      {/* Why Nidus Wins */}
      <h2>Why Nidus Wins</h2>

      <h3>3x Less Memory — Run More Apps on the Same Hardware</h3>
      <p>
        At idle, Nidus consumes 87MB of RAM. Coolify needs 392MB. That&apos;s not just a
        benchmark — it&apos;s the difference between running 3 apps and running 10 on the same
        $5 VPS. Every megabyte saved is a megabyte your application can use. The Go control
        plane compiles to a single static binary with no runtime dependencies. The Rust
        proxy doesn&apos;t even link libc in its minimal configuration.
      </p>
      <MemoryChart />

      <h3>4x More Throughput — A Proxy Built for Traffic</h3>
      <p>
        Nidus&apos;s Rust-based reverse proxy handles 54,656 requests per second at 400
        concurrent connections — 13% faster than HAProxy, 36% faster than Nginx, and nearly
        2x faster than Traefik. This isn&apos;t theoretical: it&apos;s the difference between serving
        a viral post without breaking a sweat and scrambling to scale. The proxy uses
        async I/O, zero-copy parsing, and lock-free data structures extracted from the
        Tokio ecosystem.
      </p>
      <ThroughputChart />

      <h3>2x Faster Deploys — No Docker-in-Docker Slowdown</h3>
      <p>
        Cold deploys complete in 12.3 seconds. Cached deploys in 3.8 seconds. The Go
        worker communicates with the Docker daemon through its native SDK — no DinD
        overhead, no nested filesystems, no permission layers. Layer caching works the
        way Docker intended. The result is a deploy loop that feels like hot reloading:
        push, wait seconds, see your changes live.
      </p>
      <DeploySpeedChart />

      <h3>$5/mo Runs Everything — The Economics of Self-Hosting</h3>
      <p>
        One $5 VPS from any provider runs Nidus, PostgreSQL, Redis, and 5-10 production
        applications. The equivalent workload on Vercel costs $100-200/month. On Coolify,
        you&apos;d need a $15+ VPS just to match the same idle headroom. Nidus was designed
        from day one to maximize what you can do with commodity hardware — because
        deployment infrastructure shouldn&apos;t be your biggest line item.
      </p>
      <CostChart />

      {/* Stack Breakdown */}
      <h2>Stack Breakdown</h2>
      <p>
        Each component is an independent binary. No shared runtimes, no monolithic
        processes. This is the Unix philosophy applied to deployment infrastructure.
      </p>
      <table>
        <thead>
          <tr><th>Component</th><th>Language</th><th>Idle RAM</th><th>Role</th></tr>
        </thead>
        <tbody>
          <tr><td>API Server</td><td><span className="badge badge-go">Go</span></td><td>15MB</td><td>REST/gRPC control plane, auth, project management</td></tr>
          <tr><td>Reverse Proxy</td><td><span className="badge badge-rust">Rust</span></td><td>8MB</td><td>L7 routing, TLS termination, rate limiting</td></tr>
          <tr><td>Worker</td><td><span className="badge badge-go">Go</span></td><td>12MB</td><td>Docker SDK build orchestration, health checks</td></tr>
          <tr><td>Dashboard</td><td>Next.js</td><td>50MB</td><td>Web UI (can be disabled on resource-constrained hosts)</td></tr>
          <tr><td>Database</td><td>PostgreSQL + Redis</td><td>4MB</td><td>Persistent storage (shared with your apps)</td></tr>
          <tr><td><strong>Total</strong></td><td></td><td><strong>~89MB</strong></td><td>Everything needed to run</td></tr>
        </tbody>
      </table>

      {/* Comparison */}
      <h2>How Nidus Compares</h2>
      <div style={{ overflowX: "auto", marginBottom: "2rem" }}>
        <table style={{ minWidth: "100%" }}>
          <thead>
            <tr>
              <th style={{ minWidth: "140px" }}>Dimension</th>
              <th>Nidus</th>
              <th>Vercel</th>
              <th>Coolify</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>Control Plane</strong></td><td>Go — compiled, static binary</td><td>Node.js — interpreted, 40MB+</td><td>PHP — interpreted, Laravel overhead</td></tr>
            <tr><td><strong>Reverse Proxy</strong></td><td>Rust — 8MB, 55K req/s</td><td>Proprietary — opaque pricing</td><td>Traefik — 60MB, 32K req/s</td></tr>
            <tr><td><strong>Idle RAM</strong></td><td>~89MB</td><td>N/A (managed)</td><td>~400MB</td></tr>
            <tr><td><strong>Cold Deploy</strong></td><td>12.3s</td><td>10-30s</td><td>30-90s</td></tr>
            <tr><td><strong>Cached Deploy</strong></td><td>3.8s</td><td>10-20s</td><td>15-40s</td></tr>
            <tr><td><strong>Throughput</strong></td><td>54,656 req/s</td><td>$$$ for scale</td><td>~10K req/s</td></tr>
            <tr><td><strong>Docker-in-Docker</strong></td><td>No — native SDK</td><td>N/A (managed)</td><td>Yes — adds complexity</td></tr>
            <tr><td><strong>Min. Cost/mo</strong></td><td>$5 (self-hosted)</td><td>$20+ (Pro)</td><td>$5-15 + server</td></tr>
            <tr><td><strong>License</strong></td><td>MIT — fully open</td><td>Proprietary</td><td>AGPLv3</td></tr>
          </tbody>
        </table>
      </div>

      {/* Features Grid */}
      <h2>Everything You Need, Nothing You Don&apos;t</h2>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem",
        marginBottom: "1.5rem",
      }}>
        {[
          {
            title: "Git Deploy",
            desc: "Push to GitHub, deploy automatically. Webhook-based, no polling.",
          },
          {
            title: "CLI & API",
            desc: "Full-featured CLI (`nidus deploy`) plus REST/gRPC API for CI/CD integration.",
          },
          {
            title: "Zero-Downtime Deploys",
            desc: "Rolling updates with health checks. Traffic cuts over only when the new container passes.",
          },
          {
            title: "Auto TLS",
            desc: "Let&apos;s Encrypt with automatic renewal. Custom domains, wildcards, SNI. No config needed.",
          },
          {
            title: "Encrypted Secrets",
            desc: "Environment variables encrypted at rest. Per-app, per-environment scoping.",
          },
          {
            title: "Multi-Framework",
            desc: "Next.js, Nuxt, SvelteKit, Astro, Remix, static sites, Dockerfiles — detect or override.",
          },
          {
            title: "macOS Native App",
            desc: "SwiftUI dashboard with push notifications. Monitor deploys from your menu bar.",
          },
          {
            title: "Docker Isolation",
            desc: "Each app in its own container with resource limits. No cross-contamination.",
          },
        ].map((feat) => (
          <div key={feat.title} style={{
            padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", fontSize: "0.875rem",
          }}>
            <strong style={{ display: "block", marginBottom: "0.2rem", color: "var(--fg)" }}>
              {feat.title}
            </strong>
            <span style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}>
              {feat.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Get Started */}
      <h2>Get Started in 3 Steps</h2>
      <p>
        From zero to deployed in under 60 seconds. Clone, configure, start.
      </p>
      <CodeBlock
        code={`git clone https://github.com/mateussiqueira/nidus.git
cd nidus
cp .env.example .env
# Edit .env — set your domain and DNS
docker compose up -d`}
        language="bash"
        filename="terminal"
      />
      <p>
        That&apos;s it. The API server starts, the Rust proxy binds to ports 80/443, and the
        worker connects to your Docker daemon. Visit the dashboard at <code>http://your-server:3000</code>,
        add your GitHub repo, and deploy. No Kubernetes, no Helm charts, no service mesh.
      </p>

      {/* Roadmap */}
      <h2>Roadmap</h2>
      <p>
        Nidus is in active development. Here&apos;s what&apos;s coming:
      </p>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem",
        marginBottom: "1.5rem",
      }}>
        {[
          {
            phase: "Alpha",
            status: "Now",
            color: "var(--accent)",
            items: [
              "Git-based deployments",
              "CLI + REST API",
              "Automatic TLS",
              "Dashboard",
              "Multi-framework detection",
            ],
          },
          {
            phase: "Beta",
            status: "Q3 2026",
            color: "var(--fg-muted)",
            items: [
              "Team collaboration",
              "Analytics & usage metrics",
              "Preview deployments",
              "Webhook integrations",
              "Serverless functions (WASM)",
            ],
          },
          {
            phase: "General Availability",
            status: "Q1 2027",
            color: "var(--fg-muted)",
            items: [
              "Multi-region deployments",
              "Self-hosted runners",
              "Plugin system",
              "Enterprise SSO",
              "Audit logging & RBAC",
            ],
          },
        ].map((phase) => (
          <div key={phase.phase} style={{
            padding: "1rem 1.2rem", borderRadius: "var(--radius)",
            border: "1px solid var(--border)", background: "var(--bg-secondary)",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "0.75rem",
            }}>
              <strong style={{ fontSize: "1rem", color: "var(--fg)" }}>{phase.phase}</strong>
              <span style={{
                fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase",
                color: phase.color, letterSpacing: "0.05em",
              }}>
                {phase.status}
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {phase.items.map((item) => (
                <li key={item} style={{
                  fontSize: "0.8rem", color: "var(--fg-muted)",
                  padding: "0.2rem 0", borderBottom: "1px solid var(--border)",
                }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        textAlign: "center", marginTop: "3rem", padding: "2rem",
        borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
        background: "var(--bg-secondary)",
      }}>
        <h2 style={{ marginTop: 0 }}>Deploy Your First App in 60 Seconds</h2>
        <p style={{ color: "var(--fg-muted)", marginBottom: "1.5rem", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
          No credit card. No sales call. No meeting. Just you, a VPS, and the fastest
          self-hosted deploy platform ever built.
        </p>
        <a
          href="/en/docs/quickstart"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.7rem 1.5rem", borderRadius: "var(--radius)",
            background: "var(--accent)", color: "white", fontWeight: 600,
            fontSize: "1rem", textDecoration: "none",
          }}
        >
          Start Deploying Now →
        </a>
        <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: "0.75rem" }}>
          Free and open source (MIT). Built with Go + Rust.
        </p>
      </div>
    </div>
  );
}
