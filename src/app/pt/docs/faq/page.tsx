import CodeBlock from "@/components/CodeBlock";

export default function PTFAQPage() {
  return (
    <div className="prose">
      <h1>FAQ</h1>

      <h2>Geral</h2>

      <h3>O que é Nidus?</h3>
      <p>Nidus é uma plataforma de deploy self-hosted construída com Go e Rust. Vercel que roda na sua máquina — mas mais rápida, leve e totalmente sob seu controle.</p>

      <h3>Por que Go e Rust em vez de Node.js?</h3>
      <p>Go e Rust compilam para binários únicos sem dependências de runtime. O control plane Go usa ~15MB RAM idle vs ~120MB para Node.js. O proxy Rust processa 50K+ req/s em VPS de $5. Alternativas Node.js chegam a 10-15K req/s com 3-4x mais consumo de memória.</p>

      <h3>Nidus está pronto para produção?</h3>
      <p>Sim. A stack Go/Rust é projetada para cargas de trabalho em produção. Todos os componentes têm logging estruturado, health checks, graceful shutdown e restarts automáticos. O proxy Rust foi load-testado com 100K+ conexões concorrentes.</p>

      <h3>Como Nidus se compara ao Vercel?</h3>
      <p>Vercel é um serviço gerenciado ($20+/mês). Nidus é self-hosted (roda em VPS de $5). Nidus oferece o mesmo DX — deploys GitHub, preview branches, rollbacks instantâneos — mas você owns a infraestrutura.</p>

      <h3>Como Nidus se compara ao Coolify?</h3>
      <p>Coolify usa PHP/Laravel e Traefik. Nidus usa Go e Rust. No mesmo VPS, Nidus usa 3x menos memória, lida com 3x mais tráfego e faz deploys 2-3x mais rápidos.</p>

      <h2>Técnico</h2>

      <h3>Quais frameworks são suportados?</h3>
      <p>Qualquer framework que pode ser containerizado com Docker. Suporte oficial para: Next.js, Nuxt.js, SvelteKit, Astro, Remix, Gatsby, Hugo/Jekyll, e qualquer app Go/Rust/Python/Ruby/Node.js com Dockerfile.</p>

      <h3>Posso usar Dockerfile customizado?</h3>
      <p>Sim. Nidus usa seu Dockerfile se presente. Se não, ele detecta o framework automaticamente e gera um Dockerfile multi-stage otimizado.</p>

      <h3>Nidus suporta monorepos?</h3>
      <CodeBlock code={`{
  "name": "frontend",
  "repoUrl": "https://github.com/user/monorepo",
  "rootDir": "packages/frontend",
  "buildCommand": "cd packages/frontend && npm run build"
}`} language="json" filename="nidus.json" />

      <h3>Posso rodar Nidus em Raspberry Pi?</h3>
      <p>Sim. Nidus suporta ARM64. Os binários Go/Rust são cross-compilados para <code>linux/arm64</code>. Em Raspberry Pi 4 (4GB RAM), você roda o stack completo com 3-5 apps deployed.</p>

      <h3>Qual banco de dados o Nidus usa?</h3>
      <p>SQLite por padrão (zero-config, arquivo único). Suporte opcional PostgreSQL para setups de alta disponibilidade. Redis é obrigatório para a fila de jobs e store de sessão.</p>

      <h2>Deploy</h2>

      <h3>Como fazer deploy sem downtime?</h3>
      <p>Nidus usa rolling deploys por padrão. O novo container inicia e passa no health check antes que o antigo seja parado. O tráfego é trocado atomicamente.</p>

      <h3>Posso deployar múltiplos apps em um VPS?</h3>
      <p>Sim. Cada app roda em seu próprio container. O proxy Rust roteia tráfego baseado no hostname ou path. Em VPS de $5 (1GB RAM), você roda 5-10 apps confortavelmente.</p>

      <h3>Como configurar SSL/TLS?</h3>
      <CodeBlock code={`# Let's Encrypt (automático)
nidus config set proxy.tls.acme.enabled true
nidus config set proxy.tls.acme.email admin@seu-dominio.com

# Cloudflare Origin Certificate
nidus config set proxy.tls.cert_path /etc/nidus/certs/cloudflare.pem
nidus config set proxy.tls.key_path /etc/nidus/certs/cloudflare-key.pem`} language="bash" filename="terminal" />

      <h2>Troubleshooting</h2>

      <h3>Deploy travado em "building"</h3>
      <CodeBlock code={`nidus logs --service worker --level debug
# Causas comuns:
# - Docker daemon não rodando: systemctl start docker
# - Timeout do build: aumente worker.build.timeout
# - Espaço em disco: docker system prune`} language="bash" filename="terminal" />

      <h3>Proxy retorna 502 Bad Gateway</h3>
      <CodeBlock code={`docker ps | grep <nome-do-app>
docker logs <container-id>
curl http://localhost:<porta-do-app>/health`} language="bash" filename="terminal" />
    </div>
  );
}
