import CodeBlock from "@/components/CodeBlock";

export default function PTCLIPage() {
  return (
    <div className="prose">
      <div className="mb-4"><span className="badge badge-go">Go</span></div>
      <h1>Referência CLI</h1>
      <p>A CLI do Nidus é um binário Go único. Sem necessidade de runtime Node.js.</p>

      <h2>Instalação</h2>
      <CodeBlock code={`# macOS
brew install mateussiqueira/tap/nidus

# Linux (amd64)
curl -sL https://github.com/mateussiqueira/nidus/releases/latest/download/nidus-linux-amd64.tar.gz | sudo tar xz -C /usr/local/bin

# Do código fonte
go install github.com/mateussiqueira/nidus/cmd/nidus@latest`} language="bash" filename="terminal" />

      <h2>Comandos</h2>

      <h3>Autenticação</h3>
      <CodeBlock code={`nidus login --url https://seu-nidus.com
nidus login --url https://seu-nidus.com --token nid_live_abc123...
nidus whoami
nidus logout`} language="bash" filename="terminal" />

      <h3>Projetos</h3>
      <CodeBlock code={`nidus projects list
nidus projects create meu-app --repo https://github.com/user/repo --framework next
nidus projects delete meu-app
nidus projects get meu-app`} language="bash" filename="terminal" />

      <h3>Deploy</h3>
      <CodeBlock code={`# Deploy do diretório atual
nidus deploy

# Deploy com opções
nidus deploy --project meu-app --branch develop --build-command "pnpm build"

# Acompanhar deploy
nidus deploys watch meu-app

# Listar deploys
nidus deploys list meu-app

# Rollback
nidus deploys rollback meu-app dep_abc123`} language="bash" filename="terminal" />

      <h3>Variáveis de Ambiente</h3>
      <CodeBlock code={`nidus env list meu-app
nidus env set meu-app DATABASE_URL "postgresql://..."
nidus env set meu-app DATABASE_URL="postgresql://..." REDIS_URL="redis://..."
nidus env unset meu-app OLD_VAR
nidus env pull meu-app`} language="bash" filename="terminal" />

      <h3>Domínios</h3>
      <CodeBlock code={`nidus domains list meu-app
nidus domains add meu-app custom.example.com
nidus domains remove meu-app custom.example.com
nidus domains tls meu-app custom.example.com --enable`} language="bash" filename="terminal" />

      <h3>Logs</h3>
      <CodeBlock code={`nidus logs meu-app
nidus logs meu-app --follow
nidus logs meu-app --level error
nidus logs meu-app --since "1h"`} language="bash" filename="terminal" />

      <h3>Secrets</h3>
      <CodeBlock code={`nidus secrets set meu-app API_KEY "sk-1234567890"
nidus secrets list meu-app
nidus secrets unset meu-app API_KEY
nidus secrets rotate --all`} language="bash" filename="terminal" />

      <h3>Status</h3>
      <CodeBlock code={`nidus status

# Output:
# Nidus v1.0.0
# Server:  ✅ Rodando (15MB RAM, 3% CPU)
# Proxy:   ✅ Rodando (8MB RAM, 5% CPU)
# Worker:  ✅ Rodando (12MB RAM, 0% CPU)
# Redis:   ✅ Conectado
# Apps:    5 rodando
# Deploys: 12 hoje`} language="bash" filename="terminal" />

      <h2>Flags Globais</h2>
      <table>
        <thead><tr><th>Flag</th><th>Descrição</th></tr></thead>
        <tbody>
          <tr><td><code>--url</code></td><td>URL do servidor Nidus</td></tr>
          <tr><td><code>--token</code></td><td>Token API</td></tr>
          <tr><td><code>--output</code></td><td>Formato: json, table, yaml</td></tr>
          <tr><td><code>--verbose</code></td><td>Saída detalhada</td></tr>
          <tr><td><code>--no-color</code></td><td>Desabilitar cores</td></tr>
        </tbody>
      </table>
    </div>
  );
}
