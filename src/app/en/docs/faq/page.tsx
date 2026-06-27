import CodeBlock from "@/components/CodeBlock";

export default function FAQPage() {
  return (
    <div className="prose">
      <h1>FAQ &amp; Troubleshooting</h1>
      <p>
        Real answers to real questions from the Nidus community. If you don't
        find what you need here, open an issue on GitHub or join the Discord.
      </p>

      <h2>General</h2>

      <h3>What exactly is Nidus?</h3>
      <p>
        Nidus is a self-hosted application deployment platform written in Go
        and Rust. It gives you the developer experience of Vercel or Netlify
        — automatic deploys from Git, preview branches, instant rollbacks,
        custom domains with TLS — but runs on your own infrastructure. You
        own the data, you control the costs, and there is no per-seat pricing
        or vendor lock-in.
      </p>
      <p>
        The platform has three components: a Go API server that manages
        projects and orchestrates deploys, a Rust reverse proxy that handles
        all incoming traffic with sub-millisecond overhead, and a Go worker
        that builds Docker images and manages containers. Everything
        communicates over gRPC with structured logging built in.
      </p>

      <h3>Why Go and Rust instead of Node.js or PHP?</h3>
      <p>
        The short answer is efficiency. The Go server and worker use roughly
        15MB RAM each at idle. The Rust proxy handles 50,000 requests per
        second on a $5 VPS while consuming ~12MB RAM. An equivalent Node.js
        stack (like Coolify's Laravel + Traefik) uses 300-400MB before you
        even deploy an application. That extra overhead means you need a
        more expensive VPS or you run fewer apps.
      </p>
      <p>
        There is also a operational simplicity argument: Go and Rust compile
        to single static binaries. There is no runtime to install, no PHP
        interpreter, no npm dependencies. You drop the binary on a server
        and it runs. This matters when you are managing infrastructure at
        2 AM.
      </p>

      <h3>Is Nidus production-ready?</h3>
      <p>
        Yes. The core components have been running in production since early
        2025. The Rust proxy has passed 100K concurrent connection load tests
        without dropping a single request. All services implement graceful
        shutdown, health checks, and automatic restart via systemd or
        Docker restart policies.
      </p>
      <p>
        That said, Nidus is still relatively young compared to Coolify or
        Vercel. The features that exist are rock-solid, but the feature set
        is smaller. You get automated deploys, custom domains, TLS, env
        management, and rollbacks. You do not get built-in analytics,
        A/B testing, or edge functions yet.
      </p>

      <h3>How does Nidus compare to Coolify?</h3>
      <p>
        Coolify is an excellent project with a larger feature set, but it
        comes at a cost in resource usage. On the same $5 Hetzner CX11 VPS
        (1 vCPU, 1GB RAM), Nidus runs the full stack plus 5 applications
        with 600MB free RAM. Coolify uses 342MB for its own services before
        any applications are deployed, and the third application deployment
        triggers an OOM kill.
      </p>
      <p>
        Performance differences come down to the tech stack. Coolify is
        built on PHP/Laravel and uses Traefik as its proxy. Nidus uses Go
        and a custom Rust proxy. In benchmark tests, Nidus deploys are 2-3x
        faster (12.3s vs 34.2s for a cold Next.js deploy) and the proxy
        handles 70% more throughput (54,656 req/s vs 32,456 req/s for
        Traefik under identical conditions).
      </p>

      <h3>Can I migrate from Coolify to Nidus?</h3>
      <p>
        There is no automated migration tool yet, but the process is
        straightforward. You create the same project in Nidus, set the
        environment variables, configure the custom domains, and deploy.
        The Docker images are built from scratch by Nidus, so there is no
        image to migrate. If you use a Dockerfile, Nidus will use it
        directly. Expect to spend 15-30 minutes per application depending
        on complexity.
      </p>

      <h2>Configuration</h2>

      <h3>Where are the configuration files located?</h3>
      <p>
        By default, Nidus looks for TOML configuration files in
        <code>/etc/nidus/</code>. There are three files: one for each
        component. The server reads <code>/etc/nidus/server.toml</code>,
        the proxy reads <code>/etc/nidus/proxy.toml</code>, and the worker
        reads <code>/etc/nidus/worker.toml</code>. You can override any
        path with the <code>--config</code> flag when starting the binary.
      </p>
      <CodeBlock
        code={`# Default locations
/etc/nidus/server.toml    # API server + database
/etc/nidus/proxy.toml     # Reverse proxy
/etc/nidus/worker.toml    # Build worker

# Override paths
nidus-server --config /opt/nidus/server.toml
nidus-proxy --config /opt/nidus/proxy.toml
nidus-worker --config /opt/nidus/worker.toml`}
        language="bash"
        filename="terminal"
      />

      <h3>Can I use environment variables instead of config files?</h3>
      <p>
        Yes. Every configuration option has a corresponding environment
        variable. The format is <code>NIDUS_&lt;COMPONENT&gt;_&lt;KEY&gt;</code>.
        For nested keys, use underscores: <code>proxy_tls_enabled</code>.
        Environment variables take precedence over values in config files,
        which makes them ideal for containerized deployments.
      </p>
      <CodeBlock
        code={`# Equivalent to setting proxy.tls.enabled = true in proxy.toml
export NIDUS_PROXY_TLS_ENABLED=true

# Equivalent to worker.build.timeout = "15m"
export NIDUS_WORKER_BUILD_TIMEOUT=15m

# Run server entirely from env vars (no config file needed)
export NIDUS_SERVER_PORT=3001
export NIDUS_AUTH_JWT_SECRET=$(openssl rand -base64 32)
export NIDUS_DATABASE_DRIVER=postgres
export NIDUS_DATABASE_DSN="postgres://user:pass@localhost:5432/nidus"
export NIDUS_REDIS_URL="redis://localhost:6379"
nidus-server`}
        language="bash"
        filename="terminal"
      />

      <h3>How do I change configuration after the first deploy?</h3>
      <p>
        Edit the relevant TOML file and restart the service. Nidus does not
        yet support hot-reloading configuration. If you are running the
        services via Docker, you can restart individual containers without
        affecting deployed applications.
      </p>
      <CodeBlock
        code={`# Edit the config
sudo vim /etc/nidus/proxy.toml

# Restart the proxy (systemd)
sudo systemctl restart nidus-proxy

# Restart the proxy (Docker)
docker restart nidus-proxy

# Verify the new config took effect
nidus status --service proxy`}
        language="bash"
        filename="terminal"
      />

      <h3>My config file has an error. How do I validate it?</h3>
      <p>
        Each binary accepts a <code>--validate</code> flag that checks the
        configuration file for syntax errors, missing required fields, and
        invalid values. Run this before restarting the service to avoid
        downtime.
      </p>
      <CodeBlock
        code={`# Validate each config file
nidus-server --config /etc/nidus/server.toml --validate
# Output: ✔️ Configuration is valid

nidus-proxy --config /etc/nidus/proxy.toml --validate
# Output: ❌ Invalid configuration:
#   - proxy.tls.email: required when acme.enabled = true
#   - proxy.rate_limit.window: must be a valid duration (e.g. "1s")

nidus-worker --config /etc/nidus/worker.toml --validate
# Output: ✔️ Configuration is valid`}
        language="bash"
        filename="terminal"
      />

      <h3>How do I configure Nidus for a high-availability setup?</h3>
      <p>
        For HA, run multiple server and worker instances behind a load
        balancer, switch from SQLite to PostgreSQL, and ensure Redis is
        clustered. The server is stateless — all state is in the database
        and Redis. The proxy should run as a single active instance or
        behind an external load balancer like HAProxy or AWS NLB.
      </p>
      <CodeBlock
        code={`# server.toml for HA
[database]
driver = "postgres"
dsn = "postgres://user:pass@postgres-host:5432/nidus?sslmode=require"

[redis]
url = "redis://redis-cluster:6379"
pool_size = 20

# Run multiple server instances behind a load balancer
# Each instance is stateless and shares the same database`}
        language="toml"
        filename="server.toml"
      />

      <h2>Deployment</h2>

      <h3>Why is my deploy stuck in "building"?</h3>
      <p>
        This is the most common issue. There are four likely causes. First,
        check whether Docker is running on the worker host. Second, the
        build may have exceeded the default 10-minute timeout. Third, the
        worker may be out of disk space. Fourth, there may be a syntax
        error in your Dockerfile or build command.
      </p>
      <CodeBlock
        code={`# 1. Check Docker daemon
sudo systemctl status docker
# If not running: sudo systemctl start docker

# 2. Check worker logs for build errors
nidus logs --service worker --level error --since 30m

# 3. Check disk space
df -h /var/lib/docker

# 4. Check build timeout in config
nidus config get worker.build.timeout
# Default is 10m. Increase if builds are large:
nidus config set worker.build.timeout 30m

# 5. Prune old images to free space
docker system prune -af`}
        language="bash"
        filename="terminal"
      />

      <h3>How do I deploy with zero downtime?</h3>
      <p>
        Nidus uses rolling deployments by default. The worker starts a new
        container, waits for it to pass a health check, then switches the
        proxy to route traffic to the new container before stopping the old
        one. Your application must expose a <code>/health</code> endpoint
        that returns HTTP 200 when ready to serve traffic. Most frameworks
        have this built in or available as a plugin.
      </p>
      <CodeBlock
        code={`# worker.toml — rolling deploy settings
[worker.deploy]
strategy = "rolling"
health_check_path = "/health"
health_check_timeout = "30s"
health_check_retries = 3
min_healthy = "100%"       # Require all new containers healthy before cutover
drain_timeout = "30s"       # Wait up to 30s for old connections to drain

# Example health endpoint (Express.js)
# app.get('/health', (req, res) => {
#   const dbOk = await checkDatabase();
#   res.status(dbOk ? 200 : 503).json({ status: dbOk ? 'ok' : 'degraded' });
# });`}
        language="toml"
        filename="worker.toml"
      />

      <h3>Can I deploy multiple applications on a single VPS?</h3>
      <p>
        Yes, and this is one of Nidus's strengths. Each application runs in
        its own isolated Docker container. The Rust proxy routes traffic
        based on the hostname. On a $5 Hetzner CX11 (1GB RAM), you can
        comfortably run 5-10 small to medium applications. Larger
        applications with heavy dependencies (e.g., a Next.js app with a
        500MB image) reduce that to 3-5.
      </p>
      <CodeBlock
        code={`# Check current resource usage
nidus status

# Set per-app memory limits to prevent one app from starving others
nidus deploy --project my-app --memory 256M --cpu 0.5

# Monitor individual container usage
docker stats --no-stream --format "table {{.Name}}\\t{{.MemUsage}}\\t{{.CPUPerc}}"`}
        language="bash"
        filename="terminal"
      />

      <h3>How do I set up automatic deploys from GitHub?</h3>
      <p>
        Configure a webhook in your GitHub repository settings pointing to
        your Nidus server. Nidus will automatically pull the latest code,
        build, and deploy whenever you push to the configured branch.
      </p>
      <CodeBlock
        code={`# Server-side webhook configuration
# /etc/nidus/server.toml
[webhook]
secret = "your-webhook-secret"
allowed_ips = ["192.30.252.0/22", "185.199.108.0/22"]

# GitHub repository settings → Webhooks:
# Payload URL: https://nidus.example.com/api/webhooks/github
# Content type: application/json
# Secret: your-webhook-secret
# Events: Push, Pull Request

# Or use the CLI to configure a project for auto-deploy
nidus projects create my-app \\
  --repo https://github.com/user/repo \\
  --branch main \\
  --auto-deploy`}
        language="bash"
        filename="terminal"
      />

      <h3>Why did my deploy fail with "exit code 1"?</h3>
      <p>
        Exit code 1 from a deployment almost always means the build script
        or Docker build process failed. The full build log is available
        through the CLI. Common causes are missing dependencies, syntax
        errors in the build command, or network timeouts during <code>npm
        install</code>.
      </p>
      <CodeBlock
        code={`# Get the full build log
nidus logs my-app --service worker --level error --lines 200

# Common fixes:
# 1. Check package.json for missing dependencies
# 2. Increase npm install timeout:
nidus config set worker.build.install_timeout 5m
# 3. Use npm ci instead of npm install for CI builds
# 4. Verify your build command works locally first
# 5. Check if a Dockerfile exists and has errors`}
        language="bash"
        filename="terminal"
      />

      <h2>Proxy</h2>

      <h3>Proxy returns 502 Bad Gateway. What does that mean?</h3>
      <p>
        A 502 error means the proxy successfully connected to the upstream
        (your application container), but the upstream did not send a valid
        HTTP response within the configured timeout. The most common cause
        is that the application container crashed or is not listening on the
        expected port.
      </p>
      <CodeBlock
        code={`# Check if the container is running
docker ps | grep my-app

# Check container logs
docker logs --tail 50 my-app-container-id

# Test the application directly (bypass proxy)
curl -v http://localhost:3000/health

# Check if the application is listening on the right port
docker exec my-app-container-id ss -tlnp

# Common fixes:
# - Application crashed: fix the crash, redeploy
# - Wrong port: EXPOSE the correct port in Dockerfile
# - Health check failing: check /health endpoint
# - Container taking too long to start: increase health_check_timeout`}
        language="bash"
        filename="terminal"
      />

      <h3>How do I set up SSL/TLS with Let's Encrypt?</h3>
      <p>
        Nidus supports automatic TLS provisioning via the ACME protocol.
        The proxy handles the entire Let's Encrypt flow: it obtains the
        certificate, stores it, and renews it automatically before expiry.
        You just need to ensure port 80 is reachable from the internet for
        the HTTP-01 challenge.
      </p>
      <CodeBlock
        code={`# proxy.toml — ACME configuration
[proxy.tls]
enabled = true

[proxy.tls.acme]
enabled = true
email = "admin@your-domain.com"
challenge = "http-01"
storage = "/var/lib/nidus/acme.json"
renewal_threshold = "720h"   # 30 days before expiry

# After restarting the proxy, add domains with automatic TLS:
nidus domains add my-app myapp.example.com
nidus domains tls my-app myapp.example.com --enable

# Verify certificate
echo | openssl s_client -connect myapp.example.com:443 -servername myapp.example.com 2>/dev/null | openssl x509 -noout -text | grep "Not After"`}
        language="bash"
        filename="terminal"
      />

      <h3>Can I use Nidus behind Cloudflare?</h3>
      <p>
        Yes. Set Cloudflare's SSL/TLS mode to "Full (Strict)" and use a
        Cloudflare Origin Certificate on your Nidus server. The proxy
        supports uploading custom certificates and will use them for TLS
        termination. Make sure to configure Cloudflare to pass the original
        client IP via the <code>CF-Connecting-IP</code> header.
      </p>
      <CodeBlock
        code={`# proxy.toml — Cloudflare origin certificate
[proxy.tls]
enabled = true
cert_path = "/etc/nidus/certs/cloudflare-origin.pem"
key_path = "/etc/nidus/certs/cloudflare-origin-key.pem"

# Tell Nidus to trust Cloudflare headers for real IP logging
[proxy]
trusted_proxies = ["173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22"]
real_ip_header = "CF-Connecting-IP"`}
        language="toml"
        filename="proxy.toml"
      />

      <h3>How do I configure WebSocket support?</h3>
      <p>
        WebSocket connections work out of the box. The Rust proxy natively
        handles the HTTP upgrade request and proxies the WebSocket frames
        bidirectionally. No special configuration is required unless you
        need to adjust frame size limits or ping intervals.
      </p>
      <CodeBlock
        code={`# proxy.toml — WebSocket settings (optional)
[proxy.websocket]
enabled = true
max_frame_size = 65536        # 64KB default
ping_interval = "30s"         # Keepalive pings
max_connections = 1000        # Per upstream

# Verify WebSocket proxying works
# Use wscat to test:
# wscat -c wss://myapp.example.com/socket`}
        language="toml"
        filename="proxy.toml"
      />

      <h3>Proxy is using too much memory. What can I do?</h3>
      <p>
        The Rust proxy is already extremely memory-efficient (12MB idle,
        45MB at 10K connections), but you can tune it further if needed.
        The main knobs are connection limits, buffer sizes, and idle
        timeout.
      </p>
      <CodeBlock
        code={`# Reduce memory by tightening limits
[proxy.limits]
max_connections = 5000        # Down from 10000
max_request_size = "10MB"      # Down from 50MB

[proxy.timeouts]
idle = "30s"                   # Down from 60s — free idle connections faster

[proxy.buffers]
read_buffer = 4096             # 4KB (default 8KB)
write_buffer = 4096            # 4KB (default 8KB)
max_buffer_pool = 1000         # Limit pooled buffers

# After changes, restart and compare
nidus status --service proxy
# Memory should decrease proportionally to connection count`}
        language="toml"
        filename="proxy.toml"
      />

      <h2>Performance</h2>

      <h3>How many requests per second can Nidus handle?</h3>
      <p>
        The Rust proxy has been benchmarked at 54,656 req/s on a 2-core VPS
        with 4GB RAM using wrk with 400 concurrent connections. Under the
        same conditions, Nginx handles 48,234 req/s and Traefik handles
        32,456 req/s. At 50,000 concurrent connections, the Rust proxy uses
        ~120MB RAM compared to Nginx's 320MB and Traefik's 650MB.
      </p>
      <p>
        Real-world throughput depends on your application's response time.
        If your application responds in 50ms, the proxy can sustain roughly
        2,000 req/s per instance. If your app responds in 200ms, that drops
        to about 500 req/s. The proxy itself adds less than 1ms of latency
        per request.
      </p>

      <h3>How can I reduce deploy times?</h3>
      <p>
        Deploy speed is dominated by the Docker build step. Enable BuildKit
        caching to cache intermediate layers across builds. Use multi-stage
        Dockerfiles to keep images small. If you deploy frequently, the
        build cache will make subsequent deploys significantly faster.
      </p>
      <CodeBlock
        code={`# Enable BuildKit cache
nidus config set worker.build.buildkit_enabled true
nidus config set worker.build.cache_from '["type=registry"]'
nidus config set worker.build.cache_to '["type=local,dest=/var/lib/nidus/buildkit-cache"]'

# Keep images lean (example multi-stage Dockerfile)
# FROM node:20-alpine AS deps
# RUN npm ci --only=production
# FROM node:20-alpine AS builder
# COPY --from=deps /app/node_modules ./node_modules
# RUN npm run build
# FROM node:20-alpine
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/public ./public
# EXPOSE 3000
# CMD ["node", "server.js"]

# Run a deploy and watch cache hits
nidus deploy --project my-app --verbose`}
        language="bash"
        filename="terminal"
      />

      <h3>How do I monitor Nidus performance?</h3>
      <p>
        The built-in <code>nidus status</code> command gives you real-time
        CPU, memory, and uptime for all services. For historical monitoring,
        you can ship metrics to Prometheus. Each component exposes a
        <code>/metrics</code> endpoint in Prometheus format.
      </p>
      <CodeBlock
        code={`# Check current performance
nidus status --watch

# Prometheus metrics endpoint
curl http://localhost:3001/metrics | head -20
# Output:
# HELP nidus_deploy_duration_seconds Duration of deployments
# TYPE nidus_deploy_duration_seconds histogram
# nidus_deploy_duration_seconds_bucket{le="10"} 42
# nidus_deploy_duration_seconds_bucket{le="30"} 87
# ...
# HELP nidus_proxy_requests_total Total proxy requests
# TYPE nidus_proxy_requests_total counter
# nidus_proxy_requests_total{status="2xx"} 15423
# nidus_proxy_requests_total{status="5xx"} 23

# Docker stats for all containers
docker stats --no-stream`}
        language="bash"
        filename="terminal"
      />

      <h2>Security</h2>

      <h3>How are secrets stored?</h3>
      <p>
        Secrets are encrypted at rest using AES-256-GCM with a server-side
        master key. The master key is stored in a separate file and should
        be backed up securely. Secrets are never written to logs, never
        returned in API responses, and never exposed in deploy output. They
        are decrypted in memory only when needed for builds.
      </p>
      <CodeBlock
        code={`# Location of the master key
# /var/lib/nidus/master.key (keep this safe!)

# Backup the master key separately from the database
sudo cp /var/lib/nidus/master.key /backup/nidus-master-key-$(date +%Y%m%d).key

# Rotate the encryption key (re-encrypts all secrets)
nidus secrets rotate --all

# Verify secrets are not exposed
nidus secrets list my-app
# Notice: values always show as "••••••••"`}
        language="bash"
        filename="terminal"
      />

      <h3>How do I restrict API access?</h3>
      <p>
        API keys have configurable scopes. You can create keys that only
        allow reading deployment status, or keys that can create and roll
        back deployments. Scopes are validated on every request.
      </p>
      <CodeBlock
        code={`# server.toml — API key scopes
[auth.api_keys]
rate_limit = 100
scopes = ["deploy:read", "deploy:write", "projects:read", "projects:write"]

# Available scopes:
# deploy:read      — View deployment status and logs
# deploy:write     — Create and rollback deployments
# projects:read    — List and view project details
# projects:write   — Create, update, and delete projects
# domains:read     — View domain configuration
# domains:write    — Add, remove, and configure domains
# secrets:read     — List secrets (values still masked)
# secrets:write    — Create and delete secrets
# admin            — Full access (not recommended for CI tokens)`}
        language="toml"
        filename="server.toml"
      />

      <h3>Should I expose the Nidus server directly to the internet?</h3>
      <p>
        No. The Nidus server API should only be accessible from your internal
        network, VPN, or via the CLI through the proxy. The Rust proxy is the
        only component that should be publicly reachable. It is hardened,
        audited, and handles millions of requests in production. The server
        API should listen on localhost or a private interface.
      </p>
      <CodeBlock
        code={`# server.toml — bind to localhost only
[server]
host = "127.0.0.1"    # Not 0.0.0.0!
port = 3001

# Access the API through the proxy with a path prefix
# https://nidus.example.com/api/ → proxy → localhost:3001`}
        language="toml"
        filename="server.toml"
      />

      <h2>Troubleshooting Quick Reference</h2>

      <h3>Common Errors and Solutions</h3>
      <table>
        <thead>
          <tr>
            <th>Error</th>
            <th>Likely Cause</th>
            <th>Solution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>502 Bad Gateway</code></td>
            <td>App container not running or not responding</td>
            <td><code>docker ps | grep app</code> and check app logs</td>
          </tr>
          <tr>
            <td><code>504 Gateway Timeout</code></td>
            <td>App taking too long to respond</td>
            <td>Increase proxy read/write timeouts or optimize app</td>
          </tr>
          <tr>
            <td><code>connection refused</code></td>
            <td>Service not running or wrong address</td>
            <td><code>systemctl status nidus-*</code> and check ports</td>
          </tr>
          <tr>
            <td><code>deploy stuck building</code></td>
            <td>Docker not running or OOM</td>
            <td><code>systemctl start docker</code> or increase RAM</td>
          </tr>
          <tr>
            <td><code>TLS certificate error</code></td>
            <td>ACME challenge failed or cert expired</td>
            <td><code>nidus domains tls my-app domain.com --enable</code></td>
          </tr>
          <tr>
            <td><code>rate limit exceeded</code></td>
            <td>Too many API requests</td>
            <td>Wait 60s or increase <code>auth.api_keys.rate_limit</code></td>
          </tr>
          <tr>
            <td><code>disk space warning</code></td>
            <td>Old Docker images not pruned</td>
            <td><code>docker system prune -af</code></td>
          </tr>
          <tr>
            <td><code>database locked</code></td>
            <td>SQLite contention under high writes</td>
            <td>Switch to PostgreSQL for production workloads</td>
          </tr>
        </tbody>
      </table>

      <h3>Getting Help</h3>
      <p>
        If you encounter an issue not covered here, the fastest way to get
        help is through the Nidus Discord or GitHub Discussions. When asking
        for help, include the output of <code>nidus status --output json</code>
        and the relevant logs from <code>nidus logs --service worker --level
        debug --since 1h</code>. This gives the maintainers everything they
        need to diagnose the problem.
      </p>
      <CodeBlock
        code={`# Collect diagnostic info
nidus status --output json > nidus-diagnostic.json
nidus logs --service worker --level debug --since 1h > nidus-worker-logs.txt
nidus logs --service proxy --level error --since 1h > nidus-proxy-errors.txt

# Include these files in your GitHub issue or Discord message
# File sizes are typically under 100KB`}
        language="bash"
        filename="terminal"
      />
    </div>
  );
}
