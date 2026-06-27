import CodeBlock from "@/components/CodeBlock";

export default function APIPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>
      </div>

      <h1>API Reference</h1>
      <p>
        RESTful API built with Go. All endpoints return JSON.
      </p>

      <h2>Base URL</h2>
      <CodeBlock
        code={`https://your-nidus.com/api`}
        language="bash"
        filename="terminal"
      />

      <h2>Authentication</h2>
      <CodeBlock
        code={`# Bearer token
Authorization: Bearer nid_live_abc123...

# Or API key header
X-Nidus-Key: nid_live_abc123...`}
        language="bash"
        filename="terminal"
      />

      <h2>Endpoints</h2>

      <h3>Health</h3>
      <CodeBlock
        code={`GET /health

Response:
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": "2h34m",
  "components": {
    "server": "ok",
    "proxy": "ok",
    "worker": "ok",
    "redis": "ok"
  }
}`}
        language="json"
        filename="health-response.json"
      />

      <h3>Projects</h3>
      <CodeBlock
        code={`# List projects
GET /api/projects

Response:
{
  "projects": [
    {
      "id": "proj_abc123",
      "name": "my-app",
      "framework": "next",
      "repoUrl": "https://github.com/user/repo",
      "branch": "main",
      "status": "active",
      "domains": ["my-app.nidus.dev"],
      "lastDeploy": "2026-06-26T10:30:00Z",
      "createdAt": "2026-01-15T08:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "perPage": 20
}

# Create project
POST /api/projects

Request:
{
  "name": "my-app",
  "framework": "next",
  "repoUrl": "https://github.com/user/repo",
  "branch": "main",
  "buildCommand": "npm run build",
  "outputDir": ".next",
  "env": {
    "NODE_ENV": "production"
  }
}

Response:
{
  "id": "proj_abc123",
  "name": "my-app",
  "slug": "my-app",
  "status": "created",
  "createdAt": "2026-06-26T10:30:00Z"
}

# Delete project
DELETE /api/projects/:id

Response:
{
  "deleted": true
}`}
        language="json"
        filename="projects-api.json"
      />

      <h3>Deploys</h3>
      <CodeBlock
        code={`# List deploys
GET /api/projects/:id/deploys

Response:
{
  "deploys": [
    {
      "id": "dep_xyz789",
      "projectId": "proj_abc123",
      "status": "ready",
      "branch": "main",
      "commit": "abc1234",
      "commitMessage": "feat: add auth",
      "startedAt": "2026-06-26T10:30:00Z",
      "finishedAt": "2026-06-26T10:30:12Z",
      "duration": "12.3s",
      "imageUrl": "nidus/my-app:abc1234",
      "containerId": "ctr_abc123"
    }
  ],
  "total": 15
}

# Create deploy
POST /api/deploys

Request:
{
  "projectId": "proj_abc123",
  "branch": "main",
  "env": {
    "DATABASE_URL": "postgresql://..."
  }
}

Response:
{
  "id": "dep_new123",
  "status": "pending",
  "queuePosition": 1
}

# Get deploy status
GET /api/deploys/:id

# Rollback
POST /api/deploys/:id/rollback

# Cancel deploy
POST /api/deploys/:id/cancel

# Get deploy logs
GET /api/deploys/:id/logs

Response:
{
  "logs": [
    {
      "timestamp": "2026-06-26T10:30:02Z",
      "stream": "stdout",
      "message": "Cloning repository..."
    },
    {
      "timestamp": "2026-06-26T10:30:04Z",
      "stream": "stdout",
      "message": "Step 1/10: FROM node:20-alpine"
    }
  ]
}`}
        language="json"
        filename="deploys-api.json"
      />

      <h3>Webhooks</h3>
      <CodeBlock
        code={`# GitHub webhook payload
POST /api/webhook

Headers:
  X-GitHub-Event: push
  X-Hub-Signature-256: sha256=...

Body:
{
  "ref": "refs/heads/main",
  "repository": {
    "full_name": "user/repo",
    "clone_url": "https://github.com/user/repo.git"
  },
  "head_commit": {
    "id": "abc1234",
    "message": "feat: add new feature"
  }
}

Response:
{
  "received": true,
  "deployId": "dep_xyz789"
}`}
        language="json"
        filename="webhook-payload.json"
      />

      <h3>Environment Variables</h3>
      <CodeBlock
        code={`# List env vars
GET /api/projects/:id/env

# Set env vars
PUT /api/projects/:id/env

Request:
{
  "DATABASE_URL": "postgresql://...",
  "REDIS_URL": "redis://..."
}

# Delete env var
DELETE /api/projects/:id/env/:key`}
        language="json"
        filename="env-api.json"
      />

      <h3>Domains</h3>
      <CodeBlock
        code={`# List domains
GET /api/projects/:id/domains

# Add domain
POST /api/projects/:id/domains

Request:
{
  "domain": "custom.example.com"
}

# Remove domain
DELETE /api/projects/:id/domains/:domain

# Enable TLS
POST /api/projects/:id/domains/:domain/tls`}
        language="json"
        filename="domains-api.json"
      />

      <h3>Logs</h3>
      <CodeBlock
        code={`# Get application logs
GET /api/projects/:id/logs

Query params:
  ?level=error
  ?since=2026-06-26T10:00:00Z
  ?until=2026-06-26T11:00:00Z
  ?limit=100
  ?follow=true  (WebSocket)

Response:
{
  "logs": [
    {
      "timestamp": "2026-06-26T10:30:00Z",
      "level": "info",
      "message": "Server started on port 3000",
      "requestId": "req_abc123"
    }
  ]
}`}
        language="json"
        filename="logs-api.json"
      />

      <h2>Error Responses</h2>
      <CodeBlock
        code={`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "status": 401
  }
}

Common error codes:
  400 - Bad Request (invalid JSON, missing fields)
  401 - Unauthorized (invalid/missing token)
  403 - Forbidden (insufficient permissions)
  404 - Not Found
  409 - Conflict (project/deploy already exists)
  422 - Unprocessable Entity (validation error)
  429 - Too Many Requests (rate limit exceeded)
  500 - Internal Server Error`}
        language="json"
        filename="error-response.json"
      />

      <h2>Rate Limits</h2>
      <CodeBlock
        code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1719408060

# Headers included in every response
# 429 response when limit exceeded`}
        language="bash"
        filename="terminal"
      />
    </div>
  );
}
