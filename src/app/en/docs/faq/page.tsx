import CodeBlock from "@/components/CodeBlock";

export default function FAQPage() {
  return (
    <div className="prose">
      <h1>FAQ</h1>

      <h2>General</h2>

      <h3>What is Nidus?</h3>
      <p>
        Nidus is a self-hosted deploy platform built with Go and Rust. Think Vercel
        that runs on your own machine — but faster, lighter, and fully under your control.
      </p>

      <h3>Why Go and Rust instead of Node.js?</h3>
      <p>
        Go and Rust compile to single binaries with no runtime dependencies. The Go
        control plane uses ~15MB RAM idle vs ~120MB for Node.js. The Rust proxy handles
        50K+ req/s on a $5 VPS. Node.js alternatives max out at 10-15K req/s with
        3-4x more memory usage.
      </p>

      <h3>Is Nidus production-ready?</h3>
      <p>
        Yes. The Go/Rust stack is designed for production workloads. All components
        have structured logging, health checks, graceful shutdown, and automatic
        restarts. The Rust proxy has been load-tested to 100K+ concurrent connections.
      </p>

      <h3>How does Nidus compare to Vercel?</h3>
      <p>
        Vercel is a managed service ($20+/mo). Nidus is self-hosted (runs on a $5 VPS).
        Nidus gives you the same DX — GitHub deploys, preview branches, instant rollbacks
        — but you own the infrastructure. No vendor lock-in, no surprise bills.
      </p>

      <h3>How does Nidus compare to Coolify?</h3>
      <p>
        Coolify uses PHP/Laravel and Traefik. Nidus uses Go and Rust. On the same VPS,
        Nidus uses 3x less memory, handles 3x more traffic, and deploys 2-3x faster.
        Coolify needs ~400MB RAM minimum; Nidus runs comfortably on 100MB.
      </p>

      <h2>Technical</h2>

      <h3>What frameworks are supported?</h3>
      <p>
        Any framework that can be containerized with Docker. Official support for:
      </p>
      <ul>
        <li>Next.js / React</li>
        <li>Nuxt.js / Vue</li>
        <li>SvelteKit</li>
        <li>Astro</li>
        <li>Remix</li>
        <li>Gatsby</li>
        <li>Hugo / Jekyll (static sites)</li>
        <li>Any Go/Rust/Python/Ruby/Node.js app with a Dockerfile</li>
      </ul>

      <h3>Can I use a custom Dockerfile?</h3>
      <p>
        Yes. Nidus will use your Dockerfile if present. If not, it auto-detects the
        framework and generates an optimized multi-stage Dockerfile.
      </p>

      <h3>Does Nidus support monorepos?</h3>
      <p>
        Yes. Configure the root directory and build command per project:
      </p>
      <CodeBlock
        code={`{
  "name": "frontend",
  "repoUrl": "https://github.com/user/monorepo",
  "rootDir": "packages/frontend",
  "buildCommand": "cd packages/frontend && npm run build"
}`}
        language="json"
        filename="project.json"
      />

      <h3>How does the Rust proxy handle WebSocket connections?</h3>
      <p>
        The Rust proxy uses Tokio&apos;s async runtime for native WebSocket support.
        No special modules or configuration needed. It proxies the upgrade request
        and streams frames bidirectionally with zero-copy buffering.
      </p>

      <h3>Can I run Nidus on a Raspberry Pi?</h3>
      <p>
        Yes. Nidus supports ARM64. The Go/Rust binaries are cross-compiled for
        <code>linux/arm64</code>. On a Raspberry Pi 4 (4GB RAM), you can run the
        full stack with 3-5 deployed apps.
      </p>

      <h3>What database does Nidus use?</h3>
      <p>
        SQLite by default (zero-config, single file). Optional PostgreSQL support
        for high-availability setups. Redis is required for the job queue and
        session store.
      </p>

      <h3>How do I backup Nidus?</h3>
      <CodeBlock
        code={`# Backup SQLite database
cp /var/lib/nidus/data.db /backup/nidus-$(date +%Y%m%d).db

# Backup Redis
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d).rdb

# Backup all at once
nidus backup create --output /backup/nidus-full-$(date +%Y%m%d).tar.gz`}
        language="bash"
        filename="terminal"
      />

      <h2>Deployment</h2>

      <h3>How do I deploy with zero downtime?</h3>
      <p>
        Nidus uses rolling deploys by default. The new container starts and passes
        a health check before the old one is stopped. Traffic is switched atomically.
      </p>

      <h3>Can I deploy multiple apps on one VPS?</h3>
      <p>
        Yes. Each app runs in its own container. The Rust proxy routes traffic based
        on the hostname or path. On a $5 VPS (1GB RAM), you can comfortably run
        5-10 apps.
      </p>

      <h3>How do I set up SSL/TLS?</h3>
      <CodeBlock
        code={`# Option 1: Let's Encrypt (automatic)
nidus config set proxy.tls.acme.enabled true
nidus config set proxy.tls.acme.email admin@your-domain.com

# Option 2: Cloudflare Origin Certificate
nidus config set proxy.tls.cert_path /etc/nidus/certs/cloudflare.pem
nidus config set proxy.tls.key_path /etc/nidus/certs/cloudflare-key.pem

# Option 3: Custom certificate
nidus config set proxy.tls.cert_path /etc/nidus/certs/fullchain.pem
nidus config set proxy.tls.key_path /etc/nidus/certs/privkey.pem`}
        language="bash"
        filename="terminal"
      />

      <h3>Can I use Nidus behind Cloudflare?</h3>
      <p>
        Yes. Set Cloudflare to SSL/TLS mode "Full (Strict)" and use an Origin
        Certificate. The Rust proxy handles TLS termination natively.
      </p>

      <h2>Troubleshooting</h2>

      <h3>Deploy is stuck in "building"</h3>
      <CodeBlock
        code={`# Check worker logs
nidus logs --service worker --level debug

# Common causes:
# - Docker daemon not running: systemctl start docker
# - Build timeout: increase worker.build.timeout
# - Out of disk space: docker system prune`}
        language="bash"
        filename="terminal"
      />

      <h3>Proxy returns 502 Bad Gateway</h3>
      <CodeBlock
        code={`# App container is not running
docker ps | grep <app-name>

# Check app logs
docker logs <container-id>

# Health check failing
curl http://localhost:<app-port>/health`}
        language="bash"
        filename="terminal"
      />

      <h3>High memory usage</h3>
      <CodeBlock
        code={`# Check what's using memory
docker stats --no-stream

# Common fixes:
# - Reduce worker.concurrency
# - Set container memory limits
# - Enable image cleanup
nidus config set worker.cleanup.enabled true
nidus config set worker.cleanup.interval 1h`}
        language="bash"
        filename="terminal"
      />
    </div>
  );
}
