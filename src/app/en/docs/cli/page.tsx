import CodeBlock from "@/components/CodeBlock";

export default function CLIPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>
      </div>

      <h1>CLI Reference</h1>
      <p>
        The Nidus CLI is a single Go binary. No Node.js runtime required.
      </p>

      <h2>Installation</h2>
      <CodeBlock
        code={`# macOS
brew install mateussiqueira/tap/nidus

# Linux (amd64)
curl -sL https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-linux-amd64.tar.gz | sudo tar xz -C /usr/local/bin

# From source
go install github.com/mateussiqueira/nidus/cmd/nidus@latest`}
        language="bash"
        filename="terminal"
      />

      <h2>Commands</h2>

      <h3>Authentication</h3>
      <CodeBlock
        code={`# Login
nidus login --url https://your-nidus.com
nidus login --url https://your-nidus.com --token nid_live_abc123...

# Whoami
nidus whoami

# Logout
nidus logout`}
        language="bash"
        filename="terminal"
      />

      <h3>Projects</h3>
      <CodeBlock
        code={`# List projects
nidus projects list

# Create project
nidus projects create my-app \\
  --repo https://github.com/user/repo \\
  --framework next \\
  --branch main

# Delete project
nidus projects delete my-app

# Get project details
nidus projects get my-app`}
        language="bash"
        filename="terminal"
      />

      <h3>Deploy</h3>
      <CodeBlock
        code={`# Deploy current directory
nidus deploy

# Deploy with options
nidus deploy \\
  --project my-app \\
  --branch develop \\
  --build-command "pnpm build" \\
  --output "dist" \\
  --env "NODE_ENV=production" \\
  --env "DATABASE_URL=postgresql://..."

# Watch deploy
nidus deploys watch my-app

# List deploys
nidus deploys list my-app

# Rollback
nidus deploys rollback my-app dep_abc123`}
        language="bash"
        filename="terminal"
      />

      <h3>Environment Variables</h3>
      <CodeBlock
        code={`# List env vars
nidus env list my-app

# Set env var
nidus env set my-app DATABASE_URL "postgresql://..."

# Set multiple
nidus env set my-app \\
  DATABASE_URL="postgresql://..." \\
  REDIS_URL="redis://..." \\
  SECRET_KEY="super-secret"

# Delete env var
nidus env unset my-app OLD_VAR

# Pull env vars to .env file
nidus env pull my-app`}
        language="bash"
        filename="terminal"
      />

      <h3>Domains</h3>
      <CodeBlock
        code={`# List domains
nidus domains list my-app

# Add domain
nidus domains add my-app custom.example.com

# Remove domain
nidus domains remove my-app custom.example.com

# Enable TLS
nidus domains tls my-app custom.example.com --enable`}
        language="bash"
        filename="terminal"
      />

      <h3>Logs</h3>
      <CodeBlock
        code={`# Stream logs
nidus logs my-app

# Follow logs
nidus logs my-app --follow

# Filter by level
nidus logs my-app --level error

# Since time
nidus logs my-app --since "1h"
nidus logs my-app --since "2026-06-26T10:00:00Z"`}
        language="bash"
        filename="terminal"
      />

      <h3>Secrets</h3>
      <CodeBlock
        code={`# Set secret (encrypted at rest)
nidus secrets set my-app API_KEY "sk-1234567890"

# List secrets (values hidden)
nidus secrets list my-app

# Delete secret
nidus secrets unset my-app API_KEY

# Rotate all secrets
nidus secrets rotate --all`}
        language="bash"
        filename="terminal"
      />

      <h3>Status</h3>
      <CodeBlock
        code={`# System status
nidus status

# Output:
# Nidus v1.0.0
# Server:  ✅ Running (15MB RAM, 3% CPU)
# Proxy:   ✅ Running (8MB RAM, 5% CPU)
# Worker:  ✅ Running (12MB RAM, 0% CPU)
# Redis:   ✅ Connected
# Apps:    5 running
# Deploys: 12 today`}
        language="bash"
        filename="terminal"
      />

      <h2>Global Flags</h2>
      <table>
        <thead>
          <tr><th>Flag</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>--url</code></td><td>Nidus server URL</td></tr>
          <tr><td><code>--token</code></td><td>API token</td></tr>
          <tr><td><code>--output</code></td><td>Output format: json, table, yaml</td></tr>
          <tr><td><code>--verbose</code></td><td>Verbose output</td></tr>
          <tr><td><code>--no-color</code></td><td>Disable colored output</td></tr>
        </tbody>
      </table>
    </div>
  );
}
