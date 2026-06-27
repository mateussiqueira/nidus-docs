import CodeBlock from "@/components/CodeBlock";

export default function PTQuickStartPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>
      </div>

      <h1>Primeiros Passos</h1>
      <p>
        Coloque o Nidus rodando na sua máquina em menos de 5 minutos. Um binário, um arquivo de config, pronto.
      </p>

      <h2>Pré-requisitos</h2>
      <ul>
        <li>Um VPS Linux (2 vCPU, 1GB RAM mínimo — <strong>512MB funciona</strong> com stack Go/Rust)</li>
        <li>Docker 24+ e Docker Compose v2</li>
        <li>Git</li>
        <li>Um domínio ou endereço IP</li>
      </ul>

      <h2>Instalação</h2>

      <h3>Opção A: Docker Compose (Recomendado)</h3>
      <CodeBlock code={`# Clone e configure
git clone https://github.com/mateussiqueira/nidus.git
cd nidus
cp .env.example .env

# Edite .env com suas configurações
nano .env

# Inicie os serviços
docker compose up -d

# Verifique
curl http://localhost:3001/health
# {"status":"ok","version":"1.0.0","uptime":"2s"}`} language="bash" filename="terminal" />

      <h3>Opção B: Instalação Binária (Recursos Mínimos)</h3>
      <p>
        Para VPS com RAM limitada (&lt;512MB), instale os binários diretamente:
      </p>
      <CodeBlock code={`# Baixe a última release
curl -sL https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-linux-amd64.tar.gz | tar xz

# Instale os binários
sudo mv nidus-server /usr/local/bin/
sudo mv nidus-proxy /usr/local/bin/
sudo mv nidus-worker /usr/local/bin/

# Execute
nidus-server --config /etc/nidus/config.toml &
nidus-proxy --config /etc/nidus/proxy.toml &
nidus-worker --config /etc/nidus/worker.toml &`} language="bash" filename="terminal" />

      <h3>Opção C: Instalação One-Line</h3>
      <CodeBlock code={`curl -fsSL https://get.nidus.dev | sh`} language="bash" filename="terminal" />

      <h2>Configuração</h2>
      <p>Crie <code>/etc/nidus/config.toml</code>:</p>
      <CodeBlock code={`[server]
port = 3001
host = "0.0.0.0"

[auth]
jwt_secret = "mude-para-producao"
session_ttl = "24h"

[database]
driver = "sqlite"
path = "/var/lib/nidus/data.db"

[redis]
url = "redis://localhost:6379"

[proxy]
port = 3080
rate_limit = 1000  # req/s por IP
tls_enabled = false

[worker]
concurrency = 4    # goroutines (máx: NumCPU * 2)
build_timeout = "10m"
max_image_size = "2GB"

[deploy]
strategy = "rolling"
health_check_timeout = "30s"`} language="toml" filename="config.toml" />

      <h2>Visão Geral dos Serviços</h2>
      <table>
        <thead>
          <tr>
            <th>Serviço</th>
            <th>Binário</th>
            <th>Porta</th>
            <th>Uso RAM</th>
            <th>Linguagem</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Control Plane</td>
            <td><code>nidus-server</code></td>
            <td>3001</td>
            <td>~15MB idle</td>
            <td>Go</td>
          </tr>
          <tr>
            <td>Data Plane</td>
            <td><code>nidus-proxy</code></td>
            <td>3080</td>
            <td>~8MB idle</td>
            <td>Rust</td>
          </tr>
          <tr>
            <td>Deploy Worker</td>
            <td><code>nidus-worker</code></td>
            <td>—</td>
            <td>~12MB idle</td>
            <td>Go</td>
          </tr>
          <tr>
            <td>Dashboard</td>
            <td>Next.js</td>
            <td>3000</td>
            <td>~50MB</td>
            <td>TypeScript</td>
          </tr>
        </tbody>
      </table>

      <h2>Primeiro Deploy</h2>
      <CodeBlock code={`# Instale a CLI
npm install -g nidus-cli

# Faça login
nidus login --url http://seu-servidor:3001

# Deploy do diretório atual
cd meu-app-nextjs
nidus deploy

# Pronto! Seu app está rodando em:
# http://seu-servidor:3080/<project-slug>`} language="bash" filename="terminal" />

      <h2>Verifique Tudo</h2>
      <CodeBlock code={`# Health check
curl http://localhost:3001/health

# Liste projetos
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/projects

# Verifique se o proxy está roteando
curl -I http://localhost:3080/<project-slug>
# HTTP/1.1 200 OK
# X-Nidus-Upstream: http://172.17.0.2:3000
# X-Nidus-Latency: 2ms`} language="bash" filename="terminal" />

      <blockquote>
        <strong>Dica:</strong> O proxy Rust adiciona apenas ~2ms de latência por request.
        Compare com Nginx (~5ms) ou Traefik (~8ms). Em VPS de $5, você lida com
        50K+ conexões concorrentes sem suar.
      </blockquote>

      <h2>Próximos Passos</h2>
      <ul>
        <li><a href="/pt/docs/architecture">Arquitetura</a> — Entenda como Go + Rust trabalham juntos</li>
        <li><a href="/pt/docs/deployment">Deploy</a> — Webhooks GitHub, deploys via CLI, builds Docker</li>
        <li><a href="/pt/docs/performance">Performance</a> — Benchmarks e dicas de otimização</li>
        <li><a href="/pt/docs/security">Segurança</a> — Guia de hardening para produção</li>
      </ul>
    </div>
  );
}
