import CodeBlock from "@/components/CodeBlock";

export default function PTAPIPage() {
  return (
    <div className="prose">
      <div className="mb-4"><span className="badge badge-go">Go</span></div>
      <h1>Referência API</h1>
      <p>API RESTful construída com Go. Todos os endpoints retornam JSON.</p>

      <h2>URL Base</h2>
      <CodeBlock code={`https://seu-nidus.com/api`} language="bash" filename="terminal" />

      <h2>Autenticação</h2>
      <CodeBlock code={`# Bearer token
Authorization: Bearer nid_live_abc123...

# Ou header de API key
X-Nidus-Key: nid_live_abc123...`} language="bash" filename="terminal" />

      <h2>Endpoints</h2>

      <h3>Health</h3>
      <CodeBlock code={`GET /health

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
}`} language="json" filename="response.json" />

      <h3>Projetos</h3>
      <CodeBlock code={`# Listar projetos
GET /api/projects

# Criar projeto
POST /api/projects
{
  "name": "meu-app",
  "framework": "next",
  "repoUrl": "https://github.com/user/repo",
  "branch": "main"
}

# Deletar projeto
DELETE /api/projects/:id`} language="json" filename="api.json" />

      <h3>Deploys</h3>
      <CodeBlock code={`# Listar deploys
GET /api/projects/:id/deploys

# Criar deploy
POST /api/deploys
{
  "projectId": "proj_abc123",
  "branch": "main"
}

# Status do deploy
GET /api/deploys/:id

# Rollback
POST /api/deploys/:id/rollback

# Logs do deploy
GET /api/deploys/:id/logs`} language="json" filename="api.json" />

      <h3>Webhooks</h3>
      <CodeBlock code={`POST /api/webhook
Headers: X-GitHub-Event: push
Body: payload do GitHub

Response:
{
  "received": true,
  "deployId": "dep_xyz789"
}`} language="json" filename="response.json" />

      <h3>Variáveis de Ambiente</h3>
      <CodeBlock code={`GET /api/projects/:id/env
PUT /api/projects/:id/env
DELETE /api/projects/:id/env/:key`} language="bash" filename="terminal" />

      <h3>Domínios</h3>
      <CodeBlock code={`GET /api/projects/:id/domains
POST /api/projects/:id/domains
DELETE /api/projects/:id/domains/:domain`} language="bash" filename="terminal" />

      <h2>Respostas de Erro</h2>
      <CodeBlock code={`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token inválido ou expirado",
    "status": 401
  }
}`} language="json" filename="error.json" />

      <h2>Rate Limits</h2>
      <CodeBlock code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1719408060`} language="bash" filename="terminal" />
    </div>
  );
}
