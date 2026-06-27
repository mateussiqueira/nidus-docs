import CodeBlock from "@/components/CodeBlock";

export default function QuickStartPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>
      </div>

      <h1>Quick Start</h1>
      <p>
        Get Nidus running on your machine in under 5 minutes. One binary, one config file, done.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>A Linux VPS (2 vCPU, 1GB RAM minimum — <strong>512MB works</strong> with Go/Rust stack)</li>
        <li>Docker 24+ and Docker Compose v2</li>
        <li>Git</li>
        <li>A domain or IP address</li>
      </ul>

      <h2>Installation</h2>

      <h3>Option A: Docker Compose (Recommended)</h3>
      <CodeBlock
        code={`# Clone and configure
git clone https://github.com/mateussiqueira/nidus.git
cd nidus
cp .env.example .env

# Edit .env with your settings
nano .env

# Start all services
docker compose up -d

# Verify
curl http://localhost:3001/health
# {"status":"ok","version":"1.0.0","uptime":"2s"}`}
        language="bash"
        filename="terminal"
      />

      <h3>Option B: Binary Install (Minimal Resources)</h3>
      <p>
        For VPS with limited RAM (&lt;512MB), install the binaries directly:
      </p>
      <CodeBlock
        code={`# Download latest release
curl -sL https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-linux-amd64.tar.gz | tar xz

# Install binaries
sudo mv nidus-server /usr/local/bin/
sudo mv nidus-proxy /usr/local/bin/
sudo mv nidus-worker /usr/local/bin/

# Run
nidus-server --config /etc/nidus/config.toml &
nidus-proxy --config /etc/nidus/proxy.toml &
nidus-worker --config /etc/nidus/worker.toml &`}
        language="bash"
        filename="terminal"
      />

      <h3>Option C: One-Line Install</h3>
      <CodeBlock
        code={`curl -fsSL https://get.nidus.dev | sh`}
        language="bash"
        filename="terminal"
      />

      <h2>Configuration</h2>
      <p>Create <code>/etc/nidus/config.toml</code>:</p>
      <CodeBlock
        code={`[server]
port = 3001
host = "0.0.0.0"

[auth]
jwt_secret = "change-me-in-production"
session_ttl = "24h"

[database]
driver = "sqlite"
path = "/var/lib/nidus/data.db"

[redis]
url = "redis://localhost:6379"

[proxy]
port = 3080
rate_limit = 1000  # req/s per IP
tls_enabled = false

[worker]
concurrency = 4    # goroutines (max: NumCPU * 2)
build_timeout = "10m"
max_image_size = "2GB"

[deploy]
strategy = "rolling"
health_check_timeout = "30s"`}
        language="toml"
        filename="config.toml"
      />

      <h2>Services Overview</h2>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Binary</th>
            <th>Port</th>
            <th>RAM Usage</th>
            <th>Language</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Control Plane</td>
            <td><code>nidus-server</code></td>
            <td>3001</td>
            <td>~15MB idle</td>
            <td>Go</td>
          </tr>
          <tr>
            <td>Data Plane</td>
            <td><code>nidus-proxy</code></td>
            <td>3080</td>
            <td>~8MB idle</td>
            <td>Rust</td>
          </tr>
          <tr>
            <td>Deploy Worker</td>
            <td><code>nidus-worker</code></td>
            <td>—</td>
            <td>~12MB idle</td>
            <td>Go</td>
          </tr>
          <tr>
            <td>Dashboard</td>
            <td>Next.js</td>
            <td>3000</td>
            <td>~50MB</td>
            <td>TypeScript</td>
          </tr>
        </tbody>
      </table>

      <h2>First Deploy</h2>
      <CodeBlock
        code={`# Install CLI
npm install -g nidus-cli

# Login
nidus login --url http://your-server:3001

# Deploy current directory
cd my-nextjs-app
nidus deploy

# Done! Your app is live at:
# http://your-server:3080/<project-slug>`}
        language="bash"
        filename="terminal"
      />

      <h2>Verify Everything Works</h2>
      <CodeBlock
        code={`# Health check
curl http://localhost:3001/health

# List projects
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/projects

# Check proxy is routing
curl -I http://localhost:3080/<project-slug>
# HTTP/1.1 200 OK
# X-Nidus-Upstream: http://172.17.0.2:3000
# X-Nidus-Latency: 2ms`}
        language="bash"
        filename="terminal"
      />

      <blockquote>
        <strong>Pro tip:</strong> The Rust proxy adds only ~2ms latency per request.
        Compare that to Nginx (~5ms) or Traefik (~8ms). On a $5 VPS, you&apos;ll handle
        50K+ concurrent connections without breaking a sweat.
      </blockquote>

      <h2>Next Steps</h2>
      <ul>
        <li><a href="/en/docs/architecture">Architecture</a> — Understand how Go + Rust work together</li>
        <li><a href="/en/docs/deployment">Deployment</a> — GitHub webhooks, CLI deploys, Docker builds</li>
        <li><a href="/en/docs/performance">Performance</a> — Benchmarks and optimization tips</li>
        <li><a href="/en/docs/security">Security</a> — Production hardening guide</li>
      </ul>
    </div>
  );
}
