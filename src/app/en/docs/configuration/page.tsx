import CodeBlock from "@/components/CodeBlock";

export default function ConfigurationPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>
      </div>

      <h1>Configuration</h1>
      <p>
        Nidus uses TOML configuration files. Each component has its own config.
      </p>

      <h2>Server Config</h2>
      <p><code>/etc/nidus/server.toml</code></p>
      <CodeBlock
        code={`[server]
host = "0.0.0.0"
port = 3001
read_timeout = "30s"
write_timeout = "30s"
max_header_bytes = 1048576  # 1MB

[auth]
jwt_secret = "CHANGE_ME_IN_PRODUCTION"
jwt_algorithm = "HS256"
session_ttl = "24h"
refresh_ttl = "7d"
token_issuer = "nidus.your-domain.com"

[auth.api_keys]
rate_limit = 100  # per minute
scopes = ["deploy:read", "deploy:write", "projects:read", "projects:write"]

[database]
driver = "sqlite"
path = "/var/lib/nidus/data.db"
# Or PostgreSQL:
# driver = "postgres"
# dsn = "postgres://user:pass@localhost:5432/nidus?sslmode=disable"

[redis]
url = "redis://localhost:6379"
pool_size = 10
min_idle = 2

[webhook]
secret = "your-webhook-secret"
allowed_ips = ["192.30.252.0/22", "185.199.108.0/22"]  # GitHub IPs

[logging]
level = "info"      # debug, info, warn, error
format = "json"     # json, text
output = "stdout"   # stdout, /var/log/nidus/server.log

[cors]
allowed_origins = ["https://your-domain.com"]
allow_credentials = true`}
        language="toml"
        filename="server.toml"
      />

      <h2>Proxy Config</h2>
      <p><code>/etc/nidus/proxy.toml</code></p>
      <CodeBlock
        code={`[proxy]
port = 3080
host = "0.0.0.0"

[proxy.tls]
enabled = true
cert_path = "/etc/nidus/certs/fullchain.pem"
key_path = "/etc/nidus/certs/privkey.pem"

[proxy.tls.acme]
enabled = true
email = "admin@your-domain.com"
challenge = "http-01"
storage = "/var/lib/nidus/acme.json"

[proxy.rate_limit]
requests = 1000        # per window
window = "1s"
burst = 50             # allow burst
distributed = true     # use Redis for distributed limiting

[proxy.timeouts]
read = "30s"
write = "30s"
idle = "60s"
header_timeout = "10s"

[proxy.limits]
max_connections = 10000
max_request_size = "50MB"
max_uri_length = 8192

[proxy.upstream]
health_check_interval = "10s"
health_check_timeout = "5s"
healthy_threshold = 2
unhealthy_threshold = 3

[proxy.websocket]
enabled = true
max_frame_size = 65536
ping_interval = "30s"

[proxy.logging]
access_log = true
format = "json"
fields = ["method", "uri", "status", "latency", "upstream", "bytes"]`}
        language="toml"
        filename="proxy.toml"
      />

      <h2>Worker Config</h2>
      <p><code>/etc/nidus/worker.toml</code></p>
      <CodeBlock
        code={`[worker]
concurrency = 4          # goroutines (max: NumCPU * 2)
poll_interval = "1s"     # check queue interval
max_retries = 3
retry_delay = "5s"

[worker.build]
timeout = "10m"
max_image_size = "2GB"
buildkit_enabled = true
cache_from = ["type=registry"]
cache_to = ["type=local,dest=/var/lib/nidus/buildkit-cache"]

[worker.container]
runtime = "runc"
restart_policy = "unless-stopped"
oom_kill_disable = false
memory_limit = "512MB"
cpu_quota = 200000      # 2 cores
pids_limit = 512

[worker.deploy]
strategy = "rolling"
health_check_timeout = "30s"
health_check_retries = 3
min_healthy = "100%"
drain_timeout = "30s"

[worker.cleanup]
enabled = true
interval = "1h"
keep_images = 5         # per project
prune_dangling = true`}
        language="toml"
        filename="worker.toml"
      />

      <h2>Environment Variables</h2>
      <p>All config values can be overridden with environment variables:</p>
      <CodeBlock
        code={`# Format: NIDUS_SECTION_KEY
NIDUS_SERVER_PORT=3001
NIDUS_AUTH_JWT_SECRET=my-secret
NIDUS_DATABASE_DSN=postgres://...
NIDUS_REDIS_URL=redis://localhost:6379
NIDUS_PROXY_PORT=3080
NIDUS_PROXY_TLS_ENABLED=true
NIDUS_WORKER_CONCURRENCY=8`}
        language="bash"
        filename="terminal"
      />

      <h2>Systemd Service</h2>
      <CodeBlock
        code={`# /etc/systemd/system/nidus.service
[Unit]
Description=Nidus Deploy Platform
After=network.target docker.service redis.service
Requires=docker.service redis.service

[Service]
Type=simple
User=nidus
Group=nidus
ExecStart=/usr/local/bin/nidus-server --config /etc/nidus/server.toml
ExecStartPost=/usr/local/bin/nidus-proxy --config /etc/nidus/proxy.toml
ExecStartPost=/usr/local/bin/nidus-worker --config /etc/nidus/worker.toml
Restart=always
RestartSec=5
LimitNOFILE=65536

# Security hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/nidus /var/log/nidus
PrivateTmp=yes

[Install]
WantedBy=multi-user.target`}
        language="bash"
        filename="nidus.service"
      />
    </div>
  );
}
