import CodeBlock from "@/components/CodeBlock";

export default function CLIPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-cli">CLI</span>
      </div>

      <h1>CLI Reference</h1>
      <p>
        The Nidus CLI is a single statically-linked Go binary with zero runtime
        dependencies. It communicates with the Nidus server over gRPC or HTTP,
        and works offline for local configuration management.
      </p>

      <h2>Installation</h2>

      <h3>npm (via GitHub Releases)</h3>
      <p>
        The CLI is distributed as an npm package that downloads the correct
        binary for your platform on install. No Go toolchain required.
      </p>
      <CodeBlock
        code={`npm install -g nidus-cli

# Verify installation
nidus version
# Output: nidus v1.2.0 (linux/amd64, commit 7a3f2b1e)`}
        language="bash"
        filename="terminal"
      />

      <h3>Direct Binary Download</h3>
      <p>
        Download the precompiled binary for your platform and architecture from
        the releases page.
      </p>
      <CodeBlock
        code={`# Linux (amd64)
curl -sL https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-linux-amd64.tar.gz \\
  | sudo tar xz -C /usr/local/bin

# Linux (arm64) — Raspberry Pi, Oracle ARM, Graviton
curl -sL https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-linux-arm64.tar.gz \\
  | sudo tar xz -C /usr/local/bin

# macOS (Apple Silicon)
curl -sL https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-darwin-arm64.tar.gz \\
  | sudo tar xz -C /usr/local/bin

# macOS (Intel)
curl -sL https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-darwin-amd64.tar.gz \\
  | sudo tar xz -C /usr/local/bin`}
        language="bash"
        filename="terminal"
      />

      <h3>From Source (requires Go 1.22+)</h3>
      <p>
        If you have the Go toolchain installed, you can build directly from
        source. The binary is placed in <code>$GOPATH/bin</code> or
        <code>$GOBIN</code>.
      </p>
      <CodeBlock
        code={`go install github.com/mateussiqueira/nidus/cmd/nidus@latest

# Binary location
which nidus
# Output: /home/user/go/bin/nidus

# Verify with version info
nidus version --full
# Output: nidus v1.2.0 (go1.22.5, commit 7a3f2b1e, built 2026-06-20T10:30:00Z)`}
        language="bash"
        filename="terminal"
      />

      <h3>Docker</h3>
      <p>
        Run the CLI as an ephemeral container. Useful for CI/CD pipelines where
        you don't want to install the binary directly.
      </p>
      <CodeBlock
        code={`# Pull the CLI image
docker pull ghcr.io/mateussiqueira/nidus-cli:latest

# Run a command
docker run --rm ghcr.io/mateussiqueira/nidus-cli:latest \\
  nidus status --url https://nidus.example.com --token $NIDUS_TOKEN

# Mount a config file for authenticated operations
docker run --rm \\
  -v $HOME/.nidus:/root/.nidus \\
  ghcr.io/mateussiqueira/nidus-cli:latest \\
  nidus deploy --project my-app`}
        language="bash"
        filename="terminal"
      />

      <h2>Authentication</h2>
      <p>
        The CLI needs a server URL and an API token to operate. You can provide
        these three ways: command-line flags, environment variables, or the
        config file at <code>~/.nidus/config.yaml</code>.
      </p>

      <h3>Login Command</h3>
      <p>
        The <code>nidus login</code> command walks you through authentication
        interactively and saves credentials to the config file. This is the
        recommended approach for local development.
      </p>
      <CodeBlock
        code={`# Interactive login (prompts for URL and token)
nidus login

# Non-interactive login (for scripts and CI)
nidus login --url https://nidus.example.com --token nid_live_abc123def456

# Login with an API key instead of a personal token
nidus login --url https://nidus.example.com --api-key nid_key_xyz789

# Verify the session
nidus whoami
# Output:
#   User:          matthew@example.com
#   Server:        nidus.example.com
#   Token Prefix:  nid_live_abc...
#   Scopes:        deploy:read, deploy:write, projects:read, projects:write
#   Expires:       2026-07-27T10:00:00Z (30d from now)`}
        language="bash"
        filename="terminal"
      />

      <h3>Config File</h3>
      <p>
        The CLI stores connection details in <code>~/.nidus/config.yaml</code>.
        You can edit this file directly or create it for automation setups.
      </p>
      <CodeBlock
        code={`# ~/.nidus/config.yaml
server:
  url: https://nidus.example.com
  token: nid_live_abc123def456
  timeout: 30s
  insecure: false  # set to true for self-signed certs in dev

defaults:
  project: my-app
  branch: main
  output-format: table

aliases:
  prod: --url https://nidus-prod.example.com --token nid_live_prod789
  dev: --url https://nidus-dev.example.com --token nid_live_dev123`}
        language="yaml"
        filename="config.yaml"
      />

      <h3>Environment Variables</h3>
      <p>
        All authentication parameters can be set via environment variables,
        useful for CI/CD systems like GitHub Actions, GitLab CI, or Jenkins.
      </p>
      <CodeBlock
        code={`export NIDUS_URL=https://nidus.example.com
export NIDUS_TOKEN=nid_live_abc123def456
export NIDUS_OUTPUT=json
export NIDUS_TIMEOUT=60s

# Now run commands without flags
nidus status
nidus deploy --project my-app`}
        language="bash"
        filename="terminal"
      />

      <h2>nidus deploy</h2>
      <p>
        Deploy an application from the current directory or a specified path.
        Nidus detects the framework automatically, builds a Docker image, and
        starts the container with zero-downtime rolling updates.
      </p>

      <h3>Basic Usage</h3>
      <CodeBlock
        code={`# Deploy the current directory (uses .nidus.yaml or auto-detects)
nidus deploy

# Deploy a specific project
nidus deploy --project my-app

# Deploy from a specific directory
nidus deploy --project my-app --dir /home/user/projects/my-app

# Deploy with a custom branch
nidus deploy --project my-app --branch staging`}
        language="bash"
        filename="terminal"
      />

      <h3>Advanced Options</h3>
      <CodeBlock
        code={`# Deploy with explicit build command and output directory
nidus deploy \\
  --project my-app \\
  --build-command "npm run build:production" \\
  --output-dir "dist" \\
  --install-command "npm ci --only=production"

# Set environment variables for the build and runtime
nidus deploy \\
  --project my-app \\
  --env "NODE_ENV=production" \\
  --env "API_URL=https://api.example.com" \\
  --env "SENTRY_DSN=https://sentry.io/..." \\
  --env-file .env.production

# Set resource limits for the deployed container
nidus deploy \\
  --project my-app \\
  --memory 256M \\
  --cpu 0.5 \\
  --timeout 120s

# Force rebuild without cache
nidus deploy --project my-app --no-cache --force`}
        language="bash"
        filename="terminal"
      />

      <h3>Realistic Deploy Output</h3>
      <CodeBlock
        code={`$ nidus deploy --project dashboard --branch main
✔️  Resolved project "dashboard"
✔️  Detected framework: Next.js (v14.2.4)
✔️  Using build command: "next build"
✔️  Found 12 environment variables (2 secrets masked)
✔️  Cloned branch "main" (commit a1b2c3d — "fix: handle timeout error")
✔️  Building Docker image...
  ✓ Step 1/12 : FROM node:20-alpine AS deps
  ✓ Step 2/12 : WORKDIR /app
  ✓ Step 3/12 : COPY package.json package-lock.json ./
  ✓ Step 4/12 : RUN npm ci --only=production
  ✓ Step 5/12 : FROM node:20-alpine AS builder
  ✓ Step 6/12 : COPY --from=deps /app/node_modules ./node_modules
  ✓ Step 7/12 : COPY . .
  ✓ Step 8/12 : RUN npm run build
  ✓ Step 9/12 : FROM node:20-alpine AS runner
  ✓ Step 10/12 : COPY --from=builder /app/.next ./.next
  ✓ Step 11/12 : COPY --from=builder /app/public ./public
  ✓ Step 12/12 : EXPOSE 3000
✔️  Build completed in 42.3s (6.3s cached)
✔️  Image size: 187MB (saved 245MB with multi-stage)
✔️  Starting container "dashboard-main-20260627-1423"
✔️  Health check passed (HTTP 200 at /api/health, 234ms)
✔️  Routing traffic to new container
✔️  Stopping previous container "dashboard-main-20260627-1251"
✔️  Deploy successful! (total: 51.7s)
➡️  URL: https://dashboard.nidus.example.com
➡️  Deploy ID: dep_a1b2c3d4e5f6`}
        language="bash"
        filename="terminal"
      />

      <h2>nidus status</h2>
      <p>
        Shows the health and resource usage of all Nidus services: the API
        server, reverse proxy, build worker, and connected databases. Use this
        as your first diagnostic command when something feels off.
      </p>
      <CodeBlock
        code={`# Quick system overview
nidus status

# Output:
# Nidus v1.2.0 — Uptime: 12d 4h 32m
#
# Service        Status      CPU     Memory    Uptime
# ───────        ──────      ───     ──────    ──────
# Server         ✅ OK       2.1%    18.2MB    12d 4h
# Proxy          ✅ OK       4.3%    12.7MB    12d 4h
# Worker         ✅ OK       0.0%    22.1MB    12d 4h
# Redis          ✅ OK       0.5%     4.2MB    12d 4h
# SQLite         ✅ OK         —      2.1MB    12d 4h
#
# Applications:  8 running (3 stopped)
# Deploys today: 14 (2 failed, 12 successful)
# Active builds: 1 queued, 0 running
# Disk usage:    4.2GB / 40GB (10.5%)

# JSON output for monitoring
nidus status --output json

# Watch mode (refreshes every 2 seconds)
nidus status --watch`}
        language="bash"
        filename="terminal"
      />

      <h3>Checking Individual Applications</h3>
      <CodeBlock
        code={`# Status of all applications
nidus status --apps

# Output:
# App            Status    URL                    Uptime    Memory
# ───            ──────    ───                    ──────    ──────
# dashboard      ✅ Up     https://dashboard...   2d 3h     48MB
# api-gateway    ✅ Up     https://api-gateway..  5d 0h     64MB
# landing        ✅ Up     https://landing.pag..  1d 12h    32MB
# blog           ❌ Down   https://blog.exampl..    —         —
# admin-panel    ⏳ Deploy  https://admin.examp..   —         —

# Detailed view for a single app
nidus status --app dashboard
# Output:
# Application: dashboard
#   Status:    ✅ Running
#   URL:       https://dashboard.nidus.example.com
#   Deploy:    dep_a1b2c3d4e5f6 (commit a1b2c3d)
#   Branch:    main
#   Container: nidus-app-dashboard (running 2d 3h)
#   Memory:    48.2MB / 256MB
#   CPU:       0.12 cores
#   Restarts:  0
#   Port:      3000 → proxy port 443`}
        language="bash"
        filename="terminal"
      />

      <h2>nidus logs</h2>
      <p>
        Stream or query logs from any deployed application, the build worker,
        or the proxy. Logs are structured JSON by default and stored with
        rotation configured in <code>/etc/nidus/server.toml</code>.
      </p>
      <CodeBlock
        code={`# Stream logs for an application (live tail)
nidus logs dashboard

# Follow mode (like tail -f)
nidus logs dashboard --follow

# Last N lines (defaults to 100)
nidus logs dashboard --lines 500

# Filter by log level
nidus logs dashboard --level error
nidus logs dashboard --level warn,error

# Filter by time range
nidus logs dashboard --since "30m"
nidus logs dashboard --since "2026-06-26T10:00:00Z" --until "2026-06-26T12:00:00Z"

# Search within logs
nidus logs dashboard --search "timeout"
nidus logs dashboard --search "GET /api/users" --level info

# View worker build logs instead of application logs
nidus logs dashboard --service worker
nidus logs dashboard --service worker --level debug

# Proxy access logs
nidus logs --service proxy --since "5m"
nidus logs --service proxy --status 5xx  # All 5xx errors`}
        language="bash"
        filename="terminal"
      />

      <h3>Log Output Formats</h3>
      <CodeBlock
        code={`# JSON format (default, machine-readable)
nidus logs dashboard --since "5m" --output json
# {"level":"info","time":"2026-06-27T14:30:00Z","app":"dashboard","message":"GET /api/health 200 2.3ms"}
# {"level":"warn","time":"2026-06-27T14:29:58Z","app":"dashboard","message":"Slow query detected (1.2s)","query":"SELECT * FROM users WHERE ..."}
# {"level":"error","time":"2026-06-27T14:29:45Z","app":"dashboard","message":"Connection pool exhausted","pool":"db","connections":25}

# Pretty format (human-readable, colored)
nidus logs dashboard --since "5m" --output pretty
# [14:30:00] INFO  │ GET /api/health 200 ✓ (2.3ms)
# [14:29:58] WARN  │ Slow query detected (1.2s) — SELECT * FROM users ...
# [14:29:45] ERROR │ Connection pool exhausted (db: 25/25 connections)`}
        language="bash"
        filename="terminal"
      />

      <h2>nidus rollback</h2>
      <p>
        Revert an application to a previous deployment. Rollbacks are
        instantaneous because Nidus keeps the previous Docker image and
        container configuration cached. The old container replaces the current
        one with the same zero-downtime health-check mechanism used by
        regular deploys.
      </p>
      <CodeBlock
        code={`# Rollback to the previous version
nidus rollback dashboard

# Rollback to a specific deployment ID
nidus rollback dashboard --to dep_x1y2z3w4v5u6

# Rollback to a specific version number
nidus rollback dashboard --version 7

# Rollback with confirmation bypass (for automated scripts)
nidus rollback dashboard --yes

# List recent deployments to find the target
nidus deploys list dashboard --limit 10
# Output:
# DEPLOY ID            VERSION   COMMIT    STATUS     CREATED
# dep_a1b2c3d4e5f6    12        a1b2c3d   ✅ Live    2h ago
# dep_b2c3d4e5f6a7    11        b2c3d4e   ❌ Failed  3h ago
# dep_c3d4e5f6a7b8    10        c3d4e5f   ✅ Healthy 6h ago
# dep_d4e5f6a7b8c9    9         d4e5f6a   ✅ Healthy 12h ago

# Perform the rollback
nidus rollback dashboard --to dep_c3d4e5f6a7b8

# Rollback output:
# ✔️  Resolved target: version 10 (commit c3d4e5f)
# ✔️  Image found in local cache (187MB)
# ✔️  Starting container "dashboard-main-20260627-version-10"
# ✔️  Health check passed (HTTP 200, 156ms)
# ✔️  Routing traffic to version 10
# ✔️  Stopping current container (version 12)
# ✔️  Rollback complete! (total: 8.3s)
# ⚠️  Run 'nidus rollback dashboard --to dep_a1b2c3d4e5f6' to undo this rollback`}
        language="bash"
        filename="terminal"
      />

      <h2>nidus backup</h2>
      <p>
        Create and manage full or partial backups of the Nidus state: the
        database, configuration files, TLS certificates, and stored build
        artifacts. Backups are compressed tar.gz archives with optional
        encryption.
      </p>
      <CodeBlock
        code={`# Create a full backup (database + config + certs)
nidus backup create

# Create a backup to a specific path
nidus backup create --output /backups/nidus-2026-06-27.tar.gz

# Backup with encryption (AES-256-GCM)
nidus backup create --output /backups/nidus-encrypted.tar.gz \\
  --encrypt --passphrase "your-strong-passphrase"

# Backup only specific components
nidus backup create --components db,config
nidus backup create --components certs,redis

# List existing backups
nidus backup list
# Output:
# BACKUP FILE                          SIZE      CREATED
# nidus-2026-06-27.tar.gz              42.3MB    Today 14:30
# nidus-2026-06-26.tar.gz              39.1MB    Yesterday 02:00
# nidus-2026-06-25.tar.gz              38.7MB    2 days ago 02:00

# Restore from a backup
nidus backup restore /backups/nidus-2026-06-27.tar.gz

# Restore encrypted backup
nidus backup restore /backups/nidus-encrypted.tar.gz \\
  --decrypt --passphrase "your-strong-passphrase"

# Automate with cron (daily at 2 AM)
# 0 2 * * * /usr/local/bin/nidus backup create --output /backups/nidus-\$(date +\\%Y-\\%m-\\%d).tar.gz`}
        language="bash"
        filename="terminal"
      />

      <h2>nidus domains</h2>
      <p>
        Manage custom domains and TLS certificates for your applications.
        Nidus supports Let's Encrypt automatic provisioning, custom
        certificates, and Cloudflare origin certificates.
      </p>
      <CodeBlock
        code={`# List domains for an application
nidus domains list dashboard
# Output:
# DOMAIN                          TLS     PROXY   CREATED
# dashboard.nidus.example.com     ✅      Active  2d ago
# app.customdomain.com            ✅      Active  1d ago
# staging.customdomain.com        ❌      Pending 1h ago

# Add a custom domain
nidus domains add dashboard app.customdomain.com
# Output:
# ✔️  Domain "app.customdomain.com" added to project "dashboard"
# ⚠️  Add the following DNS record:
#   Type:  CNAME
#   Name:  app
#   Value: dashboard.nidus.example.com
#   TTL:   300
# ⏳  Waiting for DNS propagation...

# Enable automatic TLS via Let's Encrypt
nidus domains tls dashboard app.customdomain.com --enable
# Output:
# ✔️  ACME challenge configured (http-01)
# ✔️  Certificate issued by Let's Encrypt
# ✔️  Auto-renewal enabled (expires: 2026-09-25)
# ⚠️  Certificate will auto-renew 30 days before expiry

# Upload a custom certificate
nidus domains tls dashboard customdomain.com \\
  --cert /path/to/fullchain.pem \\
  --key /path/to/privkey.pem

# Remove a domain
nidus domains remove dashboard staging.customdomain.com

# Check DNS propagation status
nidus domains check dashboard app.customdomain.com
# Output:
# DNS Status for "app.customdomain.com":
#   A/AAAA:   ❌ Not found
#   CNAME:    ✅ Resolves to dashboard.nidus.example.com (TTL: 300)
#   TXT:      ❌ ACME verification not started
# Overall:   ⏳ DNS partially configured`}
        language="bash"
        filename="terminal"
      />

      <h2>Additional Commands</h2>

      <h3>Environment Variables</h3>
      <CodeBlock
        code={`# List all environment variables for an application
nidus env list dashboard

# Set a single variable
nidus env set dashboard DATABASE_URL "postgresql://user:pass@host:5432/db"

# Set multiple variables at once
nidus env set dashboard \\
  REDIS_URL="redis://redis:6379" \\
  S3_BUCKET="nidus-assets" \\
  S3_REGION="us-east-1"

# Upload environment from a .env file
nidus env set dashboard --file .env.production

# Remove an environment variable
nidus env unset dashboard OLD_API_KEY

# Pull remote environment to a local .env file
nidus env pull dashboard --output .env.local`}
        language="bash"
        filename="terminal"
      />

      <h3>Secrets Management</h3>
      <p>
        Secrets are stored encrypted at rest using AES-256-GCM with a
        server-side master key. They are never exposed in logs, deploy output,
        or environment listings.
      </p>
      <CodeBlock
        code={`# Set a secret (value is never echoed back)
nidus secrets set dashboard STRIPE_KEY
# Enter secret value (input is hidden):
# ✔️  Secret "STRIPE_KEY" stored for project "dashboard"

# List secrets (values always masked)
nidus secrets list dashboard
# Output:
# NAME           CREATED       ROTATED
# STRIPE_KEY     2d ago        Never
# GITHUB_TOKEN   7d ago        3d ago
# SENTRY_DSN     14d ago       7d ago

# Delete a secret
nidus secrets unset dashboard STRIPE_KEY

# Rotate all secrets (generates new encryption key)
nidus secrets rotate --all

# Rotate a single secret
nidus secrets rotate dashboard STRIPE_KEY`}
        language="bash"
        filename="terminal"
      />

      <h2>Command Reference Table</h2>
      <p>
        Complete list of all available commands, their syntax, and a brief
        description. Run <code>nidus --help</code> or
        <code>nidus &lt;command&gt; --help</code> for full details.
      </p>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Syntax</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>login</code></td>
            <td><code>nidus login [--url] [--token] [--api-key]</code></td>
            <td>Authenticate with a Nidus server and save credentials</td>
          </tr>
          <tr>
            <td><code>logout</code></td>
            <td><code>nidus logout</code></td>
            <td>Remove stored credentials from the config file</td>
          </tr>
          <tr>
            <td><code>whoami</code></td>
            <td><code>nidus whoami</code></td>
            <td>Display current user and session information</td>
          </tr>
          <tr>
            <td><code>deploy</code></td>
            <td><code>nidus deploy [--project] [--branch] [--dir]</code></td>
            <td>Build and deploy an application with zero downtime</td>
          </tr>
          <tr>
            <td><code>deploys list</code></td>
            <td><code>nidus deploys list &lt;project&gt; [--limit]</code></td>
            <td>List deployment history for a project</td>
          </tr>
          <tr>
            <td><code>deploys watch</code></td>
            <td><code>nidus deploys watch &lt;project&gt;</code></td>
            <td>Watch a running deployment in real time</td>
          </tr>
          <tr>
            <td><code>rollback</code></td>
            <td><code>nidus rollback &lt;project&gt; [--to &lt;dep_id&gt;]</code></td>
            <td>Revert to a previous deployment instantly</td>
          </tr>
          <tr>
            <td><code>status</code></td>
            <td><code>nidus status [--app] [--watch] [--output]</code></td>
            <td>Show system health and resource usage</td>
          </tr>
          <tr>
            <td><code>logs</code></td>
            <td><code>nidus logs &lt;project&gt; [--follow] [--level] [--since]</code></td>
            <td>Stream or query application and service logs</td>
          </tr>
          <tr>
            <td><code>backup create</code></td>
            <td><code>nidus backup create [--output] [--encrypt]</code></td>
            <td>Create a compressed backup archive</td>
          </tr>
          <tr>
            <td><code>backup list</code></td>
            <td><code>nidus backup list</code></td>
            <td>List available backup archives</td>
          </tr>
          <tr>
            <td><code>backup restore</code></td>
            <td><code>nidus backup restore &lt;file&gt; [--decrypt]</code></td>
            <td>Restore state from a backup archive</td>
          </tr>
          <tr>
            <td><code>domains list</code></td>
            <td><code>nidus domains list &lt;project&gt;</code></td>
            <td>List custom domains for a project</td>
          </tr>
          <tr>
            <td><code>domains add</code></td>
            <td><code>nidus domains add &lt;project&gt; &lt;domain&gt;</code></td>
            <td>Add a custom domain to a project</td>
          </tr>
          <tr>
            <td><code>domains remove</code></td>
            <td><code>nidus domains remove &lt;project&gt; &lt;domain&gt;</code></td>
            <td>Remove a custom domain from a project</td>
          </tr>
          <tr>
            <td><code>domains tls</code></td>
            <td><code>nidus domains tls &lt;project&gt; &lt;domain&gt; [--enable]</code></td>
            <td>Configure TLS for a domain (auto or custom cert)</td>
          </tr>
          <tr>
            <td><code>domains check</code></td>
            <td><code>nidus domains check &lt;project&gt; &lt;domain&gt;</code></td>
            <td>Check DNS propagation and TLS status</td>
          </tr>
          <tr>
            <td><code>env list</code></td>
            <td><code>nidus env list &lt;project&gt;</code></td>
            <td>List environment variables for a project</td>
          </tr>
          <tr>
            <td><code>env set</code></td>
            <td><code>nidus env set &lt;project&gt; &lt;key&gt; &lt;value&gt;</code></td>
            <td>Set one or more environment variables</td>
          </tr>
          <tr>
            <td><code>env unset</code></td>
            <td><code>nidus env unset &lt;project&gt; &lt;key&gt;</code></td>
            <td>Remove an environment variable</td>
          </tr>
          <tr>
            <td><code>env pull</code></td>
            <td><code>nidus env pull &lt;project&gt; [--output]</code></td>
            <td>Download remote environment variables to a .env file</td>
          </tr>
          <tr>
            <td><code>secrets set</code></td>
            <td><code>nidus secrets set &lt;project&gt; &lt;name&gt;</code></td>
            <td>Store a secret (encrypted at rest, prompt for value)</td>
          </tr>
          <tr>
            <td><code>secrets list</code></td>
            <td><code>nidus secrets list &lt;project&gt;</code></td>
            <td>List secrets (values masked)</td>
          </tr>
          <tr>
            <td><code>secrets unset</code></td>
            <td><code>nidus secrets unset &lt;project&gt; &lt;name&gt;</code></td>
            <td>Delete a secret</td>
          </tr>
          <tr>
            <td><code>secrets rotate</code></td>
            <td><code>nidus secrets rotate [--all]</code></td>
            <td>Rotate encryption key or individual secrets</td>
          </tr>
          <tr>
            <td><code>version</code></td>
            <td><code>nidus version [--full]</code></td>
            <td>Print CLI version and build information</td>
          </tr>
          <tr>
            <td><code>help</code></td>
            <td><code>nidus help [command]</code></td>
            <td>Display detailed help for any command</td>
          </tr>
        </tbody>
      </table>

      <h2>Global Flags</h2>
      <p>
        These flags apply to every command in the CLI. They can also be set
        via environment variables.
      </p>
      <table>
        <thead>
          <tr>
            <th>Flag</th>
            <th>Environment</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--url</code></td>
            <td><code>NIDUS_URL</code></td>
            <td>Nidus server URL (e.g. <code>https://nidus.example.com</code>)</td>
          </tr>
          <tr>
            <td><code>--token</code></td>
            <td><code>NIDUS_TOKEN</code></td>
            <td>API token for authentication</td>
          </tr>
          <tr>
            <td><code>--api-key</code></td>
            <td><code>NIDUS_API_KEY</code></td>
            <td>API key (alternate auth method)</td>
          </tr>
          <tr>
            <td><code>--output</code></td>
            <td><code>NIDUS_OUTPUT</code></td>
            <td>Output format: <code>table</code>, <code>json</code>, <code>yaml</code>, <code>pretty</code></td>
          </tr>
          <tr>
            <td><code>--timeout</code></td>
            <td><code>NIDUS_TIMEOUT</code></td>
            <td>Request timeout (e.g. <code>30s</code>, <code>5m</code>, default <code>30s</code>)</td>
          </tr>
          <tr>
            <td><code>--verbose</code></td>
            <td><code>NIDUS_VERBOSE</code></td>
            <td>Enable verbose debug output</td>
          </tr>
          <tr>
            <td><code>--no-color</code></td>
            <td><code>NIDUS_NO_COLOR</code></td>
            <td>Disable color in terminal output</td>
          </tr>
          <tr>
            <td><code>--insecure</code></td>
            <td><code>NIDUS_INSECURE</code></td>
            <td>Allow self-signed TLS certificates</td>
          </tr>
          <tr>
            <td><code>--config</code></td>
            <td><code>NIDUS_CONFIG</code></td>
            <td>Path to config file (default <code>~/.nidus/config.yaml</code>)</td>
          </tr>
        </tbody>
      </table>

      <h2>Exit Codes</h2>
      <p>
        The CLI returns standard exit codes suitable for scripting and CI/CD
        pipelines.
      </p>
      <table>
        <thead>
          <tr><th>Code</th><th>Meaning</th></tr>
        </thead>
        <tbody>
          <tr><td><code>0</code></td><td>Success — command completed without errors</td></tr>
          <tr><td><code>1</code></td><td>General error — invalid input, authentication failure, network issue</td></tr>
          <tr><td><code>2</code></td><td>Configuration error — missing or invalid config file</td></tr>
          <tr><td><code>3</code></td><td>Deployment failure — build failed, health check failed, timeout</td></tr>
          <tr><td><code>4</code></td><td>Not found — project, domain, or deployment does not exist</td></tr>
          <tr><td><code>5</code></td><td>Rate limited — too many requests, wait and retry</td></tr>
          <tr><td><code>6</code></td><td>Conflict — resource already exists (e.g. duplicate domain)</td></tr>
        </tbody>
      </table>
    </div>
  );
}
