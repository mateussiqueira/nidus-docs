import CodeBlock from "@/components/CodeBlock";

export default function DeploymentPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>
      </div>

      <h1>Deployment</h1>
      <p>
        Deploy from GitHub, CLI, or API. Nidus supports multiple deployment
        strategies with zero-downtime rolling updates.
      </p>

      <h2>GitHub Webhook (Recommended)</h2>

      <h3>1. Configure Webhook</h3>
      <p>In your GitHub repo: Settings → Webhooks → Add webhook:</p>
      <table>
        <thead>
          <tr><th>Field</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td>Payload URL</td><td><code>https://your-nidus.com/api/webhook</code></td></tr>
          <tr><td>Content type</td><td><code>application/json</code></td></tr>
          <tr><td>Secret</td><td>Your webhook secret (set in config)</td></tr>
          <tr><td>Events</td><td>Just the push event</td></tr>
        </tbody>
      </table>

      <h3>2. Create Project</h3>
      <CodeBlock
        code={`curl -X POST https://your-nidus.com/api/projects \\
  -H "Authorization: Bearer nid_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my-app",
    "framework": "next",
    "repoUrl": "https://github.com/user/repo",
    "branch": "main",
    "buildCommand": "npm run build",
    "outputDir": ".next"
  }'`}
        language="bash"
        filename="terminal"
      />

      <h3>3. Push to Deploy</h3>
      <CodeBlock
        code={`git push origin main

# Watch the deploy
nidus deploys watch my-app

# Output:
# [12:34:00] Cloning repository...
# [12:34:02] Building Docker image...
# [12:34:08] ▕ Step 1/10: FROM node:20-alpine
# [12:34:10] ▕ Step 10/10: CMD ["npm", "start"]
# [12:34:12] Starting container...
# [12:34:13] Health check passed
# [12:34:13] 🟢 Deploy ready! https://my-app.your-nidus.com`}
        language="bash"
        filename="terminal"
      />

      <h2>CLI Deploy</h2>
      <CodeBlock
        code={`# Install CLI
npm install -g nidus-cli

# Login
nidus login --url https://your-nidus.com

# Deploy from current directory
cd my-project
nidus deploy

# Deploy with custom settings
nidus deploy --build-command "pnpm build" --output "dist"

# Deploy specific branch
nidus deploy --branch develop`}
        language="bash"
        filename="terminal"
      />

      <h2>API Deploy</h2>
      <CodeBlock
        code={`# Trigger deploy via API
curl -X POST https://your-nidus.com/api/deploys \\
  -H "Authorization: Bearer nid_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "proj_abc123",
    "branch": "main",
    "env": {
      "NODE_ENV": "production",
      "DATABASE_URL": "postgresql://..."
    }
  }'`}
        language="bash"
        filename="terminal"
      />

      <h2>Deploy Strategies</h2>

      <h3>Rolling Update (Default)</h3>
      <CodeBlock
        code={`# Zero-downtime rolling update
# 1. Start new container
# 2. Wait for health check
# 3. Switch traffic to new container
# 4. Stop old container

[deploy]
strategy = "rolling"
health_check_timeout = "30s"
min_healthy = "100%"  # Wait for full health`}
        language="toml"
        filename="config.toml"
      />

      <h3>Blue-Green</h3>
      <CodeBlock
        code={`# Instant switch between versions
[deploy]
strategy = "blue-green"
rollback_on_failure = true

# If health check fails, auto-rollback to previous version`}
        language="toml"
        filename="config.toml"
      />

      <h3>Canary</h3>
      <CodeBlock
        code={`# Gradual traffic shift
[deploy]
strategy = "canary"
canary_percentage = 10     # Start with 10% traffic
canary_interval = "5m"     # Increase every 5 minutes
canary_steps = [10, 25, 50, 100]`}
        language="toml"
        filename="config.toml"
      />

      <h2>Environment Variables</h2>
      <CodeBlock
        code={`# Set via CLI
nidus env set MY_APP DATABASE_URL "postgresql://..."

# Set via API
curl -X PUT https://your-nidus.com/api/projects/proj_abc/env \\
  -H "Authorization: Bearer nid_live_abc123..." \\
  -d '{
    "DATABASE_URL": "postgresql://...",
    "REDIS_URL": "redis://...",
    "SECRET_KEY": "super-secret"
  }'

# Secrets are encrypted at rest, decrypted at runtime`}
        language="bash"
        filename="terminal"
      />

      <h2>Custom Domains</h2>
      <CodeBlock
        code={`# Add custom domain
nidus domains add my-app custom.example.com

# Configure DNS
# A Record: custom.example.com → your-server-ip
# Or CNAME: custom.example.com → your-nidus.com

# Auto TLS with Let's Encrypt
nidus domains tls my-app custom.example.com --enable

# Verify
nidus domains list my-app
# ┌─────────────────────┬────────┬──────┐
# │ Domain              │ TLS    │ Ready│
# ├─────────────────────┼────────┼──────┤
# │ my-app.nidus.dev    │ ✅     │ ✅   │
# │ custom.example.com  │ ✅     │ ✅   │
# └─────────────────────┴────────┴──────┘`}
        language="bash"
        filename="terminal"
      />

      <h2>Dockerfile Best Practices</h2>
      <CodeBlock
        code={`# Optimized for Nidus (multi-stage build)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules
COPY package.json .

# Nidus health check endpoint
HEALTHCHECK --interval=30s --timeout=3s \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["npm", "start"]`}
        language="dockerfile"
        filename="Dockerfile"
      />

      <h2>Rollback</h2>
      <CodeBlock
        code={`# List deploys
nidus deploys list my-app

# Rollback to specific deploy
nidus deploys rollback my-app dep_abc123

# Auto-rollback on failure
[deploy]
auto_rollback = true
health_check_retries = 3`}
        language="bash"
        filename="terminal"
      />
    </div>
  );
}
