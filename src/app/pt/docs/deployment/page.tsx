import CodeBlock from "@/components/CodeBlock";

export default function PTDeploymentPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>
      </div>

      <h1>Deploy</h1>
      <p>
        Faça deploy do GitHub, CLI ou API. Nidus suporta múltiplas estratégias
        de deploy com rolling updates sem downtime.
      </p>

      <h2>GitHub Webhook (Recomendado)</h2>

      <h3>1. Configure o Webhook</h3>
      <p>No seu repo GitHub: Settings → Webhooks → Add webhook:</p>
      <table>
        <thead>
          <tr><th>Campo</th><th>Valor</th></tr>
        </thead>
        <tbody>
          <tr><td>Payload URL</td><td><code>https://seu-nidus.com/api/webhook</code></td></tr>
          <tr><td>Content type</td><td><code>application/json</code></td></tr>
          <tr><td>Secret</td><td>Seu webhook secret (defina no config)</td></tr>
          <tr><td>Events</td><td>Apenas o evento push</td></tr>
        </tbody>
      </table>

      <h3>2. Crie o Projeto</h3>
      <CodeBlock code={`curl -X POST https://seu-nidus.com/api/projects \\
  -H "Authorization: Bearer nid_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "meu-app",
    "framework": "next",
    "repoUrl": "https://github.com/usuario/repo",
    "branch": "main",
    "buildCommand": "npm run build",
    "outputDir": ".next"
  }'`} language="bash" filename="terminal" />

      <h3>3. Push para Deploy</h3>
      <CodeBlock code={`git push origin main

# Acompanhe o deploy
nidus deploys watch meu-app

# Output:
# [12:34:00] Clonando repositório...
# [12:34:02] Building Docker image...
# [12:34:08] ▕ Step 1/10: FROM node:20-alpine
# [12:34:10] ▕ Step 10/10: CMD ["npm", "start"]
# [12:34:12] Iniciando container...
# [12:34:13] Health check passou
# [12:34:13] 🟢 Deploy pronto! https://meu-app.seu-nidus.com`} language="bash" filename="terminal" />

      <h2>Deploy via CLI</h2>
      <CodeBlock code={`# Instale a CLI
npm install -g nidus-cli

# Login
nidus login --url https://seu-nidus.com

# Deploy do diretório atual
cd meu-projeto
nidus deploy

# Deploy com opções customizadas
nidus deploy --build-command "pnpm build" --output "dist"

# Deploy de branch específica
nidus deploy --branch develop`} language="bash" filename="terminal" />

      <h2>Deploy via API</h2>
      <CodeBlock code={`# Dispare deploy via API
curl -X POST https://seu-nidus.com/api/deploys \\
  -H "Authorization: Bearer nid_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "proj_abc123",
    "branch": "main",
    "env": {
      "NODE_ENV": "production",
      "DATABASE_URL": "postgresql://..."
    }
  }'`} language="bash" filename="terminal" />

      <h2>Estratégias de Deploy</h2>

      <h3>Rolling Update (Padrão)</h3>
      <CodeBlock code={`# Rolling update sem downtime
# 1. Inicia novo container
# 2. Espera health check
# 3. Troca tráfego para novo container
# 4. Para container antigo

[deploy]
strategy = "rolling"
health_check_timeout = "30s"
min_healthy = "100%"  # Espera health completo`} language="toml" filename="config.toml" />

      <h3>Blue-Green</h3>
      <CodeBlock code={`# Troca instantânea entre versões
[deploy]
strategy = "blue-green"
rollback_on_failure = true

# Se health check falhar, rollback automático`} language="toml" filename="config.toml" />

      <h3>Canary</h3>
      <CodeBlock code={`# Shift gradual de tráfego
[deploy]
strategy = "canary"
canary_percentage = 10     # Começa com 10% do tráfego
canary_interval = "5m"     # Aumenta a cada 5 minutos
canary_steps = [10, 25, 50, 100]`} language="toml" filename="config.toml" />

      <h2>Variáveis de Ambiente</h2>
      <CodeBlock code={`# Defina via CLI
nidus env set MEU_APP DATABASE_URL "postgresql://..."

# Defina via API
curl -X PUT https://seu-nidus.com/api/projects/proj_abc/env \\
  -H "Authorization: Bearer nid_live_abc123..." \\
  -d '{
    "DATABASE_URL": "postgresql://...",
    "REDIS_URL": "redis://...",
    "SECRET_KEY": "super-secreto"
  }'

# Secrets são criptografados em repouso, descriptografados em runtime`} language="bash" filename="terminal" />

      <h2>Domínios Customizados</h2>
      <CodeBlock code={`# Adicione domínio customizado
nidus domains add meu-app custom.example.com

# Configure DNS
# Registro A: custom.example.com → ip-do-seu-servidor
# Ou CNAME: custom.example.com → seu-nidus.com

# TLS automático com Let's Encrypt
nidus domains tls meu-app custom.example.com --enable

# Verifique
nidus domains list meu-app`} language="bash" filename="terminal" />

      <h2>Dockerfile Best Practices</h2>
      <CodeBlock code={`# Otimizado para Nidus (multi-stage build)
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

HEALTHCHECK --interval=30s --timeout=3s \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["npm", "start"]`} language="dockerfile" filename="Dockerfile" />

      <h2>Rollback</h2>
      <CodeBlock code={`# Liste deploys
nidus deploys list meu-app

# Rollback para deploy específico
nidus deploys rollback meu-app dep_abc123

# Auto-rollback em falha
[deploy]
auto_rollback = true
health_check_retries = 3`} language="bash" filename="terminal" />
    </div>
  );
}
