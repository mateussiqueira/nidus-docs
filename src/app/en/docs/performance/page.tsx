import CodeBlock from "@/components/CodeBlock";

export default function PerformancePage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-perf">Performance</span>{" "}
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>
      </div>

      <h1>Performance Optimization</h1>
      <p>
        Nidus is built to run on cheap VPS instances without sacrificing
        throughput or reliability. The Go and Rust stack gives us a baseline
        that is already 3-5x more resource-efficient than Node.js or PHP
        alternatives, but the real gains come from tuning each component to
        match your specific workload. This guide covers every optimization
        path available.
      </p>

      <h2>Why Performance Matters for Self-Hosted</h2>
      <p>
        When you use a managed platform like Vercel or Netlify, performance
        is someone else's problem. You pay a premium and they handle the
        infrastructure. With a self-hosted platform like Nidus, you are the
        infrastructure team. Every megabyte of RAM and every millisecond of
        latency comes out of your budget and your users' experience.
      </p>
      <p>
        The difference between a well-tuned Nidus instance and a default
        installation can be dramatic. On the same $5 VPS, tuning can mean
        the difference between running 3 applications and running 10. It can
        mean the difference between a 500ms deploy and a 5-second deploy.
        And it can mean the difference between a proxy that handles 10K
        requests per second and one that handles 50K.
      </p>
      <p>
        A well-optimized Nidus stack on a $5 Hetzner CX11 (1 vCPU, 1GB RAM)
        can comfortably run 8-10 small to medium applications, handle 15K
        requests per second through the proxy, and complete a cached
        deployment in under 4 seconds. A default installation on the same
        hardware handles 5-6 applications, 8K requests per second, and
        deploys in 8-10 seconds. The optimizations in this guide bridge
        that gap.
      </p>

      <h2>Proxy Tuning</h2>
      <p>
        The Rust proxy is the highest-throughput component and the one that
        benefits most from tuning. Every request to every application passes
        through it, so small improvements here multiply across your entire
        infrastructure.
      </p>

      <h3>Rate Limiting</h3>
      <p>
        Rate limiting prevents a single noisy application from consuming all
        proxy resources. Configure generous global limits and tighter
        per-application limits. Distributed rate limiting requires Redis
        but is essential when running multiple proxy instances.
      </p>
      <CodeBlock
        code={`# proxy.toml — Rate limit tuning for high throughput
[proxy.rate_limit]
requests = 2000            # Higher default for modern hardware
window = "1s"
burst = 100                # Allow short spikes
distributed = true         # Required for multi-instance setups
block_duration = "30s"     # Shorter block = less impact on legitimate traffic`}
        language="toml"
        filename="proxy.toml"
      />

      <h3>Connection Pools and Keep-Alive</h3>
      <p>
        HTTP keep-alive lets the proxy reuse connections to your application
        containers instead of opening a new TCP connection for every request.
        Opening a TCP connection costs a round trip (typically 0.5-2ms) plus
        TLS negotiation (another 1-3ms). With keep-alive, those costs are
        paid once and amortized over hundreds of requests.
      </p>
      <CodeBlock
        code={`# proxy.toml — Connection pool optimization
[proxy.timeouts]
idle = "120s"              # Longer idle = fewer reconnections
read = "30s"
write = "30s"

[proxy.upstream]
max_conns_per_host = 100   # Max concurrent connections to each app
max_idle_conns_per_host = 25  # Keep 25 idle connections warm
idle_conn_timeout = "90s"  # Close idle connections after 90s
health_check_interval = "5s"  # Faster health checks = faster failure detection`}
        language="toml"
        filename="proxy.toml"
      />

      <h3>TLS Optimization</h3>
      <p>
        TLS handshakes are expensive. Every new connection to your proxy
        requires a full TLS handshake unless you implement session resumption
        or terminate TLS at a CDN layer (like Cloudflare). Within your
        internal network, consider disabling TLS between the proxy and
        application containers since they communicate over a loopback or
        private interface.
      </p>
      <CodeBlock
        code={`# proxy.toml — TLS performance settings
[proxy.tls]
enabled = true
min_version = "1.2"        # 1.3 is faster but requires client support
prefer_server_cipher = true

# Fast cipher suites (prioritize ChaCha20 on mobile, AES on desktop)
cipher_suites = [
  "TLS_CHACHA20_POLY1305_SHA256",  # Fast on ARM (mobile, Raspberry Pi)
  "TLS_AES_128_GCM_SHA256",        # Fast with AES-NI (x86_64)
  "TLS_AES_256_GCM_SHA384"         # Slower but stronger
]

# Session resumption (avoid full handshake on repeat connections)
session_tickets = true
session_cache_size = 10000`}
        language="toml"
        filename="proxy.toml"
      />

      <h3>Buffer Sizing</h3>
      <p>
        Buffer sizes affect memory usage per connection. Large buffers mean
        fewer system calls but more memory. For APIs that serve small JSON
        payloads (under 10KB), reduce buffer sizes. For file-serving
        applications or large responses, increase them.
      </p>
      <CodeBlock
        code={`# proxy.toml — Buffer tuning by workload type

# For API microservices (small JSON payloads):
[proxy.buffers]
read_buffer = 4096          # 4KB — enough for most API requests
write_buffer = 8192         # 8KB — typical JSON response size
max_buffer_pool = 2000      # Fewer buffers = less memory

# For media/file-serving apps:
# [proxy.buffers]
# read_buffer = 32768       # 32KB
# write_buffer = 65536      # 64KB
# max_buffer_pool = 500     # Fewer but larger buffers`}
        language="toml"
        filename="proxy.toml"
      />

      <h2>Worker Optimization</h2>
      <p>
        The worker runs Docker builds, which are the most resource-intensive
        operation in Nidus. Optimizing the worker directly reduces deploy
        times and improves system responsiveness during builds.
      </p>

      <h3>Goroutine Pool Sizing</h3>
      <p>
        The worker uses a goroutine pool to process multiple builds
        concurrently. Setting the pool size to <code>NumCPU</code> gives
        good throughput for most workloads. Going higher than
        <code>NumCPU * 2</code> causes diminishing returns because Docker
        builds are already I/O-bound and additional goroutines just contend
        for the same disk and network resources.
      </p>
      <CodeBlock
        code={`# worker.toml — Concurrency tuning
[worker]
# General rule: start with NumCPU, max at NumCPU * 2
# 2-core VPS:  concurrency = 2
# 4-core VPS:  concurrency = 4
# 8-core VPS:  concurrency = 8
concurrency = 4

poll_interval = "500ms"    # Faster polling = less queue delay
max_retries = 2            # Fewer retries = less wasted resources`}
        language="toml"
        filename="worker.toml"
      />

      <h3>Build Cache Optimization</h3>
      <p>
        The single biggest performance win for deployments is effective build
        caching. When BuildKit caching is configured correctly, incremental
        deploys (same code, new environment variable) complete in 3-4 seconds
        instead of 30-60 seconds. The cache stores intermediate layers so
        that unchanged layers are reused across builds.
      </p>
      <CodeBlock
        code={`# worker.toml — Build cache settings for maximum reuse
[worker.build]
buildkit_enabled = true    # Must be true for caching

# Multi-level caching strategy:
# 1. Local cache for speed (SSD/NVMe)
# 2. Registry cache for persistence (survives worker restart)
cache_from = [
  "type=local,src=/var/lib/nidus/buildkit-cache",
  "type=registry,ref=ghcr.io/myorg/nidus-cache:latest"
]
cache_to = [
  "type=local,dest=/var/lib/nidus/buildkit-cache,mode=max",
  "type=registry,ref=ghcr.io/myorg/nidus-cache:latest,mode=max"
]

cache_size = "20GB"        # Generous cache on large disks
compress_logs = true       # Minimal CPU impact, big disk savings

# Optimized Dockerfile structure for caching:
# 1. Copy package files first (rarely changes)
# 2. Run install (cached until package.json changes)
# 3. Copy source code (changes every deploy)
# 4. Run build (cached until source changes)
# This maximizes layer reuse`}
        language="toml"
        filename="worker.toml"
      />

      <h3>Container Resource Limits</h3>
      <p>
        Setting realistic resource limits for application containers prevents
        a single misbehaving app from consuming all available RAM or CPU.
        This is especially important on small VPS where resources are tight.
      </p>
      <CodeBlock
        code={`# worker.toml — Per-container resource limits
[worker.container]
memory_limit = "256MB"              # Reduce from 512MB, most apps need less
cpu_shares = 512                    # Lower = less CPU contention
cpu_quota = 100000                  # 1 core max per container
pids_limit = 256                    # Limit fork bombs
oom_kill_disable = false            # Allow OOM killer (better than hang)

# Large apps can override per-deploy:
# nidus deploy --project heavy-app --memory 512M --cpu 1.5`}
        language="toml"
        filename="worker.toml"
      />

      <h3>Image Cleanup and Pruning</h3>
      <p>
        Docker images accumulate fast. A typical Next.js app produces a
        150-300MB image. If you deploy 10 times a day, that is 1.5-3GB of
        images per app per day. Without cleanup, you will run out of disk
        space within a week.
      </p>
      <CodeBlock
        code={`# worker.toml — Aggressive cleanup for small disks
[worker.cleanup]
enabled = true
interval = "15m"          # Every 15 minutes (disk pressure)
keep_images = 3           # Keep only last 3 versions per project
prune_dangling = true
prune_cache = true
disk_threshold = "70%"    # Start emergency cleanup at 70% disk`}
        language="toml"
        filename="worker.toml"
      />

      <h2>Resource Limits with CGroups</h2>
      <p>
        When running Nidus directly on a Linux host (not in Docker), you can
        use cgroups to enforce resource limits at the system level. This
        provides stronger isolation than Docker's built-in limits and
        prevents any single component from starving the others.
      </p>
      <CodeBlock
        code={`# systemd service file with cgroup resource control
# /etc/systemd/system/nidus-worker.service
[Unit]
Description=Nidus Worker
After=docker.service redis.service

[Service]
Type=simple
User=nidus
ExecStart=/usr/local/bin/nidus-worker --config /etc/nidus/worker.toml
Restart=always
RestartSec=5

# CPU
CPUAccounting=yes
CPUQuota=150%               # Limit to 1.5 cores
CPUWeight=500               # Lower weight than server (default 100)

# Memory
MemoryAccounting=yes
MemoryMax=768M              # Hard memory limit
MemoryHigh=512M             # Soft limit (starts reclaiming above)
MemorySwapMax=256M          # Limit swap usage

# IO
IOAccounting=yes
IOReadBandwidthMax="/var/lib/docker 50M"
IOWriteBandwidthMax="/var/lib/docker 50M"

# Processes
TasksMax=200

[Install]
WantedBy=multi-user.target`}
        language="bash"
        filename="nidus-worker.service"
      />

      <h3>Docker Daemon Resource Constraints</h3>
      <p>
        The Docker daemon itself can consume significant resources during
        parallel builds. Limit Docker's resource usage at the daemon level
        to ensure the system remains responsive during heavy build activity.
      </p>
      <CodeBlock
        code={`# /etc/docker/daemon.json — Docker daemon resource limits
{
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 3,
  "max-download-attempts": 3,
  "default-shm-size": "64M",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.size=10GB"
  ],
  "experimental": true,
  "metrics-addr": "127.0.0.1:9323"
}

# After changes:
sudo systemctl restart docker`}
        language="json"
        filename="daemon.json"
      />

      <h2>Monitoring Performance</h2>
      <p>
        You cannot optimize what you cannot measure. Nidus exposes Prometheus
        metrics on every component, and the CLI gives you real-time status at
        a glance. For long-term performance tracking, ship metrics to
        Prometheus and visualize them in Grafana.
      </p>

      <h3>Built-in Metrics</h3>
      <p>
        Each component exposes a <code>/metrics</code> HTTP endpoint in
        Prometheus text format. The server exposes metrics about deploys,
        projects, and API requests. The proxy exposes metrics about
        connections, throughput, and latency. The worker exposes metrics
        about builds, queues, and resource usage.
      </p>
      <CodeBlock
        code={`# Query server metrics
curl -s http://localhost:3001/metrics | grep -E "^(nidus_|go_)" | head -20

# Key metrics to watch:
# nidus_deploy_duration_seconds     — Deploy time histogram
# nidus_deploy_total                — Deploy counter by status
# nidus_proxy_requests_total        — Proxy request counter by status
# nidus_proxy_request_duration_ms   — Proxy latency histogram
# nidus_proxy_connections_current   — Current active connections
# nidus_worker_build_duration_seconds — Build time histogram
# nidus_worker_queue_depth          — Pending jobs in queue
# nidus_worker_images_pruned_total  — Cleanup effectiveness
# go_memstats_alloc_bytes           — Go memory usage`}
        language="bash"
        filename="terminal"
      />

      <h3>Prometheus Configuration</h3>
      <CodeBlock
        code={`# prometheus.yml — Scrape Nidus metrics
scrape_configs:
  - job_name: "nidus-server"
    static_configs:
      - targets: ["localhost:3001"]

  - job_name: "nidus-proxy"
    static_configs:
      - targets: ["localhost:3080"]

  - job_name: "nidus-worker"
    static_configs:
      - targets: ["localhost:4001"]

  - job_name: "docker"
    static_configs:
      - targets: ["localhost:9323"]`}
        language="yaml"
        filename="prometheus.yml"
      />

      <h3>Useful Grafana Queries</h3>
      <CodeBlock
        code={`# Deploy duration (p95 over 24h)
histogram_quantile(0.95,
  sum(rate(nidus_deploy_duration_seconds_bucket[24h])) by (le)
)

# Proxy request rate by status code
sum(rate(nidus_proxy_requests_total[5m])) by (status)

# Proxy p99 latency
histogram_quantile(0.99,
  sum(rate(nidus_proxy_request_duration_ms_bucket[5m])) by (le)
)

# Current build queue depth
nidus_worker_queue_depth

# Disk space forecast (linear regression)
predict_linear(node_filesystem_free_bytes{mountpoint="/var/lib/docker"}[6h], 86400)

# Memory usage by component
go_memstats_alloc_bytes{job="nidus-server"}
go_memstats_alloc_bytes{job="nidus-worker"}

# Rate limited requests
rate(nidus_proxy_requests_total{status="429"}[5m])`}
        language="promql"
        filename="grafana-queries"
      />

      <h2>Diagnostic Commands</h2>
      <p>
        Before making tuning changes, establish a baseline. Run these
        diagnostic commands to measure current performance, then run
        them again after each change to measure the impact.
      </p>

      <h3>System Baseline</h3>
      <CodeBlock
        code={`# Resource overview
nidus status

# Detailed per-component resource usage
nidus status --output json | jq

# Check disk usage (Docker + build cache)
df -h /
du -sh /var/lib/docker
du -sh /var/lib/nidus

# Docker daemon resource usage
docker info --format '{{.DockerRootDir}}: {{.DriverStatus}}'
docker system df

# Network throughput baseline
# Install: brew install wrk  (macOS) or apt install wrk (Linux)
wrk -t4 -c100 -d10s http://localhost:3080/health

# Connection count
ss -s | head -10`}
        language="bash"
        filename="terminal"
      />

      <h3>Proxy Diagnostics</h3>
      <CodeBlock
        code={`# Proxy connection metrics
curl -s http://localhost:3001/metrics | grep nidus_proxy

# Test direct proxy throughput (bypass server)
wrk -t12 -c400 -d30s http://localhost:3080/health

# Measure TLS handshake time
openssl s_time -connect localhost:443 -www /health 2>&1 | grep -E "^(real|user|sys)"

# Check active connections
curl -s http://localhost:3001/metrics | grep nidus_proxy_connections_current

# Latency distribution
curl -s http://localhost:3001/metrics | grep nidus_proxy_request_duration

# Test WebSocket performance
wscat -c wss://localhost/ws --no-check && echo "WebSocket OK"`}
        language="bash"
        filename="terminal"
      />

      <h3>Deploy Diagnostics</h3>
      <CodeBlock
        code={`# Measure cold deploy time
time nidus deploy --project test-app --no-cache

# Measure warm deploy time (after first deploy with cache)
time nidus deploy --project test-app

# Build log analysis (check slow steps)
nidus logs test-app --service worker --level info

# Docker build performance
docker system events --since 5m --filter type=image | head -20

# Image size analysis
docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}" | sort -k3 -h

# Container startup time
time docker run --rm --name test nginx echo "ready"`}
        language="bash"
        filename="terminal"
      />

      <h2>Configuration Reference for Performance</h2>
      <p>
        Quick-reference table of all performance-related settings. Default
        values are tuned for general workloads. Adjust based on your specific
        hardware and usage patterns.
      </p>
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>Setting</th>
            <th>Default</th>
            <th>Optimized</th>
            <th>Benefit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Proxy</td>
            <td><code>proxy.timeouts.idle</code></td>
            <td>60s</td>
            <td>120s</td>
            <td>Fewer TLS handshakes</td>
          </tr>
          <tr>
            <td>Proxy</td>
            <td><code>proxy.upstream.max_idle_conns_per_host</code></td>
            <td>10</td>
            <td>25</td>
            <td>Warm connection pool</td>
          </tr>
          <tr>
            <td>Proxy</td>
            <td><code>proxy.upstream.health_check_interval</code></td>
            <td>10s</td>
            <td>5s</td>
            <td>Faster failure detection</td>
          </tr>
          <tr>
            <td>Proxy</td>
            <td><code>proxy.buffers.read_buffer</code></td>
            <td>8192</td>
            <td>4096</td>
            <td>Lower memory per connection</td>
          </tr>
          <tr>
            <td>Proxy</td>
            <td><code>proxy.tls.session_tickets</code></td>
            <td>false</td>
            <td>true</td>
            <td>Faster repeat connections</td>
          </tr>
          <tr>
            <td>Proxy</td>
            <td><code>proxy.rate_limit.burst</code></td>
            <td>50</td>
            <td>100</td>
            <td>Handle traffic spikes</td>
          </tr>
          <tr>
            <td>Worker</td>
            <td><code>worker.concurrency</code></td>
            <td>4</td>
            <td>NumCPU</td>
            <td>Parallel build throughput</td>
          </tr>
          <tr>
            <td>Worker</td>
            <td><code>worker.build.buildkit_enabled</code></td>
            <td>true</td>
            <td>true</td>
            <td>Layer caching (always on)</td>
          </tr>
          <tr>
            <td>Worker</td>
            <td><code>worker.build.cache_size</code></td>
            <td>10GB</td>
            <td>20GB</td>
            <td>Larger cache = more hits</td>
          </tr>
          <tr>
            <td>Worker</td>
            <td><code>worker.container.memory_limit</code></td>
            <td>512MB</td>
            <td>256MB</td>
            <td>Fit more apps on small VPS</td>
          </tr>
          <tr>
            <td>Worker</td>
            <td><code>worker.cleanup.keep_images</code></td>
            <td>5</td>
            <td>3</td>
            <td>Faster disk reclamation</td>
          </tr>
          <tr>
            <td>Worker</td>
            <td><code>worker.cleanup.interval</code></td>
            <td>1h</td>
            <td>15m</td>
            <td>Aggressive space recovery</td>
          </tr>
          <tr>
            <td>Worker</td>
            <td><code>worker.deploy.drain_timeout</code></td>
            <td>30s</td>
            <td>15s</td>
            <td>Faster deployments</td>
          </tr>
          <tr>
            <td>Worker</td>
            <td><code>worker.poll_interval</code></td>
            <td>1s</td>
            <td>500ms</td>
            <td>Lower queue latency</td>
          </tr>
          <tr>
            <td>Docker</td>
            <td><code>max-concurrent-downloads</code></td>
            <td>3</td>
            <td>3</td>
            <td>Keep default (I/O bound)</td>
          </tr>
          <tr>
            <td>Docker</td>
            <td><code>storage-driver</code></td>
            <td>overlay2</td>
            <td>overlay2</td>
            <td>Best performance for Linux</td>
          </tr>
          <tr>
            <td>Server</td>
            <td><code>redis.pool_size</code></td>
            <td>10</td>
            <td>20</td>
            <td>Handle concurrent deploys</td>
          </tr>
        </tbody>
      </table>

      <h2>Benchmarking Your Setup</h2>
      <p>
        After applying performance optimizations, benchmark your setup to
        verify the improvements. Here is a structured benchmarking approach:
      </p>
      <ol>
        <li>
          <strong>Establish baseline</strong> — run <code>nidus status</code>
          and <code>docker stats</code> with no load
        </li>
        <li>
          <strong>Proxy throughput</strong> — use <code>wrk</code> or
          <code>hey</code> to test the proxy with increasing concurrency
        </li>
        <li>
          <strong>Deploy speed</strong> — time three cold deploys and three
          warm deploys, take the median
        </li>
        <li>
          <strong>Sustained load</strong> — run 10 concurrent deploys and
          measure queue wait time
        </li>
        <li>
          <strong>Memory stability</strong> — monitor memory for 1 hour under
          sustained proxy load, check for leaks
        </li>
      </ol>
      <CodeBlock
        code={`# Full benchmark script
#!/bin/bash
# save as bench.sh && chmod +x bench.sh

echo "=== Nidus Performance Benchmark ==="
echo "Date: $(date)"
echo ""

echo "--- System Info ---"
echo "CPU: $(nproc) cores"
free -h | grep Mem
echo ""

echo "--- Baseline Status ---"
nidus status --output json | jq '{services: .services, apps: .apps_count}'
echo ""

echo "--- Proxy Throughput (100 conn, 10s) ---"
wrk -t4 -c100 -d10s http://localhost:3080/ 2>&1
echo ""

echo "--- Cold Deploy ---"
time nidus deploy --project benchmark --no-cache 2>&1
echo ""

echo "--- Warm Deploy ---"
time nidus deploy --project benchmark 2>&1
echo ""

echo "--- Container Memory ---"
docker stats --no-stream --format "table {{.Name}}\\t{{.MemUsage}}\\t{{.CPUPerc}}"`}
        language="bash"
        filename="bench.sh"
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>
          <strong>Tune incrementally</strong> — change one setting at a
          time and measure the impact. Changing everything at once makes it
          impossible to know what worked.
        </li>
        <li>
          <strong>Cache aggressively</strong> — the build cache is the single
          biggest performance lever for deploy speed. Configure multi-level
          caching (local + registry) for maximum cache hit rate.
        </li>
        <li>
          <strong>Set resource limits</strong> — without limits, a single
          leaky application can crash your entire Nidus instance. Set
          conservative per-container defaults and override per-deploy for
          applications that need more.
        </li>
        <li>
          <strong>Monitor everything</strong> — deploy times, proxy latency,
          memory usage, disk space, and queue depth. If you are not measuring
          it, you cannot optimize it.
        </li>
        <li>
          <strong>The hardware matters</strong> — an NVMe SSD is worth more
          for deploy performance than extra RAM. BuildKit caching is
          I/O-bound, and faster storage means faster layer reuse.
        </li>
      </ul>

      <blockquote>
        <strong>Bottom line:</strong> A well-tuned Nidus instance on a $5 VPS
        can outperform a default installation on a $20 VPS. The optimizations
        in this guide are free — they cost nothing but configuration file
        edits — and they can double or triple your effective capacity.
      </blockquote>
    </div>
  );
}
