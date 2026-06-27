import CodeBlock from "@/components/CodeBlock";

export default function SecurityPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>{" "}
        <span className="badge badge-new">Security</span>
      </div>

      <h1>Security</h1>
      <p>
        Security is not optional. Here&apos;s how Nidus handles authentication,
        network isolation, and production hardening.
      </p>

      <h2>Authentication</h2>

      <h3>JWT Tokens</h3>
      <CodeBlock
        code={`# Token configuration
[auth]
jwt_secret = "your-256-bit-secret"    # HS256
jwt_algorithm = "HS256"
session_ttl = "24h"
refresh_ttl = "7d"
token_issuer = "nidus.your-domain.com"

# Token payload
{
  "sub": "user_abc123",
  "email": "admin@example.com",
  "role": "admin",
  "iat": 1719408000,
  "exp": 1719494400,
  "iss": "nidus.your-domain.com"
}`}
        language="json"
        filename="jwt-config.json"
      />

      <h3>API Keys</h3>
      <CodeBlock
        code={`# Generate API key for CI/CD
nidus keys create --name "github-actions" --scope "deploy:write"

# Key format: nid_live_<64-char-hex>
# Store in GitHub Secrets, never in code

# Rate limits per key
[auth.api_keys]
rate_limit = 100    # requests per minute
scopes:
  - deploy:read
  - deploy:write
  - projects:read
  - projects:write`}
        language="bash"
        filename="terminal"
      />

      <h2>Network Security</h2>

      <h3>Firewall Rules</h3>
      <CodeBlock
        code={`# Only expose what's necessary
# Block direct access to control plane

# UFW rules
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP (redirect to HTTPS)
ufw allow 443/tcp     # HTTPS
ufw allow 3080/tcp    # Nidus proxy (if public)
ufw deny 3001/tcp     # API (internal only)
ufw deny 3000/tcp     # Dashboard (internal only)
ufw enable`}
        language="bash"
        filename="terminal"
      />

      <h3>TLS Configuration</h3>
      <CodeBlock
        code={`[proxy.tls]
enabled = true
cert_path = "/etc/nidus/certs/fullchain.pem"
key_path = "/etc/nidus/certs/privkey.pem"

# Auto-renew with Let's Encrypt
[proxy.tls.acme]
enabled = true
email = "admin@your-domain.com"
challenge = "http-01"
storage = "/var/lib/nidus/acme.json"

# Or use Cloudflare Origin Certificate
[proxy.tls]
enabled = true
cert_path = "/etc/nidus/certs/cloudflare-origin.pem"
key_path = "/etc/nidus/certs/cloudflare-origin-key.pem"`}
        language="toml"
        filename="proxy.toml"
      />

      <h2>Container Isolation</h2>

      <h3>Network Segmentation</h3>
      <CodeBlock
        code={`# docker-compose.yml
services:
  nidus-proxy:
    networks:
      - public     # Only proxy gets external access

  nidus-server:
    networks:
      - internal   # API is internal only
      - public

  redis:
    networks:
      - internal   # Redis never exposed

networks:
  public:
    driver: bridge
  internal:
    driver: bridge
    internal: true  # No external access`}
        language="yaml"
        filename="docker-compose.yml"
      />

      <h3>Resource Limits</h3>
      <CodeBlock
        code={`# Prevent runaway deploys from consuming all resources
[worker.limits]
max_memory = "512MB"         # Per build container
max_cpu = "2.0"              # CPU cores
max_concurrent_builds = 4    # Limit parallel builds
build_timeout = "10m"        # Kill builds after timeout

# Deployed app limits
[proxy.limits]
max_connections = 1000       # Per app
rate_limit = 1000            # Requests per second per IP
idle_timeout = "30s"         # Close idle connections
body_size_limit = "50MB"     # Max request body`}
        language="toml"
        filename="config.toml"
      />

      <h2>Secrets Management</h2>
      <CodeBlock
        code={`# Environment variables are encrypted at rest
nidus secrets set MY_DB_URL "postgresql://user:pass@host/db"
nidus secrets set API_KEY "sk-1234567890"

# Stored encrypted in SQLite
# Decrypted only at container runtime
# Never logged or exposed in API responses

# Rotation
nidus secrets rotate --all    # Rotate all secrets
nidus secrets list            # List (values hidden)`}
        language="bash"
        filename="terminal"
      />

      <h2>Audit Logging</h2>
      <CodeBlock
        code={`# All actions are logged
[logging]
level = "info"
format = "json"
output = "/var/log/nidus/audit.log"

# Log format
{
  "timestamp": "2026-06-26T10:30:00Z",
  "level": "info",
  "event": "deploy.completed",
  "user": "admin@example.com",
  "project": "my-app",
  "deploy_id": "dep_abc123",
  "duration": "12.3s",
  "image_size": "145MB",
  "ip": "203.0.113.42"
}

# Filter audit logs
nidus logs --event deploy.completed --user admin@example.com
nidus logs --since "1h" --level warn`}
        language="bash"
        filename="terminal"
      />

      <h2>Production Checklist</h2>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Status</th>
            <th>Command</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Change default JWT secret</td>
            <td>🔴 Required</td>
            <td><code>nidus config set auth.jwt_secret $RANDOM</code></td>
          </tr>
          <tr>
            <td>Enable TLS</td>
            <td>🔴 Required</td>
            <td><code>nidus config set proxy.tls.enabled true</code></td>
          </tr>
          <tr>
            <td>Firewall configured</td>
            <td>🔴 Required</td>
            <td><code>ufw status</code></td>
          </tr>
          <tr>
            <td>API rate limiting</td>
            <td>🟡 Recommended</td>
            <td><code>nidus config set proxy.rate_limit 1000</code></td>
          </tr>
          <tr>
            <td>Audit logging</td>
            <td>🟡 Recommended</td>
            <td><code>nidus config set logging.level info</code></td>
          </tr>
          <tr>
            <td>Container resource limits</td>
            <td>🟡 Recommended</td>
            <td><code>nidus config set worker.limits.max_memory 512MB</code></td>
          </tr>
          <tr>
            <td>Secrets encryption</td>
            <td>🟡 Recommended</td>
            <td><code>nidus secrets set --encrypt</code></td>
          </tr>
          <tr>
            <td>Disable default admin</td>
            <td>🟢 Optional</td>
            <td><code>nidus users disable demo@nidus.dev</code></td>
          </tr>
        </tbody>
      </table>

      <h2>Comparison with Alternatives</h2>
      <table>
        <thead>
          <tr>
            <th>Security Feature</th>
            <th>Nidus</th>
            <th>Coolify</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Memory Safety</td>
            <td>✅ Go + Rust</td>
            <td>❌ PHP</td>
          </tr>
          <tr>
            <td>Container Isolation</td>
            <td>✅ Native Docker</td>
            <td>⚠️ Docker-in-Docker</td>
          </tr>
          <tr>
            <td>TLS Termination</td>
            <td>✅ Built-in (Rust)</td>
            <td>⚠️ Traefik</td>
          </tr>
          <tr>
            <td>Rate Limiting</td>
            <td>✅ Per-request (Rust)</td>
            <td>⚠️ Traefik middleware</td>
          </tr>
          <tr>
            <td>Secrets Encryption</td>
            <td>✅ At rest</td>
            <td>⚠️ Env vars only</td>
          </tr>
          <tr>
            <td>Audit Logging</td>
            <td>✅ Structured JSON</td>
            <td>❌ Basic</td>
          </tr>
        </tbody>
      </table>

      <blockquote>
        <strong>Key advantage:</strong> Go and Rust are memory-safe languages. No buffer
        overflows, no use-after-free, no format string vulnerabilities. The attack
        surface is dramatically smaller than C/C++ or PHP alternatives.
      </blockquote>
    </div>
  );
}
