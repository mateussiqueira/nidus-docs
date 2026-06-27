import CodeBlock from "@/components/CodeBlock";

export default function PTCLIPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-done">CLI</span>
      </div>

      <h1>Referência da CLI</h1>

      <p>
        A CLI do Nidus é um binário único escrito em Go. Sem dependências externas, 
        sem runtime Node.js, sem Python. Você baixa, extrai e usa. Ela se comunica 
        com o servidor Nidus via API REST (porta 3001) usando tokens JWT ou API keys.
      </p>

      <p>
        Todos os comandos seguem o padrão <code>nidus [comando] [subcomando] [flags]</code>. 
        A saída pode ser formatada como tabela (padrão), JSON ou YAML usando a flag 
        global <code>--output</code>.
      </p>

      <h2>Instalação</h2>

      <p>
        A CLI está disponível para macOS, Linux e Windows. A instalação é direta:
      </p>

      <CodeBlock code={`# macOS — via Homebrew
$ brew install mateussiqueira/tap/nidus

# Linux (amd64) — download direto do GitHub
$ curl -sL https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-linux-amd64.tar.gz \\
  | sudo tar xz -C /usr/local/bin

# Linux (arm64) — para Raspberry Pi / ARM VPS
$ curl -sL https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-linux-arm64.tar.gz \\
  | sudo tar xz -C /usr/local/bin

# Windows (PowerShell)
$ curl -LO https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-windows-amd64.zip
$ Expand-Archive nidus-windows-amd64.zip -DestinationPath C:\\tools\\nidus

# Do código fonte (requer Go 1.23+)
$ go install github.com/mateussiqueira/nidus/cmd/nidus@latest`} language="bash" filename="terminal" />

      <p>
        Após instalar, verifique se está tudo certo:
      </p>

      <CodeBlock code={`$ nidus version
Nidus CLI v1.0.0 (build: 2026-06-15T12:00:00Z, commit: a1b2c3d4)
Server: não conectado (use "nidus login" primeiro)`} language="bash" filename="terminal" />

      <h3>Autenticação Inicial</h3>

      <p>
        Antes de usar qualquer comando que interaja com o servidor, você precisa 
        autenticar. Existem dois métodos:
      </p>

      <CodeBlock code={`# Método 1: Login interativo (abre o navegador)
$ nidus login
Opening browser for authentication...
✓ Autenticado como admin@meudominio.com

# Método 2: Login com token (CI/CD, scripts)
$ nidus login --url https://nidus.meudominio.com --token nid_live_abc123def456...
✓ Autenticado como github-actions (ci)

# Verificar identidade
$ nidus whoami
Usuário:    admin@meudominio.com
Escopo:     owner
Servidor:   nidus.meudominio.com:3001
Conexão:    TLS 1.3 (válido até 2026-09-12)

# Sair
$ nidus logout
✓ Sessão encerrada`} language="bash" filename="terminal" />

      <h2>Comando: nidus deploy</h2>

      <p>
        Faz deploy de uma aplicação para o servidor Nidus. Você pode deployar do 
        diretório local, de um repositório git ou de uma imagem Docker existente.
      </p>

      <h3>Sintaxe</h3>

      <CodeBlock code={`nidus deploy [--project <nome>] [--branch <branch>] [--build-command <cmd>] [flags]`} language="bash" filename="terminal" />

      <h3>Exemplos</h3>

      <CodeBlock code={`# Deploy do diretório atual (usa o nome do diretório como project)
$ nidus deploy
[12:34:56] Clonando repositório...
[12:34:58] Build iniciado (Next.js 15.2.0)
[12:35:10] Build concluído (12.3s)
[12:35:11] Health check: passou (200ms)
[12:35:12] Deploy ativo: dep_a1b2c3d4
URL: https://meu-app.meudominio.com

# Deploy de branch específica com comando customizado
$ nidus deploy --project api-pagamentos --branch develop --build-command "pnpm build:production"
[12:40:12] Clonando repositório (branch: develop)...
[12:40:14] Build iniciado (Node.js 22)
[12:40:45] Build concluído (31.2s)
[12:40:46] Health check: passou (89ms)
[12:40:47] Deploy ativo: dep_b2c3d4e5
URL: https://api-pagamentos.meudominio.com

# Deploy sem build (imagem já existente)
$ nidus deploy --project blog --image ghcr.io/user/blog:latest
[12:45:01] Pulling imagem: ghcr.io/user/blog:latest
[12:45:08] Container iniciado
[12:45:09] Health check: passou (150ms)
[12:45:10] Deploy ativo: dep_c3d4e5f6
URL: https://blog.meudominio.com`} language="bash" filename="terminal" />

      <h3>Flags</h3>

      <table>
        <thead><tr><th>Flag</th><th>Padrão</th><th>Descrição</th></tr></thead>
        <tbody>
          <tr><td><code>--project</code></td><td>nome do diretório</td><td>Nome do projeto no Nidus</td></tr>
          <tr><td><code>--branch</code></td><td><code>main</code></td><td>Branch do repositório git</td></tr>
          <tr><td><code>--build-command</code></td><td>auto-detectado</td><td>Comando de build (sobrescreve detecção)</td></tr>
          <tr><td><code>--image</code></td><td>—</td><td>Usar imagem Docker existente (pula build)</td></tr>
          <tr><td><code>--env</code></td><td>—</td><td>Variáveis de ambiente no formato <code>KEY=val</code></td></tr>
          <tr><td><code>--no-cache</code></td><td><code>false</code></td><td>Ignorar cache de build</td></tr>
          <tr><td><code>--wait</code></td><td><code>true</code></td><td>Aguardar deploy ficar ativo</td></tr>
        </tbody>
      </table>

      <h2>Comando: nidus status</h2>

      <p>
        Mostra o estado atual de todos os serviços do Nidus e das aplicações em execução. 
        É o primeiro comando que você deve rodar quando algo parece errado.
      </p>

      <h3>Sintaxe</h3>

      <CodeBlock code={`nidus status [--watch] [--output json|table|yaml]`} language="bash" filename="terminal" />

      <h3>Exemplo</h3>

      <CodeBlock code={`$ nidus status
Nidus v1.0.0
Server:  ✅ Rodando (15MB RAM, 3% CPU)
Proxy:   ✅ Rodando (8.4MB RAM, 5% CPU) — 1.2k req/min
Worker:  ✅ Rodando (12MB RAM, 0% CPU)
Redis:   ✅ Conectado (4.2MB RAM, 0.5% CPU) — 12 conexões

Apps (5 rodando):
  api-pagamentos  ✅ ativo    (dep_a1b2c3d4, 89MB RAM, 45 req/min)
  blog            ✅ ativo    (dep_b2c3d4e5, 34MB RAM, 12 req/min)
  dashboard       ✅ ativo    (dep_c3d4e5f6, 48MB RAM, 8 req/min)
  landing         ✅ ativo    (dep_d4e5f6a7, 22MB RAM, 120 req/min)
  docs            ✅ ativo    (dep_e5f6a7b8, 12MB RAM, 3 req/min)

Deploys hoje: 8 (7 sucesso, 1 falha)
Cache: 2.3GB / 10GB
Fila: 0 pendentes
Último deploy: há 3 minutos (api-pagamentos, dep_a1b2c3d4)

# Modo watch (atualiza a cada 2s)
$ nidus status --watch
Nidus v1.0.0 | Atualizado: 12:35:02
Server:  ✅ 3% CPU | Proxy:  ✅ 5% CPU (1.2k req/min) | Worker:  ✅ 0% CPU
Apps: 5/5 rodando | Cache: 2.3GB | Fila: 0

# Saída em JSON (para scripts)
$ nidus status --output json | jq '.apps[] | select(.status == "active") | {name, url}'
{
  "name": "api-pagamentos",
  "url": "https://api-pagamentos.meudominio.com"
}
{
  "name": "blog",
  "url": "https://blog.meudominio.com"
}`} language="bash" filename="terminal" />

      <h2>Comando: nidus logs</h2>

      <p>
        Acessa os logs de uma aplicação ou dos componentes do Nidus. Suporta 
        filtros por nível, intervalo de tempo, follow em tempo real e saída JSON.
      </p>

      <h3>Sintaxe</h3>

      <CodeBlock code={`nidus logs <projeto> [--follow] [--level error|warn|info] [--since <tempo>] [--output json]`} language="bash" filename="terminal" />

      <h3>Exemplos</h3>

      <CodeBlock code={`# Logs recentes de uma aplicação
$ nidus logs api-pagamentos
[12:34:56] [INFO]  Server listening on port 3000
[12:34:57] [INFO]  Connected to database postgresql://...
[12:34:58] [INFO]  Health check: OK
[12:35:00] [WARN]  Rate limit approaching: 950/1000 req/s (IP: 192.168.1.100)
[12:35:02] [ERROR] Failed to connect to Redis: connection refused (retry 1/3)
[12:35:05] [INFO]  Redis reconnected

# Follow (tempo real)
$ nidus logs api-pagamentos --follow
[12:36:01] [INFO]  GET /api/users 200 45ms
[12:36:02] [INFO]  POST /api/orders 201 230ms
[12:36:03] [ERROR] GET /api/products 500 "Internal Server Error"
[12:36:04] [INFO]  GET /api/health 200 2ms
... (fica ouvindo até Ctrl+C)

# Apenas erros da última hora
$ nidus logs api-pagamentos --level error --since "1h"
[11:40:23] [ERROR] DB query timeout: SELECT * FROM orders WHERE status = 'pending'
[11:45:12] [ERROR] JWT validation failed: token expired
[12:05:44] [ERROR] File upload excedeu limite: 52MB > 10MB
[12:15:01] [ERROR] Rate limit excedido para IP 203.0.113.42

# Logs em JSON (para processamento)
$ nidus logs api-pagamentos --output json --since "5m"
{"level":"info","time":"12:34:56","msg":"Server listening on port 3000"}
{"level":"error","time":"12:35:02","msg":"Failed to connect to Redis","retry":1}

# Logs dos componentes do Nidus
$ docker logs nidus-proxy --since 10m | grep "latency"
[proxy] upstream latency: 45ms (app: api-pagamentos)`} language="bash" filename="terminal" />

      <h2>Comando: nidus rollback</h2>

      <p>
        Reverte uma aplicação para um deploy anterior. Útil quando um deploy quebrou 
        algo em produção. O rollback é instantâneo — o Nidus mantém os containers 
        anteriores intactos por padrão.
      </p>

      <h3>Sintaxe</h3>

      <CodeBlock code={`nidus rollback <projeto> [--target <deploy-id>]`} language="bash" filename="terminal" />

      <h3>Exemplos</h3>

      <CodeBlock code={`# Rollback para o deploy anterior
$ nidus rollback api-pagamentos
[12:40:00] Parando deploy dep_a1b2c3d4 (health check: falhou)
[12:40:01] Iniciando dep_b2c3d4e5 (deploy anterior)
[12:40:02] Health check: passou (120ms)
[12:40:03] Rollback concluído
URL: https://api-pagamentos.meudominio.com
Deploy ativo: dep_b2c3d4e5

# Rollback para um deploy específico
$ nidus rollback api-pagamentos --target dep_c3d4e5f6
[12:42:00] Parando deploy dep_a1b2c3d4
[12:42:01] Iniciando dep_c3d4e5f6 (deploy de 2026-06-15 10:30:00)
[12:42:02] Health check: passou (89ms)
[12:42:03] Rollback concluído
URL: https://api-pagamentos.meudominio.com
Deploy ativo: dep_c3d4e5f6

# Listar deploys disponíveis para rollback
$ nidus deploys list api-pagamentos
ID           STATUS   CRIADO EM           DURAÇÃO
dep_a1b2c3d4 active  2026-06-15 12:34    12.3s
dep_b2c3d4e5 inactive 2026-06-15 10:30    15.1s
dep_c3d4e5f6 inactive 2026-06-14 22:15     8.2s
dep_d4e5f6a7 inactive 2026-06-14 15:00    45.7s (falha)`} language="bash" filename="terminal" />

      <h2>Comando: nidus backup</h2>

      <p>
        Cria ou restaura backups completos do Nidus: banco de dados SQLite/PostgreSQL, 
        configurações, variáveis de ambiente, secrets, chaves TLS e metadados dos projetos. 
        Os backups são armazenados localmente ou enviados para S3/Cloudflare R2.
      </p>

      <h3>Sintaxe</h3>

      <CodeBlock code={`nidus backup [create|list|restore] [--name <nome>] [--remote s3://bucket/path]`} language="bash" filename="terminal" />

      <h3>Exemplos</h3>

      <CodeBlock code={`# Criar backup local
$ nidus backup create
[12:50:00] Coletando dados do banco...
[12:50:02] Exportando configurações...
[12:50:02] Compactando secrets...
[12:50:03] Backup criado: /var/lib/nidus/backups/nidus-backup-20260615_125003.tar.gz
Tamanho: 48.2MB
Componentes: banco (42MB), config (0.8MB), secrets (2.1MB), tls (3.3MB)

# Backup com nome customizado
$ nidus backup create --name "pre-migration"
Backup criado: /var/lib/nidus/backups/pre-migration-20260615_125500.tar.gz (48.2MB)

# Backup remoto (S3/R2)
$ nidus backup create --remote s3://nidus-backups/producao/
[12:52:00] Backup local: concluído
[12:52:10] Upload para s3://nidus-backups/producao/nidus-backup-20260615.tar.gz
[12:52:12] Upload concluído (12.3s)

# Listar backups disponíveis
$ nidus backup list
NOME                             DATA                TAMANHO  LOCAL
nidus-backup-20260615_125003     2026-06-15 12:50    48.2MB   ✅
nidus-backup-20260614_235900     2026-06-14 23:59    47.1MB   ✅
pre-migration                    2026-06-13 08:00    46.5MB   ✅
nidus-backup-20260612_120000     2026-06-12 12:00    45.8MB   Remoto (S3)

# Restaurar backup
$ nidus backup restore pre-migration
⚠  ATENÇÃO: Isso vai sobrescrever todos os dados atuais!
Digite "sim" para continuar: sim
[12:55:00] Extraindo arquivos...
[12:55:03] Restaurando banco de dados...
[12:55:05] Restaurando configurações...
[12:55:06] Restaurando secrets...
[12:55:08] Backup restaurado com sucesso

# Agendar backup automático (via cron)
$ crontab -e
# Backup diário às 03:00
0 3 * * * /usr/local/bin/nidus backup create --remote s3://nidus-backups/diario/ >> /var/log/nidus-backup.log 2>&1`} language="bash" filename="terminal" />

      <h2>Demais Comandos</h2>

      <h3>Gerenciamento de Projetos</h3>

      <CodeBlock code={`# Listar todos os projetos
$ nidus projects list
NOME              FRAMEWORK  DOMÍNIO                          STATUS
api-pagamentos    express    api-pagamentos.meudominio.com    ✅ ativo
blog              next       blog.meudominio.com              ✅ ativo
dashboard         next       dashboard.meudominio.com         ✅ ativo
landing           astro      meudominio.com                   ✅ ativo
docs              next       docs.meudominio.com              ✅ ativo

# Criar novo projeto
$ nidus projects create meu-app --repo https://github.com/user/repo --framework next
Projeto "meu-app" criado
Framework: Next.js
Repositório: https://github.com/user/repo
Padrão: main

# Ver detalhes de um projeto
$ nidus projects get api-pagamentos
Nome:       api-pagamentos
Framework:  Express
Porta:      3000
Domínio:    api-pagamentos.meudominio.com
TLS:        ✅ Let's Encrypt (expira: 2026-09-12)
Repo:       github.com/user/api-pagamentos
Branch:     main
Deploy:     dep_a1b2c3d4 (active)
Memória:    512MB limit, 89MB used
Uptime:     12 dias 4h`} language="bash" filename="terminal" />

      <h3>Variáveis de Ambiente e Secrets</h3>

      <CodeBlock code={`# Listar variáveis
$ nidus env list api-pagamentos
NOME          VALOR                     CRIADO EM
DATABASE_URL  postgresql://user:***     2026-06-10
REDIS_URL     redis://***:6379          2026-06-10
SENTRY_DSN    https://***@sentry.io     2026-06-12

# Definir variável
$ nidus env set api-pagamentos LOG_LEVEL debug
✓ Variável LOG_LEVEL definida com valor "debug"

# Definir múltiplas de uma vez
$ nidus env set api-pagamentos DATABASE_URL="postgresql://prod:senha@host/db" REDIS_URL="redis://:senha@host:6379"
✓ 2 variáveis definidas

# Secrets (não aparecem em logs nem na UI)
$ nidus secrets set api-pagamentos STRIPE_KEY "sk_live_abc123..."
✓ Secret STRIPE_KEY definido

$ nidus secrets list api-pagamentos
NOME          STATUS    CRIADO EM
STRIPE_KEY    ✅ oculto 2026-06-15
API_KEY       ✅ oculto 2026-06-10`} language="bash" filename="terminal" />

      <h3>Domínios e TLS</h3>

      <CodeBlock code={`# Listar domínios
$ nidus domains list meu-app
DOMÍNIO                   TLS   PROXY
meu-app.meudominio.com    ✅    nidus-proxy
api.meudominio.com        ✅    nidus-proxy

# Adicionar domínio customizado
$ nidus domains add meu-app app.customdomain.com
✓ Domínio app.customdomain.com adicionado
⚠  Aponte o DNS A/AAAA para o IP do servidor Nidus
IP: 203.0.113.42

# Habilitar TLS automático (Let's Encrypt)
$ nidus domains tls meu-app app.customdomain.com --enable
[13:00:00] Solicitando certificado para app.customdomain.com...
[13:00:05] Desafio HTTP-01: aprovado
[13:00:08] Certificado emitido: expira em 90 dias
✓ TLS habilitado para app.customdomain.com

# Remover domínio
$ nidus domains remove meu-app app.customdomain.com
✓ Domínio app.customdomain.com removido`} language="bash" filename="terminal" />

      <h3>Gerenciamento de Deploys</h3>

      <CodeBlock code={`# Acompanhar deploy em tempo real (modo watch)
$ nidus deploys watch api-pagamentos
[12:34:56] Clonando repositório...
[12:34:58] Build iniciado (Next.js 15.2.0)
[12:35:05] npm install concluído (6.8s)
[12:35:10] Build concluído (12.3s)
[12:35:11] Health check: passou (200ms)
[12:35:12] ✅ Deploy ativo: dep_a1b2c3d4

# Listar histórico de deploys
$ nidus deploys list api-pagamentos --limit 5
ID           STATUS   DURAÇÃO  CRIADO EM
dep_a1b2c3d4 active   12.3s    2026-06-15 12:34
dep_b2c3d4e5 inactive 15.1s    2026-06-15 10:30
dep_c3d4e5f6 inactive  8.2s    2026-06-14 22:15
dep_d4e5f6a7 failed   45.7s    2026-06-14 15:00  (build timeout)
dep_e5f6a7b8 inactive 11.0s    2026-06-14 12:00

# Ver detalhes de um deploy específico
$ nidus deploys get api-pagamentos dep_a1b2c3d4 --output json
{
  "id": "dep_a1b2c3d4",
  "project": "api-pagamentos",
  "status": "active",
  "duration": "12.3s",
  "created_at": "2026-06-15T12:34:56Z",
  "commit": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "branch": "main",
  "author": "maria@email.com",
  "image_size": "185MB",
  "health_check": { "status": "passed", "latency": "200ms" }
}`} language="bash" filename="terminal" />

      <h2>Tabela Resumo de Comandos</h2>

      <table>
        <thead>
          <tr><th>Comando</th><th>Ação</th><th>Exemplo Rápido</th></tr>
        </thead>
        <tbody>
          <tr><td><code>nidus deploy</code></td><td>Faz deploy de uma aplicação</td><td><code>nidus deploy --project meu-app</code></td></tr>
          <tr><td><code>nidus status</code></td><td>Mostra status de todos os serviços</td><td><code>nidus status --watch</code></td></tr>
          <tr><td><code>nidus logs</code></td><td>Exibe logs de uma aplicação</td><td><code>nidus logs meu-app --follow</code></td></tr>
          <tr><td><code>nidus rollback</code></td><td>Reverte para deploy anterior</td><td><code>nidus rollback meu-app</code></td></tr>
          <tr><td><code>nidus backup</code></td><td>Cria/restaura backups</td><td><code>nidus backup create</code></td></tr>
          <tr><td><code>nidus projects list</code></td><td>Lista todos os projetos</td><td><code>nidus projects list</code></td></tr>
          <tr><td><code>nidus projects create</code></td><td>Cria um novo projeto</td><td><code>nidus projects create meu-app --repo ...</code></td></tr>
          <tr><td><code>nidus projects get</code></td><td>Detalhes de um projeto</td><td><code>nidus projects get meu-app</code></td></tr>
          <tr><td><code>nidus env list</code></td><td>Lista variáveis de ambiente</td><td><code>nidus env list meu-app</code></td></tr>
          <tr><td><code>nidus env set</code></td><td>Define variável de ambiente</td><td><code>nidus env set meu-app KEY=val</code></td></tr>
          <tr><td><code>nidus secrets set</code></td><td>Define um secret</td><td><code>nidus secrets set meu-app KEY val</code></td></tr>
          <tr><td><code>nidus secrets rotate</code></td><td>Rotaciona todos os secrets</td><td><code>nidus secrets rotate --all</code></td></tr>
          <tr><td><code>nidus domains add</code></td><td>Adiciona domínio customizado</td><td><code>nidus domains add meu-app app.com</code></td></tr>
          <tr><td><code>nidus domains tls</code></td><td>Habilita TLS para um domínio</td><td><code>nidus domains tls meu-app app.com --enable</code></td></tr>
          <tr><td><code>nidus deploys list</code></td><td>Lista histórico de deploys</td><td><code>nidus deploys list meu-app</code></td></tr>
          <tr><td><code>nidus deploys watch</code></td><td>Acompanha deploy em tempo real</td><td><code>nidus deploys watch meu-app</code></td></tr>
          <tr><td><code>nidus login</code></td><td>Autentica na CLI</td><td><code>nidus login --url https://nidus.app</code></td></tr>
          <tr><td><code>nidus whoami</code></td><td>Mostra usuário atual</td><td><code>nidus whoami</code></td></tr>
          <tr><td><code>nidus version</code></td><td>Versão da CLI e servidor</td><td><code>nidus version</code></td></tr>
        </tbody>
      </table>

      <h2>Flags Globais</h2>

      <table>
        <thead><tr><th>Flag</th><th>Descrição</th></tr></thead>
        <tbody>
          <tr><td><code>--url</code></td><td>URL do servidor Nidus</td></tr>
          <tr><td><code>--token</code></td><td>Token de autenticação</td></tr>
          <tr><td><code>--output</code></td><td>Formato de saída: json, table, yaml</td></tr>
          <tr><td><code>--verbose</code></td><td>Saída detalhada com debug</td></tr>
          <tr><td><code>--no-color</code></td><td>Desabilita cores na saída</td></tr>
          <tr><td><code>--help</code></td><td>Mostra ajuda do comando</td></tr>
        </tbody>
      </table>

      <blockquote>
        <strong>Dica:</strong> Use <code>nidus --help</code> para ver todos os comandos 
        disponíveis, ou <code>nidus &lt;comando&gt; --help</code> para ajuda detalhada 
        de um comando específico. A CLI também tem auto-complete para Bash e Zsh — 
        rode <code>nidus completion bash &gt; /etc/bash_completion.d/nidus</code> 
        para ativar.
      </blockquote>
    </div>
  );
}
