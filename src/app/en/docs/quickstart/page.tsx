import CodeBlock from "@/components/CodeBlock";

export default function QuickStartPage() {
  return (
    <div className="prose">
      <h1>Quick Start</h1>

      <p>
        Nidus is a self-hosted platform that turns any Linux VPS into a full-featured
        application deployment engine. Think Heroku or Railway, but running on your own
        infrastructure — no egress fees, no vendor lock-in, no opaque pricing tiers.
      </p>

      <p>
        The control plane is written in Go: a single static binary that handles
        authentication, project management, build orchestration, and the API layer.
        The data plane is written in Rust: an HTTP reverse proxy that terminates TLS,
        routes requests, and enforces rate limits with single-digit-microsecond overhead.
        A TypeScript dashboard provides the management UI on port 3000, and a worker
        process in Go executes container builds as isolated jobs.
      </p>

      <p>
        The result is a deploy platform that idles at under 100 MB of RAM with all
        services running. On a $6 VPS you can host dozens of applications, each with
        its own domain, SSL certificate, and isolated build environment.
      </p>

      <h2>Prerequisites</h2>

      <ul>
        <li>
          <strong>A Linux VPS.</strong> Any provider works — Hetzner, DigitalOcean,
          Linode, or a bare-metal server in your closet. 2 vCPU and 2 GB RAM is
          comfortable for production; 1 GB is fine for evaluation. x86_64 or arm64.
        </li>
        <li>
          <strong>Docker 24+ and Docker Compose v2.</strong> The platform itself runs in
          containers, and every application build happens inside ephemeral Docker build
          containers. Install with the official script if you haven't already:&nbsp;
          <code>curl -fsSL https://get.docker.com | sh</code>.
        </li>
        <li>
          <strong>Git.</strong> Nidus integrates with Git repositories for deployment
          triggers. You'll push code, and Nidus will build and deploy it.
        </li>
        <li>
          <strong>A domain or subdomain.</strong> You can use an IP address for testing,
          but production use requires DNS. We'll set up automatic SSL via Let's Encrypt
          in the configuration step.
        </li>
        <li>
          <strong>Ports 80, 443, and 3000-3002 open</strong> in your firewall. The proxy
          binds 80/443 for public traffic; the API and dashboard sit on 3001 and 3000
          respectively.
        </li>
      </ul>

      <h2>Step 1: Clone and Configure</h2>

      <p>
        SSH into your VPS and clone the repository. The repository contains the Docker
        Compose file, default configuration, and initialization scripts. Do this as a
        non-root user with Docker access (typically your sudo user).
      </p>

      <CodeBlock
        code={`git clone https://github.com/mateussiqueira/nidus.git
cd nidus
cp .env.example .env`}
        language="bash"
        filename="terminal"
      />

      <p>
        Open <code>.env</code> in your editor and review the variables. Here is what
        matters:
      </p>

      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>What it controls</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>NIDUS_DOMAIN</code></td>
            <td>Your root domain, e.g. <code>nidus.example.com</code>. The dashboard
            lives at this domain and each app gets a <code>&lt;slug&gt;.nidus.example.com</code>
            subdomain by default.</td>
          </tr>
          <tr>
            <td><code>NIDUS_JWT_SECRET</code></td>
            <td>Generate a strong random secret: <code>openssl rand -base64 48</code>.
            This signs session tokens and API keys. Keep it secret, keep it safe.</td>
          </tr>
          <tr>
            <td><code>NIDUS_ACME_EMAIL</code></td>
            <td>Email for Let's Encrypt certificate registration. Required for
            automatic TLS on the proxy layer.</td>
          </tr>
          <tr>
            <td><code>NIDUS_STORAGE_PATH</code></td>
            <td>Where Nidus stores build caches, SQLite database, and application
            artifacts. Defaults to <code>/var/lib/nidus</code>. Ensure the parent
            directory has at least 10 GB free.</td>
          </tr>
          <tr>
            <td><code>NIDUS_WORKER_CONCURRENCY</code></td>
            <td>Number of simultaneous builds. Set to your vCPU count. Each build
            gets one dedicated core. On a 2 vCPU machine, leave this at 1 so your
            applications always have headroom.</td>
          </tr>
        </tbody>
      </table>

      <p>
        If you are testing without a domain, set <code>NIDUS_DOMAIN</code> to your
        VPS IP address and <code>NIDUS_TLS_ENABLED=false</code>. You will access the
        dashboard over HTTP on port 3000.
      </p>

      <h2>Step 2: Start the Services</h2>

      <p>
        With the environment variables in place, start the stack. The first run pulls
        four container images and initializes the SQLite database. This takes about 30
        seconds on a reasonably fast connection.
      </p>

      <CodeBlock
        code={`docker compose up -d

[+] Running 5/5
 ✔ Network nidus_default   Created
 ✔ Volume nidus_data       Created
 ✔ Container nidus-server  Started
 ✔ Container nidus-proxy   Started
 ✔ Container nidus-worker  Started`}
        language="bash"
        filename="terminal"
      />

      <p>
        The dashboard is a separate Next.js application that you deploy <em>through</em>
        Nidus itself — dogfooding the platform. To bootstrap it, run the included
        setup command:
      </p>

      <CodeBlock
        code={`docker compose exec server nidusctl bootstrap-dashboard

✔ Dashboard source cloned
✔ Build queued (build_01j6abc...)
✔ Dashboard deployed to nidus.example.com
✔ Admin credentials written to ./admin-creds.txt

  URL:      https://nidus.example.com
  Email:    admin@nidus.example.com
  Password: (see admin-creds.txt)`}
        language="bash"
        filename="terminal"
      />

      <p>
        This command clones the dashboard repository, queues a build on the worker,
        and — once the build completes — registers it as the first project on your
        Nidus instance. The dashboard is now a deployed application running on the
        same platform it manages. If you prefer, you can skip the dashboard entirely
        and use the REST API and CLI exclusively.
      </p>

      <h2>Step 3: Verify It Is Running</h2>

      <p>
        The control plane exposes a health endpoint at <code>/health</code>. It returns
        the server version, uptime, and a dependency status check. This is the first
        thing you should curl after starting the stack.
      </p>

      <CodeBlock
        code={`curl -s http://localhost:3001/health | jq .

{
  "status": "ok",
  "version": "1.0.0",
  "uptime": "47s",
  "components": {
    "database": "connected",
    "redis": "connected",
    "worker_pool": "3/3 available"
  }
}`}
        language="bash"
        filename="terminal"
      />

      <p>
        If the database or worker pool shows anything other than a healthy status,
        check the logs: <code>docker compose logs server</code>. The most common
        issue on first boot is a missing volume mount for the data directory — verify
        that <code>NIDUS_STORAGE_PATH</code> exists and is writable by the container
        user (UID 1000).
      </p>

      <p>
        Next, confirm the proxy is accepting connections. The proxy lives on port 80
        (and 443 if TLS is enabled). A request to the root should return a 404 with
        a <code>X-Nidus-Proxy</code> header — that is the Rust proxy announcing itself:
      </p>

      <CodeBlock
        code={`curl -sI http://localhost:80

HTTP/1.1 404 Not Found
content-type: text/plain
x-nidus-proxy: nidus-proxy/1.0.0
x-nidus-latency: 0µs
date: Sat, 27 Jun 2026 14:02:31 GMT

# A 404 is correct — there are no routes registered yet.
# Once you deploy an app, this endpoint returns 200.`}
        language="bash"
        filename="terminal"
      />

      <blockquote>
        <strong>Latency note:</strong> The <code>x-nidus-latency</code> header reports
        the time the proxy spent processing the request — typically under 50
        microseconds for a routing decision. The Rust data plane uses
        <code>tokio</code> with a shared-nothing architecture: each worker thread
        maintains its own connection pool and routing table, so there is no shared
        state to contend on. This is why a $6 VPS can terminate 50,000 concurrent
        connections without breaking a sweat.
      </blockquote>

      <h2>Step 4: Deploy Your First Application</h2>

      <p>
        With the platform running, install the Nidus CLI on your development machine.
        The CLI is a single Node.js package that communicates with the server API.
        It handles project creation, build uploads, log streaming, and rollbacks.
      </p>

      <CodeBlock
        code={`npm install -g nidus-cli

# Authenticate with your server
nidus login --url https://nidus.example.com --token <your-admin-token>`}
        language="bash"
        filename="terminal"
      />

      <p>
        You can find your admin token in <code>admin-creds.txt</code> (created during
        the bootstrap step) or generate a new one from the dashboard under
        <em>Settings &gt; API Tokens</em>. The CLI stores the token in
        <code>~/.config/nidus/credentials.json</code>.
      </p>

      <p>
        Now deploy something. Any project with a <code>Dockerfile</code> or a
        <code>nidus.json</code> configuration file works. Here is an example using a
        simple Express application:
      </p>

      <CodeBlock
        code={`mkdir hello-nidus && cd hello-nidus

cat > package.json << 'EOF'
{
  "name": "hello-nidus",
  "scripts": { "start": "node server.js" },
  "dependencies": { "express": "^4" }
}
EOF

cat > server.js << 'EOF'
const express = require("express");
const app = express();
app.get("/", (req, res) => res.json({ app: "hello-nidus", host: req.hostname }));
app.listen(process.env.PORT || 3000);
EOF

cat > Dockerfile << 'EOF'
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
EOF

# Deploy
nidus deploy --name hello-nidus

✔ Project created (proj_01j6def...)
✔ Build started (build_01j6deg...)
  Building Docker image... done (14.2s)
✔ Health check passed (200 OK in 1.2s)
✔ Route registered at hello-nidus.nidus.example.com

  Deploy URL: https://hello-nidus.nidus.example.com
  Container:  nidus-app-hello-nidus-1 (32MB RSS)`}
        language="bash"
        filename="terminal"
      />

      <p>
        Within seconds, your application is live. The worker pulled the repository,
        built the Docker image, ran a health check against the container, and
        registered the route in the Rust proxy — all before the CLI returned control
        to you. The proxy now routes all requests to <code>hello-nidus.nidus.example.com</code>
        to your container, with automatic TLS termination and rate limiting applied.
      </p>

      <h2>Verifying the Deployment End-to-End</h2>

      <p>
        From outside your VPS, hit the deployed application. The proxy adds headers
        that let you trace the exact request path:
      </p>

      <CodeBlock
        code={`curl -s https://hello-nidus.nidus.example.com | jq .
{
  "app": "hello-nidus",
  "host": "hello-nidus.nidus.example.com"
}

curl -sI https://hello-nidus.nidus.example.com | grep -i x-nidus
x-nidus-proxy: nidus-proxy/1.0.0
x-nidus-upstream: http://172.17.0.5:3000
x-nidus-latency: 312µs
x-nitus-request-id: req_01j6deh...

# The upstream header shows which container handled the request.
# The latency header shows the proxy overhead: 312 microseconds.`}
        language="bash"
        filename="terminal"
      />

      <p>
        Each request generates a unique <code>x-nidus-request-id</code>. You can use
        this to correlate logs across the control plane, proxy, and application
        container — essential for debugging production issues:
      </p>

      <CodeBlock
        code={`nidus logs --request-id req_01j6deh...

[proxy]  2026-06-27 14:03:12  req_01j6deh...  → hello-nidus.nidus.example.com/
[server] 2026-06-27 14:03:12  req_01j6deh...  upstream=172.17.0.5:3000 latency=312µs
[app]    2026-06-27 14:03:12  req_01j6deh...  GET / 200 4ms`}
        language="bash"
        filename="terminal"
      />

      <h2>Troubleshooting Common Issues</h2>

      <dl>
        <dt><strong>Docker socket not accessible</strong></dt>
        <dd>
          The worker container needs access to the Docker daemon to build images. If
          builds fail with a permission error, verify that your non-root user is in
          the <code>docker</code> group (<code>sudo usermod -aG docker $USER</code>)
          and that you have logged out and back in. On some distributions, the Docker
          socket lives at <code>/run/docker.sock</code> — the Compose file bind-mounts
          it automatically.
        </dd>

        <dt><strong>Port already in use</strong></dt>
        <dd>
          If port 80 or 443 is occupied (often by Apache, Nginx, or a systemd service),
          either stop the conflicting service or change the proxy ports in
          <code>.env</code>. Set <code>NIDUS_HTTP_PORT=8080</code> and test with a
          non-privileged port first.
        </dd>

        <dt><strong>Build times out</strong></dt>
        <dd>
          The default build timeout is 10 minutes. Large applications or VPS instances
          with limited CPU may exceed this. Increase <code>NIDUS_BUILD_TIMEOUT</code>
          in <code>.env</code> to <code>20m</code> or higher. You can also use the
          Nidus cache layer to skip dependency installation on subsequent builds — see
          the <a href="/en/docs/deployment#caching">deployment guide</a> for details.
        </dd>

        <dt><strong>Let's Encrypt rate limit</strong></dt>
        <dd>
          Creating and tearing down applications rapidly can hit the Let's Encrypt
          certificate-per-domain rate limit (50 per week). For development and testing,
          disable TLS with <code>NIDUS_TLS_ENABLED=false</code> and use HTTP. Re-enable
          it when you go to production.
        </dd>
      </dl>

      <h2>Next Steps</h2>

      <p>
        You now have a working Nidus deployment. Here is where to go from here:
      </p>

      <ul>
        <li>
          <a href="/en/docs/architecture"><strong>Architecture</strong></a> —
          Deep dive into how the Go control plane and Rust data plane communicate,
          how routing decisions are made, and how the worker pool schedules builds.
          Includes a detailed explanation of the event-driven build pipeline and the
          shared-nothing proxy design.
        </li>
        <li>
          <a href="/en/docs/deployment"><strong>Deployment Guide</strong></a> —
          Configure GitHub webhooks for automatic deploys on push, set up environment
          variables per project, attach persistent volumes, and configure custom
          domains with automatic SSL. Also covers blue-green deployments and manual
          rollbacks.
        </li>
        <li>
          <a href="/en/docs/cli"><strong>CLI Reference</strong></a> —
          Full documentation for <code>nidus</code>, including project management,
          log streaming with <code>nidus logs --follow</code>, secret management,
          and the <code>nidus rollback</code> command.
        </li>
        <li>
          <a href="/en/docs/configuration"><strong>Configuration</strong></a> —
          Every environment variable and configuration file option documented with
          defaults, valid values, and usage examples.
        </li>
        <li>
          <a href="/en/docs/security"><strong>Security</strong></a> —
          Production hardening: firewall rules, fail2ban configuration, database
          encryption at rest, and setting up a WAF in front of the proxy.
        </li>
      </ul>

      <blockquote>
        <strong>Production tip:</strong> Before putting Nidus in front of real traffic,
        run through the security checklist in <code>docs/security.md</code>. At
        minimum: change the default JWT secret, enable TLS, set up firewall rules
        that restrict port 3001 to internal networks only, and configure regular
        database backups via the included <code>nidusctl backup</code> command.
        With those four steps, your platform is ready for production workloads.
      </blockquote>
    </div>
  );
}
