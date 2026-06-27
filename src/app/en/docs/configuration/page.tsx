import CodeBlock from "@/components/CodeBlock";

export default function ConfigurationPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>{" "}
        <span className="badge badge-config">Configuration</span>
      </div>

      <h1>Configuration Guide</h1>
      <p>
        Nidus is configured through TOML files, environment variables, and
        an optional Docker Compose file for the full stack. This guide covers
        every configuration option, explains what it does, and shows you how
        to tune each component for your specific workload.
      </p>

      <h2>Understanding the .env File</h2>
      <p>
        While each component has its own TOML file, you can also use a single
        <code>.env</code> file to configure everything. Environment variables
        override values in TOML files, which makes them useful for
        containerized deployments, CI/CD pipelines, and 12-factor app
        patterns.
      </p>

      <h3>Naming Convention</h3>
      <p>
        Environment variables follow the pattern
        <code>NIDUS_&lt;COMPONENT&gt;_&lt;SECTION&gt;_&lt;KEY&gt;</code>.
        Nested keys are flattened with underscores. For example, the TOML
        key <code>proxy.tls.acme.enabled</code> becomes
        <code>NIDUS_PROXY_TLS_ACME_ENABLED</code>.
      </p>
      <CodeBlock
        code={`# ─── Server Variables ───
NIDUS_SERVER_HOST=0.0.0.0
NIDUS_SERVER_PORT=3001
NIDUS_SERVER_READ_TIMEOUT=30s
NIDUS_SERVER_WRITE_TIMEOUT=30s
NIDUS_SERVER_MAX_HEADER_BYTES=1048576

# ─── Authentication ───
NIDUS_AUTH_JWT_SECRET=your-256-bit-secret-here
NIDUS_AUTH_JWT_ALGORITHM=HS256
NIDUS_AUTH_SESSION_TTL=24h
NIDUS_AUTH_REFRESH_TTL=720h
NIDUS_AUTH_TOKEN_ISSUER=nidus.example.com

# ─── Database ───
NIDUS_DATABASE_DRIVER=postgres
NIDUS_DATABASE_DSN=postgresql://user:password@localhost:5432/nidus?sslmode=require
NIDUS_DATABASE_MAX_OPEN_CONNS=25
NIDUS_DATABASE_MAX_IDLE_CONNS=10
NIDUS_DATABASE_CONN_MAX_LIFETIME=30m

# ─── Redis ───
NIDUS_REDIS_URL=redis://localhost:6379
NIDUS_REDIS_POOL_SIZE=20
NIDUS_REDIS_MIN_IDLE=5
NIDUS_REDIS_DIAL_TIMEOUT=5s
NIDUS_REDIS_READ_TIMEOUT=3s

# ─── Proxy ───
NIDUS_PROXY_HOST=0.0.0.0
NIDUS_PROXY_PORT=3080
NIDUS_PROXY_TLS_ENABLED=true
NIDUS_PROXY_TLS_ACME_ENABLED=true
NIDUS_PROXY_TLS_ACME_EMAIL=admin@example.com
NIDUS_PROXY_RATE_LIMIT_REQUESTS=1000
NIDUS_PROXY_RATE_LIMIT_WINDOW=1s
NIDUS_PROXY_MAX_CONNECTIONS=10000

# ─── Worker ───
NIDUS_WORKER_CONCURRENCY=4
NIDUS_WORKER_BUILD_TIMEOUT=10m
NIDUS_WORKER_BUILD_MAX_IMAGE_SIZE=2GB
NIDUS_WORKER_CONTAINER_MEMORY_LIMIT=512MB
NIDUS_WORKER_CONTAINER_CPU_QUOTA=200000
NIDUS_WORKER_CLEANUP_ENABLED=true
NIDUS_WORKER_CLEANUP_INTERVAL=1h

# ─── Logging ───
NIDUS_LOGGING_LEVEL=info
NIDUS_LOGGING_FORMAT=json
NIDUS_LOGGING_OUTPUT=stdout
NIDUS_LOGGING_ACCESS_LOG=true`}
        language="bash"
        filename=".env"
      />

      <h3>Variable Precedence</h3>
      <p>
        When the same setting exists in multiple places, the following
        priority applies, from highest to lowest:
      </p>
      <ol>
        <li>
          <strong>Environment variables</strong> — set at process start,
          highest priority
        </li>
        <li>
          <strong>Config file</strong> — the TOML file passed via
          <code>--config</code>
        </li>
        <li>
          <strong>Default values</strong> — built into the binary, lowest
          priority
        </li>
      </ol>
      <p>
        This means you can have a comprehensive TOML file checked into your
        infrastructure repo and override specific values per environment using
        env vars. For example, you might use the same config file for staging
        and production but override <code>DATABASE_DSN</code> and
        <code>LOGGING_LEVEL</code> per environment.
      </p>

      <h2>Docker Compose Configuration</h2>
      <p>
        For a full-stack Nidus deployment, the recommended approach is Docker
        Compose. This single file defines the server, proxy, worker, and their
        dependencies with proper networking, volume mounts, and restart
        policies.
      </p>
      <CodeBlock
        code={`version: "3.8"

services:
  redis:
    image: redis:7-alpine
    container_name: nidus-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 128M

  server:
    image: ghcr.io/mateussiqueira/nidus-server:latest
    container_name: nidus-server
    restart: unless-stopped
    depends_on:
      redis:
        condition: service_healthy
    ports:
      - "127.0.0.1:3001:3001"
    volumes:
      - server-data:/var/lib/nidus
      - ./server.toml:/etc/nidus/server.toml:ro
      - ./certs:/etc/nidus/certs:ro
    environment:
      NIDUS_DATABASE_DRIVER: sqlite
      NIDUS_DATABASE_PATH: /var/lib/nidus/data.db
      NIDUS_REDIS_URL: redis://redis:6379
    deploy:
      resources:
        limits:
          memory: 256M

  proxy:
    image: ghcr.io/mateussiqueira/nidus-proxy:latest
    container_name: nidus-proxy
    restart: unless-stopped
    depends_on:
      - server
    ports:
      - "80:3080"
      - "443:3443"
    volumes:
      - ./proxy.toml:/etc/nidus/proxy.toml:ro
      - proxy-cache:/var/lib/nidus/proxy-cache
      - acme-data:/var/lib/nidus/acme
    deploy:
      resources:
        limits:
          memory: 256M

  worker:
    image: ghcr.io/mateussiqueira/nidus-worker:latest
    container_name: nidus-worker
    restart: unless-stopped
    depends_on:
      redis:
        condition: service_healthy
      server:
        condition: service_started
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - worker-data:/var/lib/nidus
      - buildkit-cache:/var/lib/nidus/buildkit-cache
      - ./worker.toml:/etc/nidus/worker.toml:ro
    environment:
      NIDUS_REDIS_URL: redis://redis:6379
    deploy:
      resources:
        limits:
          memory: 512M

volumes:
  redis-data:
  server-data:
  worker-data:
  buildkit-cache:
  proxy-cache:
  acme-data:`}
        language="yaml"
        filename="docker-compose.yml"
      />

      <h3>Understanding Each Service</h3>
      <p>
        <strong>Redis</strong> — the job queue backbone. The server pushes
        deploy jobs here, and the worker pulls them. Redis also stores
        sessions and distributed rate-limit counters. The 128MB memory limit
        is generous; Redis rarely uses more than 10MB for Nidus workloads.
      </p>
      <p>
        <strong>Server</strong> — the API server that handles webhook
        requests from GitHub, serves the CLI, and manages project metadata.
        It runs SQLite by default, but you can switch to PostgreSQL by
        changing the environment variables. The server should not be exposed
        directly to the internet. It listens on localhost port 3001.
      </p>
      <p>
        <strong>Proxy</strong> — the Rust reverse proxy. It is the only
        component that should be publicly reachable. It terminates TLS,
        handles rate limiting, and routes traffic to application containers.
        The proxy is stateless and can be horizontally scaled behind a load
        balancer.
      </p>
      <p>
        <strong>Worker</strong> — the build and deploy worker. It needs
        access to the Docker socket to build images and start containers.
        The worker is the most resource-intensive component, which is why it
        gets 512MB memory. It also stores the BuildKit cache to speed up
        subsequent deploys.
      </p>

      <h2>Proxy Configuration</h2>
      <p>
        The Rust proxy is the front door to all your applications. Small
        tuning changes here have outsized effects on throughput, latency,
        and reliability.
      </p>

      <h3>Rate Limiting</h3>
      <p>
        Rate limiting protects your applications from traffic spikes and
        abuse. Nidus supports both local (in-memory) and distributed (Redis)
        rate limiting. Distributed mode is required when running multiple
        proxy instances behind a load balancer.
      </p>
      <CodeBlock
        code={`[proxy.rate_limit]
requests = 1000           # Max requests per window
window = "1s"             # Window duration
burst = 50                # Allow short bursts above the limit
distributed = true        # Use Redis for distributed limiting
block_duration = "5m"     # How long to block after exceeding limit
bypass_ips = ["10.0.0.0/8", "172.16.0.0/12"]  # Internal IPs without limit`}
        language="toml"
        filename="proxy.toml"
      />

      <h3>TLS Configuration</h3>
      <p>
        Nidus supports three TLS modes: automatic Let's Encrypt via ACME,
        custom certificates (for Cloudflare origin or enterprise CAs), and
        self-signed for development. ACME is the recommended approach for
        production.
      </p>
      <CodeBlock
        code={`[proxy.tls]
enabled = true
min_version = "1.2"                   # Minimum TLS version
prefer_server_cipher = true
cipher_suites = [
  "TLS_AES_128_GCM_SHA256",
  "TLS_AES_256_GCM_SHA384",
  "TLS_CHACHA20_POLY1305_SHA256"
]

[proxy.tls.acme]
enabled = true
email = "admin@your-domain.com"
challenge = "http-01"                 # http-01 or dns-01
storage = "/var/lib/nidus/acme.json"
renewal_threshold = "720h"            # Renew 30 days before expiry
directory_url = "https://acme-v02.api.letsencrypt.org/directory"`}
        language="toml"
        filename="proxy.toml"
      />

      <h3>Buffer and Timeout Tuning</h3>
      <p>
        Buffer sizes and timeout values should be tuned to match your
        application's behavior. A slow API with large payloads needs larger
        buffers and longer timeouts. A static site can use tighter values
        for better memory efficiency.
      </p>
      <CodeBlock
        code={`[proxy.timeouts]
read = "30s"                          # Time to read request headers + body
write = "30s"                         # Time to write response
idle = "60s"                          # Keep-alive timeout
header_timeout = "10s"                # Time to receive headers
drain_timeout = "30s"                 # Graceful shutdown drain time

[proxy.buffers]
read_buffer = 8192                    # Per-connection read buffer (bytes)
write_buffer = 8192                   # Per-connection write buffer (bytes)
max_buffer_pool = 5000                # Maximum pooled buffers
max_request_body = 52428800           # Max request body (50MB)
max_response_body = 104857600         # Max response body (100MB)

[proxy.limits]
max_connections = 10000               # Concurrent connections
max_uri_length = 8192                 # Maximum URI length
max_headers = 100                     # Maximum header count
max_header_size = 81920               # Max header size (80KB)`}
        language="toml"
        filename="proxy.toml"
      />

      <h3>Upstream Health Checks</h3>
      <p>
        The proxy continuously monitors the health of your application
        containers. If a container becomes unhealthy, the proxy stops routing
        traffic to it. When a new deployment starts, the proxy waits for the
        health check to pass before switching traffic.
      </p>
      <CodeBlock
        code={`[proxy.upstream]
health_check_interval = "10s"         # Check every 10 seconds
health_check_timeout = "5s"           # Per-check timeout
healthy_threshold = 2                 # Pass N checks to become healthy
unhealthy_threshold = 3               # Fail N checks to become unhealthy
max_fails = 5                         # Failures before circuit breaker
fail_timeout = "30s"                  # Circuit breaker cooldown`}
        language="toml"
        filename="proxy.toml"
      />

      <h2>Worker Configuration</h2>
      <p>
        The worker is responsible for building Docker images from your source
        code and deploying them as containers. It spends most of its time
        waiting on Docker builds, so tuning the build pipeline has the
        biggest impact on deploy speed.
      </p>

      <h3>Concurrency and Queue</h3>
      <p>
        The worker uses a goroutine pool to process builds. Setting
        concurrency too high can overload the system; too low leaves
        resources idle. A good starting point is <code>NumCPU</code> for
        general workloads.
      </p>
      <CodeBlock
        code={`[worker]
concurrency = 4                       # Goroutine pool size (max: NumCPU * 2)
poll_interval = "1s"                  # How often to check Redis for new jobs
max_retries = 3                       # Retry failed builds up to 3 times
retry_delay = "5s"                    # Wait 5 seconds between retries
queue_capacity = 50                   # Max pending jobs in memory`}
        language="toml"
        filename="worker.toml"
      />

      <h3>Build Settings</h3>
      <p>
        BuildKit is enabled by default and provides layer caching, parallel
        builds, and better performance than the legacy Docker builder. The
        cache configuration determines how much disk space builds consume.
      </p>
      <CodeBlock
        code={`[worker.build]
timeout = "10m"                       # Build timeout per deployment
install_timeout = "5m"                # npm/pip install timeout
max_image_size = "2GB"                # Reject images larger than 2GB
buildkit_enabled = true               # Use BuildKit (much faster)
cache_from = ["type=registry"]        # Pull cache from registry
cache_to = ["type=local,dest=/var/lib/nidus/buildkit-cache"]
                                      # Save cache locally
cache_size = "10GB"                   # Maximum cache disk usage
compress_logs = true                  # Gzip build logs after completion`}
        language="toml"
        filename="worker.toml"
      />

      <h3>Container Settings</h3>
      <p>
        Each deployed application runs in a Docker container. The worker
        configures resource limits, restart policies, and security settings
        for these containers.
      </p>
      <CodeBlock
        code={`[worker.container]
runtime = "runc"                      # Container runtime (runc or runsc for gVisor)
restart_policy = "unless-stopped"
memory_limit = "512MB"                # Default per-container memory limit
cpu_shares = 1024                     # CPU shares (relative weight)
cpu_quota = 200000                    # CPU CFS quota (200000 = 2 cores)
pids_limit = 512                      # Max PIDs per container
read_only_rootfs = false              # Make rootfs read-only
security_opt = ["no-new-privileges:true"]
cap_drop = ["ALL"]                    # Drop all Linux capabilities
cap_add = ["NET_BIND_SERVICE"]        # Re-add only what's needed`}
        language="toml"
        filename="worker.toml"
      />

      <h3>Deploy Strategy</h3>
      <p>
        Nidus supports rolling deployments with configurable health checks
        and graceful shutdowns. The default settings work for most
        applications, but you can tune them for specific needs.
      </p>
      <CodeBlock
        code={`[worker.deploy]
strategy = "rolling"                  # Rolling, bluegreen, recreate
health_check_path = "/health"         # HTTP path for health checks
health_check_timeout = "30s"          # Max wait for health check
health_check_retries = 3              # Retries before marking unhealthy
min_healthy = "100%"                  # Min healthy instances during rollout
drain_timeout = "30s"                 # Wait for old connections to close
stop_timeout = "30s"                  # SIGTERM → SIGKILL interval`}
        language="toml"
        filename="worker.toml"
      />

      <h3>Cleanup</h3>
      <p>
        Old Docker images accumulate quickly, especially with frequent
        deployments. The cleanup worker periodically removes unused images
        and build cache to free disk space.
      </p>
      <CodeBlock
        code={`[worker.cleanup]
enabled = true
interval = "1h"                       # Run cleanup every hour
keep_images = 5                       # Keep last 5 images per project
prune_dangling = true                 # Remove dangling (untagged) images
prune_cache = true                    # Prune BuildKit cache
cache_min_usage = "1GB"              # Don't prune cache below this size
disk_threshold = "80%"               # Emergency cleanup when disk > 80% full`}
        language="toml"
        filename="worker.toml"
      />

      <h2>Database Configuration</h2>
      <p>
        Nidus supports three data stores: SQLite for zero-config single-node
        setups, PostgreSQL for production and HA deployments, and Redis for
        the job queue and session store.
      </p>

      <h3>SQLite (Default)</h3>
      <p>
        SQLite is the default database driver. It requires zero configuration:
        just specify the path to the database file. SQLite is suitable for
        single-server deployments with moderate traffic (up to a few hundred
        deploys per day).
      </p>
      <CodeBlock
        code={`[database]
driver = "sqlite"
path = "/var/lib/nidus/data.db"       # Database file location
wal_mode = true                       # Write-Ahead Logging (better concurrency)
busy_timeout = 5000                   # Milliseconds before "database is locked"
journal_mode = "WAL"                  # WAL, DELETE, TRUNCATE, MEMORY
cache_size = -20000                   # Cache size in KB (negative = KB)
synchronous = "NORMAL"                # FULL, NORMAL, OFF`}
        language="toml"
        filename="server.toml"
      />

      <h3>PostgreSQL</h3>
      <p>
        PostgreSQL is recommended for production deployments with multiple
        server instances, high availability requirements, or high write
        volume. It requires a running PostgreSQL instance that Nidus can
        connect to.
      </p>
      <CodeBlock
        code={`[database]
driver = "postgres"
dsn = "postgresql://user:password@localhost:5432/nidus?sslmode=require"
max_open_conns = 25                   # Max concurrent connections
max_idle_conns = 10                   # Min idle connections in pool
conn_max_lifetime = "30m"            # Max connection age (prevents stale conns)
conn_max_idle_time = "5m"            # Max idle time before closing
health_check_period = "1m"           # Check connection health periodically
migrations_dir = "/etc/nidus/migrations"  # Custom migration path`}
        language="toml"
        filename="server.toml"
      />

      <h3>Redis</h3>
      <p>
        Redis is mandatory for Nidus. It powers the job queue, session store,
        distributed rate limiting, and real-time log streaming. The
        connection pool should be sized according to your concurrency needs.
      </p>
      <CodeBlock
        code={`[redis]
url = "redis://localhost:6379"        # Redis connection URL
password = ""                         # Redis password (if auth required)
db = 0                                # Redis database number
pool_size = 20                        # Connection pool size (max)
min_idle = 5                          # Minimum idle connections
dial_timeout = "5s"                   # Connection establishment timeout
read_timeout = "3s"                   # Read timeout
write_timeout = "3s"                  # Write timeout
max_retries = 3                       # Retry attempts on failure
min_retry_backoff = "100ms"           # Min retry interval
max_retry_backoff = "2s"              # Max retry interval`}
        language="toml"
        filename="server.toml"
      />

      <h2>Logging Configuration</h2>
      <p>
        All Nidus components output structured JSON logs by default. This
        section covers how to configure log levels, outputs, and formats.
      </p>

      <h3>Server and Worker Logging</h3>
      <CodeBlock
        code={`[logging]
level = "info"                        # debug, info, warn, error, fatal
format = "json"                       # json or text (text is human-readable)
output = "stdout"                     # stdout, stderr, or file path
add_source = false                    # Include file:line in each log entry
time_format = "rfc3339"              # rfc3339, unix, or custom format

# File output with rotation (when output is a file path)
[logging.rotation]
enabled = true
max_size = 100                        # Max file size in MB
max_age = 30                          # Keep logs for 30 days
max_backups = 10                      # Keep 10 rotated files
compress = true                       # Gzip rotated files`}
        language="toml"
        filename="server.toml"
      />

      <h3>Proxy Access Logging</h3>
      <p>
        The proxy maintains a separate access log stream that records every
        HTTP request. Access logs include status codes, latency, upstream
        response time, and bytes transferred.
      </p>
      <CodeBlock
        code={`[proxy.logging]
access_log = true                     # Enable HTTP access logging
format = "json"                       # json, combined (Apache), or custom
output = "stdout"                     # stdout or file path
fields = [
  "method", "uri", "status", "latency",
  "upstream_latency", "bytes_sent",
  "user_agent", "remote_ip", "referer"
]
sample_rate = 1.0                     # Log every request (0.5 = 50% sampling)`}
        language="toml"
        filename="proxy.toml"
      />

      <h2>Complete Configuration Reference</h2>
      <p>
        All configuration options across all three components. Options marked
        with <strong>*</strong> are required.
      </p>

      <h3>Server (<code>server.toml</code>)</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>server.host</code></td>
            <td>string</td>
            <td><code>0.0.0.0</code></td>
            <td>Bind address for the API server</td>
          </tr>
          <tr>
            <td><code>server.port</code></td>
            <td>int</td>
            <td><code>3001</code></td>
            <td>API server port</td>
          </tr>
          <tr>
            <td><code>server.read_timeout</code></td>
            <td>duration</td>
            <td><code>30s</code></td>
            <td>Maximum duration for reading the entire request</td>
          </tr>
          <tr>
            <td><code>server.write_timeout</code></td>
            <td>duration</td>
            <td><code>30s</code></td>
            <td>Maximum duration for writing the response</td>
          </tr>
          <tr>
            <td><code>server.max_header_bytes</code></td>
            <td>int</td>
            <td><code>1048576</code></td>
            <td>Maximum request header size in bytes</td>
          </tr>
          <tr>
            <td><code>auth.jwt_secret</code></td>
            <td>string</td>
            <td><em>required</em></td>
            <td>Secret key for JWT signing (min 32 chars in production)</td>
          </tr>
          <tr>
            <td><code>auth.jwt_algorithm</code></td>
            <td>string</td>
            <td><code>HS256</code></td>
            <td>JWT signing algorithm: HS256, HS384, HS512, RS256</td>
          </tr>
          <tr>
            <td><code>auth.session_ttl</code></td>
            <td>duration</td>
            <td><code>24h</code></td>
            <td>Session token expiration</td>
          </tr>
          <tr>
            <td><code>auth.refresh_ttl</code></td>
            <td>duration</td>
            <td><code>720h</code></td>
            <td>Refresh token expiration (30 days)</td>
          </tr>
          <tr>
            <td><code>auth.api_keys.rate_limit</code></td>
            <td>int</td>
            <td><code>100</code></td>
            <td>API key rate limit per minute</td>
          </tr>
          <tr>
            <td><code>database.driver</code></td>
            <td>string</td>
            <td><code>sqlite</code></td>
            <td>Database driver: <code>sqlite</code> or <code>postgres</code></td>
          </tr>
          <tr>
            <td><code>database.path</code></td>
            <td>string</td>
            <td><code>/var/lib/nidus/data.db</code></td>
            <td>SQLite database file path</td>
          </tr>
          <tr>
            <td><code>database.dsn</code></td>
            <td>string</td>
            <td><code>""</code></td>
            <td>PostgreSQL connection string</td>
          </tr>
          <tr>
            <td><code>redis.url</code></td>
            <td>string</td>
            <td><code>redis://localhost:6379</code></td>
            <td>Redis connection URL</td>
          </tr>
          <tr>
            <td><code>redis.pool_size</code></td>
            <td>int</td>
            <td><code>10</code></td>
            <td>Redis connection pool size</td>
          </tr>
          <tr>
            <td><code>webhook.secret</code></td>
            <td>string</td>
            <td><code>""</code></td>
            <td>GitHub webhook secret (required for auto-deploy)</td>
          </tr>
          <tr>
            <td><code>webhook.allowed_ips</code></td>
            <td>[]string</td>
            <td><code>[]</code></td>
            <td>CIDR ranges allowed to send webhooks</td>
          </tr>
          <tr>
            <td><code>cors.allowed_origins</code></td>
            <td>[]string</td>
            <td><code>[]</code></td>
            <td>Allowed CORS origins</td>
          </tr>
        </tbody>
      </table>

      <h3>Proxy (<code>proxy.toml</code>)</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>proxy.host</code></td>
            <td>string</td>
            <td><code>0.0.0.0</code></td>
            <td>Proxy bind address</td>
          </tr>
          <tr>
            <td><code>proxy.port</code></td>
            <td>int</td>
            <td><code>3080</code></td>
            <td>Proxy HTTP port</td>
          </tr>
          <tr>
            <td><code>proxy.tls.enabled</code></td>
            <td>bool</td>
            <td><code>false</code></td>
            <td>Enable TLS termination</td>
          </tr>
          <tr>
            <td><code>proxy.tls.acme.enabled</code></td>
            <td>bool</td>
            <td><code>false</code></td>
            <td>Enable Let's Encrypt automatic certificates</td>
          </tr>
          <tr>
            <td><code>proxy.tls.acme.email</code></td>
            <td>string</td>
            <td><code>""</code></td>
            <td>Email for Let's Encrypt registration</td>
          </tr>
          <tr>
            <td><code>proxy.rate_limit.requests</code></td>
            <td>int</td>
            <td><code>1000</code></td>
            <td>Max requests per rate limit window</td>
          </tr>
          <tr>
            <td><code>proxy.rate_limit.window</code></td>
            <td>duration</td>
            <td><code>1s</code></td>
            <td>Rate limit window duration</td>
          </tr>
          <tr>
            <td><code>proxy.rate_limit.distributed</code></td>
            <td>bool</td>
            <td><code>false</code></td>
            <td>Use Redis for distributed rate limiting</td>
          </tr>
          <tr>
            <td><code>proxy.timeouts.read</code></td>
            <td>duration</td>
            <td><code>30s</code></td>
            <td>Read timeout for upstream connections</td>
          </tr>
          <tr>
            <td><code>proxy.timeouts.write</code></td>
            <td>duration</td>
            <td><code>30s</code></td>
            <td>Write timeout for upstream connections</td>
          </tr>
          <tr>
            <td><code>proxy.timeouts.idle</code></td>
            <td>duration</td>
            <td><code>60s</code></td>
            <td>Idle keep-alive timeout</td>
          </tr>
          <tr>
            <td><code>proxy.limits.max_connections</code></td>
            <td>int</td>
            <td><code>10000</code></td>
            <td>Maximum concurrent connections</td>
          </tr>
          <tr>
            <td><code>proxy.limits.max_request_size</code></td>
            <td>string</td>
            <td><code>50MB</code></td>
            <td>Maximum request body size</td>
          </tr>
          <tr>
            <td><code>proxy.upstream.health_check_interval</code></td>
            <td>duration</td>
            <td><code>10s</code></td>
            <td>Health check polling interval</td>
          </tr>
          <tr>
            <td><code>proxy.websocket.enabled</code></td>
            <td>bool</td>
            <td><code>true</code></td>
            <td>Enable WebSocket proxying</td>
          </tr>
        </tbody>
      </table>

      <h3>Worker (<code>worker.toml</code>)</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>worker.concurrency</code></td>
            <td>int</td>
            <td><code>4</code></td>
            <td>Goroutine pool size for parallel builds</td>
          </tr>
          <tr>
            <td><code>worker.poll_interval</code></td>
            <td>duration</td>
            <td><code>1s</code></td>
            <td>Job queue polling interval</td>
          </tr>
          <tr>
            <td><code>worker.max_retries</code></td>
            <td>int</td>
            <td><code>3</code></td>
            <td>Build retry count on failure</td>
          </tr>
          <tr>
            <td><code>worker.build.timeout</code></td>
            <td>duration</td>
            <td><code>10m</code></td>
            <td>Maximum build duration per deploy</td>
          </tr>
          <tr>
            <td><code>worker.build.buildkit_enabled</code></td>
            <td>bool</td>
            <td><code>true</code></td>
            <td>Use Docker BuildKit for builds</td>
          </tr>
          <tr>
            <td><code>worker.build.max_image_size</code></td>
            <td>string</td>
            <td><code>2GB</code></td>
            <td>Reject images exceeding this size</td>
          </tr>
          <tr>
            <td><code>worker.container.memory_limit</code></td>
            <td>string</td>
            <td><code>512MB</code></td>
            <td>Default per-container memory limit</td>
          </tr>
          <tr>
            <td><code>worker.container.cpu_quota</code></td>
            <td>int</td>
            <td><code>200000</code></td>
            <td>CPU CFS quota (100000 = 1 core)</td>
          </tr>
          <tr>
            <td><code>worker.deploy.strategy</code></td>
            <td>string</td>
            <td><code>rolling</code></td>
            <td>Deploy strategy: rolling, bluegreen, recreate</td>
          </tr>
          <tr>
            <td><code>worker.deploy.health_check_timeout</code></td>
            <td>duration</td>
            <td><code>30s</code></td>
            <td>Health check timeout for new deployments</td>
          </tr>
          <tr>
            <td><code>worker.deploy.drain_timeout</code></td>
            <td>duration</td>
            <td><code>30s</code></td>
            <td>Grace period for old connections to close</td>
          </tr>
          <tr>
            <td><code>worker.cleanup.enabled</code></td>
            <td>bool</td>
            <td><code>true</code></td>
            <td>Enable automatic image cleanup</td>
          </tr>
          <tr>
            <td><code>worker.cleanup.interval</code></td>
            <td>duration</td>
            <td><code>1h</code></td>
            <td>Cleanup cycle interval</td>
          </tr>
          <tr>
            <td><code>worker.cleanup.keep_images</code></td>
            <td>int</td>
            <td><code>5</code></td>
            <td>Number of images to retain per project</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
