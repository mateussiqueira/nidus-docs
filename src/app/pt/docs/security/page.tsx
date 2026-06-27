import CodeBlock from "@/components/CodeBlock";

export default function PTSecurityPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>{" "}
        <span className="badge badge-perf">Segurança</span>
      </div>

      <h1>Guia de Segurança</h1>

      <p>
        Segurança em um ambiente self-hosted é diferente de segurança em uma plataforma 
        gerenciada. Você não tem um time de segurança da informação da empresa cuidando 
        de firewall, patches e monitoramento. O servidor é seu. A responsabilidade é sua.
      </p>

      <p>
        Este guia cobre os principais modelos de ameaça para uma plataforma de deploy 
        self-hosted e mostra como configurar cada camada de segurança do Nidus. Nada 
        aqui é teórico — são configurações que usamos em produção.
      </p>

      <h2>Modelos de Ameaça</h2>

      <p>
        Antes de configurar qualquer coisa, entenda contra o que você está se protegendo:
      </p>

      <table>
        <thead>
          <tr><th>Ameaça</th><th>Impacto</th><th>Mitigação</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Token vazado no CI/CD</td>
            <td>Deploy não autorizado, acesso ao servidor</td>
            <td>API keys com escopo, rotação automática</td>
          </tr>
          <tr>
            <td>Ataque de força bruta na API</td>
            <td>Derruba o servidor, acesso não autorizado</td>
            <td>Rate limiting + firewall + fail2ban</td>
          </tr>
          <tr>
            <td>Container comprometido via imagem maliciosa</td>
            <td>Execução de código no host, roubo de secrets</td>
            <td>Isolamento Docker, read-only root, seccomp</td>
          </tr>
          <tr>
            <td>Interceptação de tráfego</td>
            <td>Vazamento de dados em trânsito</td>
            <td>TLS obrigatório, HSTS, cipher suites fortes</td>
          </tr>
          <tr>
            <td>Vazamento de secrets no ambiente</td>
            <td>Banco de dados exposto, chaves de API vazadas</td>
            <td>Secrets criptografados, .env nunca versionado</td>
          </tr>
          <tr>
            <td>Ataque à rede interna</td>
            <td>Container acessa serviços restritos</td>
            <td>Redes Docker internas, firewall de container</td>
          </tr>
        </tbody>
      </table>

      <h2>Autenticação</h2>

      <p>
        O Nidus tem três camadas de autenticação: JWT para sessões de usuário, 
        API keys para automação (CI/CD) e OAuth2 para integração com provedores 
        externos (GitHub, GitLab, Google).
      </p>

      <h3>JWT (Sessões de Usuário)</h3>

      <p>
        O servidor Nidus usa tokens JWT para autenticar sessões da CLI e do dashboard. 
        A configuração é feita no <code>server.toml</code>:
      </p>

      <CodeBlock code={`[auth]
# Chave secreta para assinar JWT (MUDE para produção!)
# Gere com: openssl rand -hex 32
jwt_secret = "e8f2a1c4d6b7e9f0a3b5c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8"

# Algoritmo de assinatura
jwt_algorithm = "HS256"

# Tempo de vida do token de acesso
session_ttl = "24h"

# Tempo de vida do refresh token
refresh_ttl = "7d"

# Emissor (usado para validar o token)
token_issuer = "nidus.meudominio.com"

# Lista de algoritmos aceitos (apenas HS256 e RS256)
allowed_algorithms = ["HS256", "RS256"]

# Chave pública RSA (se usar RS256)
# jwt_public_key = "/etc/nidus/jwt_public.pem"`} language="toml" filename="server.toml" />

      <blockquote>
        <strong>Alerta de segurança:</strong> O <code>jwt_secret</code> padrão do 
        template é público. Gerar um novo não é opcional — <code>openssl rand -hex 32</code> 
        antes de colocar em produção. Se esse secret vazar, qualquer um pode forjar 
        tokens de administrador.
      </blockquote>

      <h3>API Keys (CI/CD)</h3>

      <p>
        Para automação (GitHub Actions, GitLab CI, scripts), use API keys em vez de 
        tokens JWT. API keys têm escopos limitados e podem ser rotacionadas 
        independentemente:
      </p>

      <CodeBlock code={`# Gerar uma API key para GitHub Actions
$ nidus keys create --name "github-actions" --scope "deploy:write" --scope "projects:read"
Key criada:
  ID:     key_a1b2c3d4
  Name:   github-actions
  Scope:  deploy:write, projects:read
  Token:  nid_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
  Criada: 2026-06-15 12:00
  ⚠  Guarde este token! Ele não será mostrado novamente.

# Configurar no GitHub Actions
$ nidus env set meu-app GH_TOKEN "nid_live_a1b2c3d4..."
# Depois use como secret no GitHub: https://github.com/user/repo/settings/secrets/actions

# Listar keys existentes
$ nidus keys list
ID             NOME              ESCOPO                        CRIADA
key_a1b2c3d4   github-actions    deploy:write, projects:read   2026-06-15
key_e5f6a7b8   staging-bot       deploy:read, deploy:write    2026-06-10
key_c8d9e0f1   monitoring        health:read, logs:read        2026-06-08

# Rotacionar uma key (gera novo token, mantém o ID)
$ nidus keys rotate key_a1b2c3d4
Key key_a1b2c3d4 rotacionada
Novo token: nid_live_f9e8d7c6...

# Remover key
$ nidus keys delete key_c8d9e0f1
✓ Key key_c8d9e0f1 removida

# Escopos disponíveis:
# deploy:read    - visualizar deploys
# deploy:write   - criar deploys e rollbacks
# projects:read  - listar e ver projetos
# projects:write - criar, editar, deletar projetos
# secrets:read   - listar secrets (valores ocultos)
# secrets:write  - criar e remover secrets
# logs:read      - acessar logs
# health:read    - verificar saúde do sistema
# admin          - acesso total (evite em CI/CD)`} language="bash" filename="terminal" />

      <h3>OAuth2 (GitHub/GitLab Login)</h3>

      <p>
        O Nidus suporta login via OAuth2 para GitHub, GitLab e Google. Isso elimina 
        a necessidade de gerenciar senhas manualmente:
      </p>

      <CodeBlock code={`[auth.oauth2]
enabled = true

[auth.oauth2.github]
client_id = "Iv1.abc123def456"
client_secret = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
allowed_orgs = ["minha-empresa"]
allowed_teams = ["minha-empresa/engineering"]

[auth.oauth2.gitlab]
client_id = "abc123def456"
client_secret = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
base_url = "https://gitlab.com"
allowed_groups = ["minha-empresa"]

[auth.oauth2.google]
client_id = "1234567890-abc123.apps.googleusercontent.com"
client_secret = "GOCSPX-abc123def456"
allowed_domains = ["meudominio.com"]`} language="toml" filename="server.toml" />

      <h2>TLS/SSL</h2>

      <p>
        Todo tráfego entre cliente e servidor Nidus deve ser criptografado. Não existe 
        justificativa para rodar uma plataforma de deploy sem TLS em 2026.
      </p>

      <h3>Let's Encrypt (Automático)</h3>

      <p>
        O proxy do Nidus tem suporte nativo a ACME para emissão automática de 
        certificados via Let's Encrypt. Basta configurar e ele cuida da renovação:
      </p>

      <CodeBlock code={`[proxy.tls]
enabled = true

[proxy.tls.acme]
enabled = true
email = "admin@meudominio.com"
challenge = "http-01"
# diretório para armazenar os certificados
directory = "/etc/nidus/certs"
# renovar quando faltarem N dias
renew_before = 30

# Forçar HTTPS (redireciona HTTP para HTTPS)
[proxy.redirect]
http_to_https = true
# HSTS (diz ao navegador para sempre usar HTTPS)
hsts_max_age = "63072000"  # 2 anos
hsts_include_subdomains = true
hsts_preload = true`} language="toml" filename="proxy.toml" />

      <h3>Certificados Customizados</h3>

      <p>
        Se você precisa de certificados wildcard, certificados de empresa (PKI interna) 
        ou certificados com validação estendida (EV), use certificados customizados:
      </p>

      <CodeBlock code={`[proxy.tls]
enabled = true
# Certificado customizado (desativa ACME se esses campos estiverem preenchidos)
cert_path = "/etc/nidus/certs/fullchain.pem"
key_path = "/etc/nidus/certs/privkey.pem"

# Cadeia de certificados (opcional)
ca_path = "/etc/nidus/certs/ca.pem"

# Cipher suites fortes (apenas TLS 1.3)
# Se precisar de compatibilidade com TLS 1.2:
# cipher_suites = [
#   "TLS_AES_128_GCM_SHA256",
#   "TLS_AES_256_GCM_SHA384",
#   "TLS_CHACHA20_POLY1305_SHA256"
# ]

# Mínimo de versão TLS
min_version = "tls_1_3"
max_version = "tls_1_3"`} language="toml" filename="proxy.toml" />

      <h3>Verificando o TLS</h3>

      <CodeBlock code={`# Testar conexão TLS
$ curl -vI https://nidus.meudominio.com 2>&1 | grep -E "SSL|TLS|certificate"
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
* Server certificate:
*  subject: CN=nidus.meudominio.com
*  start date: Jun 15 00:00:00 2026 GMT
*  expire date: Sep 13 00:00:00 2026 GMT
*  issuer: C=US, O=Let's Encrypt, CN=R3
*  SSL certificate verify ok.

# Verificar HSTS
$ curl -sI https://nidus.meudominio.com | grep -i strict-transport
strict-transport-security: max-age=63072000; includeSubDomains; preload

# Testar com SSL Labs (online)
# https://www.ssllabs.com/ssltest/analyze.html?d=nidus.meudominio.com

# Verificar data de expiração
$ openssl s_client -connect nidus.meudominio.com:443 -servername nidus.meudominio.com </dev/null 2>/dev/null | openssl x509 -noout -dates
notBefore=Jun 15 00:00:00 2026 GMT
notAfter=Sep 13 00:00:00 2026 GMT`} language="bash" filename="terminal" />

      <h2>Firewall e Rate Limiting</h2>

      <p>
        O Nidus tem duas camadas de proteção contra abuso: o firewall do sistema 
        operacional (UFW/iptables) e o rate limiting interno do proxy.
      </p>

      <h3>Firewall do Sistema (UFW)</h3>

      <CodeBlock code={`# Regras básicas de firewall
$ ufw default deny incoming
$ ufw default allow outgoing
$ ufw allow 22/tcp           # SSH
$ ufw allow 80/tcp           # HTTP (redireciona para HTTPS)
$ ufw allow 443/tcp          # HTTPS
$ ufw allow 3080/tcp         # Nidus proxy (se fora do Docker)
$ ufw deny 3001/tcp          # API interna (nunca expor!)
$ ufw deny 3000/tcp          # Dashboard interno (nunca expor!)
$ ufw deny 6379/tcp          # Redis (nunca expor!)
$ ufw --force enable
$ ufw status verbose

# Para bloquear países específicos (usando ipset)
$ apt install ipset
$ ipset create blocklist hash:net
$ curl -s https://raw.githubusercontent.com/.../blocklist.txt | while read ip; do
    ipset add blocklist $ip
  done
$ iptables -I INPUT -m set --match-set blocklist src -j DROP`} language="bash" filename="terminal" />

      <h3>Rate Limiting no Proxy</h3>

      <CodeBlock code={`[proxy.rate_limit]
# Limite global
requests = 1000
window = "1s"
burst = 50

# Rate limit por rota (sobrescreve o global)
[proxy.rate_limit.routes]
"/api/deploy" = { requests = 10, window = "1s", burst = 5 }
"/api/auth" = { requests = 5, window = "1s", burst = 3 }
"/api/webhook" = { requests = 20, window = "1s", burst = 10 }

# Rate limit distribuído (via Redis)
distributed = true
redis_url = "redis://localhost:6379/1"

# Retorna headers de rate limit nas respostas
headers = true

# Código de resposta quando limitado
status_code = 429`} language="toml" filename="proxy.toml" />

      <h3>Fail2ban</h3>

      <p>
        Para proteção adicional contra força bruta, configure o fail2ban para 
        bloquear IPs após múltiplas tentativas de login falhas:
      </p>

      <CodeBlock code={`# /etc/fail2ban/jail.local
[nidus-auth]
enabled = true
port = 443,3080
filter = nidus-auth
logpath = /var/log/nidus/access.log
maxretry = 5
findtime = 600
bantime = 3600

# /etc/fail2ban/filter.d/nidus-auth.conf
[Definition]
failregex = ^.*"POST /api/auth/login" 401.*remote_addr=<HOST>
ignoreregex =`} language="ini" filename="fail2ban" />

      <h2>Isolamento de Containers</h2>

      <p>
        Cada aplicação deployada no Nidus roda em seu próprio container Docker. 
        O isolamento correto impede que uma aplicação comprometida afete as outras 
        ou o host.
      </p>

      <h3>Redes Docker</h3>

      <p>
        A configuração de redes é a primeira linha de defesa. Componentes internos 
        (Redis, banco) devem ficar em redes internas, inacessíveis de fora:
      </p>

      <CodeBlock code={`# docker-compose.yml do Nidus
services:
  nidus-proxy:
    image: nidus/proxy:latest
    ports:
      - "80:80"
      - "443:443"
      - "3080:3080"
    networks:
      - public
      - internal
    depends_on:
      - nidus-server

  nidus-server:
    image: nidus/server:latest
    expose:
      - "3001"
    networks:
      - public    # só para o proxy
      - internal
    volumes:
      - nidus-data:/var/lib/nidus
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - NIDUS_REDIS_URL=redis://redis:6379

  nidus-worker:
    image: nidus/worker:latest
    networks:
      - internal
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - build-cache:/var/cache/nidus
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    networks:
      - internal
    volumes:
      - redis-data:/data
    command: redis-server --requirepass "SUA_SENHA_AQUI"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

networks:
  public:
    driver: bridge
  internal:
    driver: bridge
    internal: true  # ← ESSENCIAL: sem acesso externo

volumes:
  nidus-data:
  redis-data:
  build-cache:`} language="yaml" filename="docker-compose.yml" />

      <h3>Segurança do Container</h3>

      <p>
        O Nidus aplica configurações de segurança automaticamente nos containers 
        das aplicações. Você pode personalizar os limites:
      </p>

      <CodeBlock code={`[worker.container]
# Política de restart
restart_policy = "unless-stopped"

# Limites de recurso
memory_limit = "512MB"
cpu_quota = 200000
pids_limit = 256

# Segurança (Docker)
read_only_root = true          # sistema de arquivos root readonly
drop_capabilities = [          # remove capacidades privilegiadas
  "NET_RAW",                   # não pode fazer ping / raw sockets
  "NET_ADMIN",                 # não pode modificar rede
  "SYS_ADMIN",                 # não pode montar filesystem
  "SYS_PTRACE",                # não pode debugar processos
  "SYS_CHROOT",                # não pode mudar root
  "AUDIT_WRITE",               # não pode escrever logs de auditoria
  "MKNOD",                     # não pode criar dispositivos
  "SETFCAP"                    # não pode manipular capabilities
]
seccomp_profile = "default"    # perfil seccomp restritivo
no_new_privileges = true       # impede ganho de privilégio
apparmor_profile = "docker-default"`} language="toml" filename="worker.toml" />

      <p>
        Essas configurações garantem que mesmo que um atacante execute código dentro 
        do container, ele não consegue:
      </p>

      <ul>
        <li>Ler o disco do host ou de outros containers (<code>read_only_root</code>)</li>
        <li>Fazer ataques de rede (ARP spoofing, raw sockets) com <code>NET_RAW</code> removida</li>
        <li>Escalar privilégio com <code>no_new_privileges</code></li>
        <li>Comprometer o kernel com chamadas de sistema perigosas (<code>seccomp</code>)</li>
      </ul>

      <h2>Boas Práticas</h2>

      <h3>Secrets e Variáveis de Ambiente</h3>

      <p>
        O Nidus tem um sistema dedicado de secrets, separado de variáveis de ambiente. 
        Secrets são criptografados em repouso no banco de dados e nunca aparecem em logs 
        ou na interface web:
      </p>

      <CodeBlock code={`# .env do servidor (nunca versionar!)
# /etc/nidus/.env
NIDUS_AUTH_JWT_SECRET=e8f2a1c4...
NIDUS_DATABASE_DSN=postgres://nidus:senha@localhost:5432/nidus
NIDUS_REDIS_URL=redis://:senharedis@localhost:6379/0
NIDUS_PROXY_ACME_EMAIL=admin@meudominio.com

# Secrets das aplicações (via CLI)
$ nidus secrets set api-pagamentos DATABASE_URL "postgresql://user:senha@host:5432/db"
✓ Secret DATABASE_URL definido (criptografado em repouso)

$ nidus secrets set api-pagamentos STRIPE_SECRET "sk_live_abc123..."
✓ Secret STRIPE_SECRET definido

# Secrets ficam disponíveis como variáveis de ambiente no container
# mas não aparecem em:
#   - nidus env list     (mostra só variáveis normais)
#   - nidus logs         (valores são mascarados)
#   - Dashboard web      (mostra apenas "definido")`} language="bash" filename="terminal" />

      <h3>Boas Práticas de Rede</h3>

      <ul>
        <li>
          <strong>Nunca exponha a porta da API (3001) publicamente.</strong> 
          O proxy (3080) é a única porta que deve receber tráfego externo. A API 
          só é acessada pela CLI e pelo dashboard, sempre via proxy.
        </li>
        <li>
          <strong>Redis com senha e rede interna.</strong> 
          Redis sem senha em rede pública é o equivalente a deixar a porta de casa aberta. 
          Use <code>requirepass</code> e coloque em uma rede <code>internal: true</code>.
        </li>
        <li>
          <strong>SSH com chave, não senha.</strong> 
          Desabilite autenticação por senha no SSH. Use apenas chaves Ed25519.
        </li>
        <li>
          <strong>Docker socket em modo leitura.</strong> 
          O worker precisa do socket Docker para gerenciar containers, mas monte 
          como <code>:ro</code> (read-only). O worker nunca precisa criar containers 
          no host — só nas redes internas.
        </li>
        <li>
          <strong>Atualizações de segurança automáticas.</strong> 
          Configure <code>unattended-upgrades</code> para patches de segurança do 
          sistema operacional.
        </li>
      </ul>

      <CodeBlock code={`# Configurar unattended-upgrades
$ apt install unattended-upgrades
$ dpkg-reconfigure --priority=low unattended-upgrades
# Editar /etc/apt/apt.conf.d/50unattended-upgrades:
# Unattended-Upgrade::Allowed-Origins {
#   "\${UBUNTU_CODENAME}-security";
# };

# SSH hardening
$ cat /etc/ssh/sshd_config.d/hardening.conf
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
AuthenticationMethods publickey
LogLevel VERBOSE
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2`} language="bash" filename="terminal" />

      <h3>Logs de Auditoria</h3>

      <p>
        O Nidus mantém logs detalhados de todas as ações administrativas. Em caso 
        de incidente, esses logs são a principal fonte de investigação:
      </p>

      <CodeBlock code={`[logging]
level = "info"
format = "json"      # formato estruturado para processamento
output = "stdout"    # ou "file" com caminho

# Logs de auditoria (ação do usuário)
[audit]
enabled = true
# Eventos registrados:
#   login, logout, deploy, rollback, env.set, secrets.set,
#   projects.create, projects.delete, keys.create, keys.delete
log_all_events = true
# Reter logs de auditoria por 90 dias
retention_days = 90

# Exemplo de log de auditoria:
# {"time":"2026-06-15T12:34:56Z","level":"audit","action":"deploy.create",
#  "user":"maria@email.com","project":"api-pagamentos","deploy_id":"dep_a1b2c3d4",
#  "ip":"203.0.113.42","user_agent":"nidus-cli/1.0.0"}`} language="toml" filename="server.toml" />

      <h2>Checklist de Segurança para Produção</h2>

      <p>
        Use esta checklist antes de colocar qualquer servidor Nidus em produção. 
        Cada item tem um comando para verificar ou aplicar:
      </p>

      <table>
        <thead>
          <tr><th>Item</th><th>Prioridade</th><th>Como Verificar</th><th>Comando</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>JWT secret customizado</td>
            <td><strong className="text-red-600">Obrigatório</strong></td>
            <td><code>grep jwt_secret server.toml</code></td>
            <td><code>openssl rand -hex 32</code></td>
          </tr>
          <tr>
            <td>TLS habilitado</td>
            <td><strong className="text-red-600">Obrigatório</strong></td>
            <td><code>nidus domains tls list</code></td>
            <td><code>nidus domains tls meu-app app.com --enable</code></td>
          </tr>
          <tr>
            <td>Firewall configurado</td>
            <td><strong className="text-red-600">Obrigatório</strong></td>
            <td><code>ufw status verbose</code></td>
            <td><code>ufw enable && ufw default deny incoming</code></td>
          </tr>
          <tr>
            <td>SSH com chave (sem senha)</td>
            <td><strong className="text-red-600">Obrigatório</strong></td>
            <td><code>grep PasswordAuthentication /etc/ssh/sshd_config</code></td>
            <td><code>echo "PasswordAuthentication no" &gt;&gt; /etc/ssh/sshd_config</code></td>
          </tr>
          <tr>
            <td>Redis com senha</td>
            <td><strong className="text-red-600">Obrigatório</strong></td>
            <td><code>grep requirepass /etc/redis/redis.conf</code></td>
            <td><code>redis-cli config set requirepass "..."</code></td>
          </tr>
          <tr>
            <td>Rate limit configurado</td>
            <td><strong className="text-yellow-600">Recomendado</strong></td>
            <td><code>grep rate_limit proxy.toml</code></td>
            <td><code>nidus config set proxy.rate_limit.requests 1000</code></td>
          </tr>
          <tr>
            <td>Secrets criptografados</td>
            <td><strong className="text-yellow-600">Recomendado</strong></td>
            <td><code>nidus secrets list meu-app</code></td>
            <td><code>nidus secrets set meu-app KEY val</code></td>
          </tr>
          <tr>
            <td>Logs de auditoria</td>
            <td><strong className="text-yellow-600">Recomendado</strong></td>
            <td><code>grep audit server.toml</code></td>
            <td><code>nidus config set audit.enabled true</code></td>
          </tr>
          <tr>
            <td>Limites de recursos</td>
            <td><strong className="text-yellow-600">Recomendado</strong></td>
            <td><code>grep memory_limit worker.toml</code></td>
            <td><code>nidus config set worker.limits.max_memory 512MB</code></td>
          </tr>
          <tr>
            <td>Read-only root em containers</td>
            <td><strong className="text-yellow-600">Recomendado</strong></td>
            <td><code>grep read_only worker.toml</code></td>
            <td><code>nidus config set worker.container.read_only_root true</code></td>
          </tr>
          <tr>
            <td>unattended-upgrades</td>
            <td><strong className="text-blue-600">Boa prática</strong></td>
            <td><code>systemctl status unattended-upgrades</code></td>
            <td><code>apt install unattended-upgrades</code></td>
          </tr>
          <tr>
            <td>Fail2ban</td>
            <td><strong className="text-blue-600">Boa prática</strong></td>
            <td><code>fail2ban-client status</code></td>
            <td><code>apt install fail2ban</code></td>
          </tr>
          <tr>
            <td>Backup criptografado</td>
            <td><strong className="text-blue-600">Boa prática</strong></td>
            <td><code>nidus backup list</code></td>
            <td><code>nidus backup create --remote s3://bucket</code></td>
          </tr>
        </tbody>
      </table>

      <h2>Resumo</h2>

      <ul>
        <li><strong>JWT:</strong> Secret único de 256 bits, algoritmo HS256, TTL máximo de 24h</li>
        <li><strong>API Keys:</strong> Escopos mínimos necessários, rotação periódica, nunca em código</li>
        <li><strong>TLS:</strong> Let's Encrypt automático, HSTS por 2 anos, TLS 1.3 exclusivo</li>
        <li><strong>Firewall:</strong> UFW bloqueando tudo exceto 22, 80, 443, 3080</li>
        <li><strong>Rate Limit:</strong> 1000 req/s global, 10 req/s para deploy, distribuído via Redis</li>
        <li><strong>Containers:</strong> Read-only root, sem capabilities privilegiadas, seccomp restritivo</li>
        <li><strong>Secrets:</strong> Criptografados em repouso, mascarados em logs e interface</li>
        <li><strong>Auditoria:</strong> Todas as ações registradas em JSON, retenção de 90 dias</li>
      </ul>

      <blockquote>
        <strong>Lembre-se:</strong> Segurança não é um destino, é um processo contínuo. 
        Revise esta checklist mensalmente. Monitore os logs de auditoria. Rode 
        <code>nidus status</code> toda manhã. E nunca, jamais, use o JWT secret padrão 
        em produção.
      </blockquote>
    </div>
  );
}
