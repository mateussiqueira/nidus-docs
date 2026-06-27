import CodeBlock from "@/components/CodeBlock";

export default function PTConfigurationPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>
      </div>

      <h1>Configuração</h1>
      <p>Nidus usa arquivos de configuração TOML. Cada componente tem sua própria config.</p>

      <h2>Config do Server</h2>
      <p><code>/etc/nidus/server.toml</code></p>
      <CodeBlock code={`[server]
host = "0.0.0.0"
port = 3001
read_timeout = "30s"
write_timeout = "30s"
max_header_bytes = 1048576

[auth]
jwt_secret = "MUDE_PARA_PRODUCAO"
jwt_algorithm = "HS256"
session_ttl = "24h"
refresh_ttl = "7d"

[auth.api_keys]
rate_limit = 100
scopes = ["deploy:read", "deploy:write", "projects:read", "projects:write"]

[database]
driver = "sqlite"
path = "/var/lib/nidus/data.db"

[redis]
url = "redis://localhost:6379"
pool_size = 10

[webhook]
secret = "seu-webhook-secret"
allowed_ips = ["192.30.252.0/22", "185.199.108.0/22"]

[logging]
level = "info"
format = "json"
output = "stdout"

[cors]
allowed_origins = ["https://seu-dominio.com"]
allow_credentials = true`} language="toml" filename="server.toml" />

      <h2>Config do Proxy</h2>
      <p><code>/etc/nidus/proxy.toml</code></p>
      <CodeBlock code={`[proxy]
port = 3080
host = "0.0.0.0"

[proxy.tls]
enabled = true
cert_path = "/etc/nidus/certs/fullchain.pem"
key_path = "/etc/nidus/certs/privkey.pem"

[proxy.tls.acme]
enabled = true
email = "admin@seu-dominio.com"
challenge = "http-01"

[proxy.rate_limit]
requests = 1000
window = "1s"
burst = 50
distributed = true

[proxy.timeouts]
read = "30s"
write = "30s"
idle = "60s"

[proxy.limits]
max_connections = 10000
max_request_size = "50MB"

[proxy.upstream]
health_check_interval = "10s"
healthy_threshold = 2
unhealthy_threshold = 3

[proxy.websocket]
enabled = true
ping_interval = "30s"`} language="toml" filename="proxy.toml" />

      <h2>Config do Worker</h2>
      <p><code>/etc/nidus/worker.toml</code></p>
      <CodeBlock code={`[worker]
concurrency = 4
poll_interval = "1s"
max_retries = 3

[worker.build]
timeout = "10m"
max_image_size = "2GB"
buildkit_enabled = true

[worker.container]
restart_policy = "unless-stopped"
memory_limit = "512MB"
cpu_quota = 200000

[worker.deploy]
strategy = "rolling"
health_check_timeout = "30s"
drain_timeout = "30s"

[worker.cleanup]
enabled = true
interval = "1h"
keep_images = 5
prune_dangling = true`} language="toml" filename="worker.toml" />

      <h2>Variáveis de Ambiente</h2>
      <CodeBlock code={`# Formato: NIDUS_SECTION_KEY
NIDUS_SERVER_PORT=3001
NIDUS_AUTH_JWT_SECRET=meu-secreto
NIDUS_DATABASE_DSN=postgres://...
NIDUS_REDIS_URL=redis://localhost:6379
NIDUS_PROXY_PORT=3080
NIDUS_WORKER_CONCURRENCY=8`} language="bash" filename="terminal" />

      <h2>Serviço Systemd</h2>
      <CodeBlock code={`# /etc/systemd/system/nidus.service
[Unit]
Description=Nidus Deploy Platform
After=network.target docker.service redis.service
Requires=docker.service redis.service

[Service]
Type=simple
User=nidus
Group=nidus
ExecStart=/usr/local/bin/nidus-server --config /etc/nidus/server.toml
Restart=always
RestartSec=5
LimitNOFILE=65536

NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/nidus /var/log/nidus
PrivateTmp=yes

[Install]
WantedBy=multi-user.target`} language="ini" filename="nidus.service" />
    </div>
  );
}
