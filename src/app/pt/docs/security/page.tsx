import CodeBlock from "@/components/CodeBlock";

export default function PTSecurityPage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>{" "}
        <span className="badge badge-new">Segurança</span>
      </div>

      <h1>Segurança</h1>
      <p>Segurança não é opcional. Aqui está como o Nidus lida com autenticação, isolamento de rede e hardening.</p>

      <h2>Autenticação</h2>

      <h3>Tokens JWT</h3>
      <CodeBlock code={`[auth]
jwt_secret = "seu-secreto-256-bit"
jwt_algorithm = "HS256"
session_ttl = "24h"
refresh_ttl = "7d"
token_issuer = "nidus.seu-dominio.com"`} language="toml" filename="server.toml" />

      <h3>API Keys</h3>
      <CodeBlock code={`# Gere API key para CI/CD
nidus keys create --name "github-actions" --scope "deploy:write"

# Formato: nid_live_<64-char-hex>
# Guarde no GitHub Secrets, nunca no código

[auth.api_keys]
rate_limit = 100
scopes:
  - deploy:read
  - deploy:write
  - projects:read
  - projects:write`} language="bash" filename="terminal" />

      <h2>Segurança de Rede</h2>

      <h3>Regras de Firewall</h3>
      <CodeBlock code={`# UFW rules
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3080/tcp    # Nidus proxy
ufw deny 3001/tcp     # API (interno)
ufw deny 3000/tcp     # Dashboard (interno)
ufw enable`} language="bash" filename="terminal" />

      <h3>Configuração TLS</h3>
      <CodeBlock code={`[proxy.tls]
enabled = true
cert_path = "/etc/nidus/certs/fullchain.pem"
key_path = "/etc/nidus/certs/privkey.pem"

# Auto-renew com Let's Encrypt
[proxy.tls.acme]
enabled = true
email = "admin@seu-dominio.com"
challenge = "http-01"`} language="toml" filename="proxy.toml" />

      <h2>Isolamento de Containers</h2>
      <CodeBlock code={`# docker-compose.yml
services:
  nidus-proxy:
    networks:
      - public

  nidus-server:
    networks:
      - internal
      - public

  redis:
    networks:
      - internal

networks:
  public:
    driver: bridge
  internal:
    driver: bridge
    internal: true`} language="yaml" filename="docker-compose.yml" />

      <h2>Gerenciamento de Secrets</h2>
      <CodeBlock code={`nidus secrets set MY_DB_URL "postgresql://user:pass@host/db"
nidus secrets set API_KEY "sk-1234567890"
nidus secrets rotate --all
nidus secrets list`} language="bash" filename="terminal" />

      <h2>Checklist de Produção</h2>
      <table>
        <thead><tr><th>Item</th><th>Status</th><th>Comando</th></tr></thead>
        <tbody>
          <tr><td>Mudar JWT secret padrão</td><td>🔴 Obrigatório</td><td><code>nidus config set auth.jwt_secret $RANDOM</code></td></tr>
          <tr><td>Habilitar TLS</td><td>🔴 Obrigatório</td><td><code>nidus config set proxy.tls.enabled true</code></td></tr>
          <tr><td>Firewall configurado</td><td>🔴 Obrigatório</td><td><code>ufw status</code></td></tr>
          <tr><td>Rate limiting API</td><td>🟡 Recomendado</td><td><code>nidus config set proxy.rate_limit 1000</code></td></tr>
          <tr><td>Logs de auditoria</td><td>🟡 Recomendado</td><td><code>nidus config set logging.level info</code></td></tr>
          <tr><td>Limites de recursos</td><td>🟡 Recomendado</td><td><code>nidus config set worker.limits.max_memory 512MB</code></td></tr>
        </tbody>
      </table>
    </div>
  );
}
