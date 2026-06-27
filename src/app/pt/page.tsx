import CodeBlock from "@/components/CodeBlock";

export default function PTLandingPage() {
  return (
    <div className="prose">
      {/* Hero */}
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.75rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          Seu próprio painel de infraestrutura.<br />
          <span style={{ color: "var(--accent)" }}>Sem mensalidade. Sem vendor lock-in.</span>
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--fg-muted)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          Nidus substitui Vercel, Datadog, Cloudflare e New Relic — tudo rodando na sua máquina.
          Dashboard, logs, métricas, rate limiting, deploy automático. Grátis.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a
            href="/pt/docs/quickstart"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.6rem 1.25rem", borderRadius: "var(--radius)",
              background: "var(--accent)", color: "white", fontWeight: 600,
              fontSize: "0.9rem", textDecoration: "none",
            }}
          >
            Começar Agora →
          </a>
          <a
            href="https://github.com/mateussiqueira/nidus"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.6rem 1.25rem", borderRadius: "var(--radius)",
              border: "1px solid var(--border)", color: "var(--fg-secondary)",
              fontWeight: 500, fontSize: "0.9rem", textDecoration: "none",
            }}
          >
            GitHub
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem",
        marginBottom: "2.5rem",
      }}>
        {[
          { label: "RAM Total", value: "87MB", sub: "Stack completo em idle" },
          { label: "Ferramentas", value: "8 em 1", sub: "Deploy + Monitoramento + Logs" },
          { label: "Preço", value: "Grátis", sub: "Self-hosted. Sem assinatura." },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "1rem", borderRadius: "var(--radius)",
            border: "1px solid var(--border)", background: "var(--bg-secondary)",
          }}>
            <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: "0.25rem" }}>{stat.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.03em" }}>{stat.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <h2>O Problema</h2>
      <p>
        Para rodar um projeto hoje, você precisa de: Vercel ou Coolify para deploy, Datadog ou New Relic 
        para métricas, Logtail ou Papertrail para logs, Cloudflare para rate limiting e proteção, 
        Uptime Robot para health checks, Grafana para dashboard. São <strong>6+ ferramentas diferentes</strong>,
        cada uma com sua própria assinatura, sua própria interface, sua própria complexidade.
      </p>
      <p>
        Um VPS resolve parte do problema, mas configurar nginx, prometheus, grafana, loki, certbot,
        fail2ban, docker-compose e manter tudo atualizado é um projeto por si só. E quando você tem
        mais de um projeto, a complexidade multiplica.
      </p>
      <p>
        Nidus existe para resolver isso. Rodando na sua máquina — Mac, Linux, VPS — ele unifica
        deploy, monitoramento, logs, rate limiting e dashboard em um único binário.
      </p>

      <h2>O Que o Nidus Substitui</h2>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem",
        marginBottom: "1.5rem",
      }}>
        {[
          ["Vercel / Coolify", "Deploy de aplicações com git push", "✅"],
          ["Datadog / New Relic", "Métricas em tempo real dos seus apps", "✅"],
          ["Logtail / Papertrail", "Logs centralizados com busca", "✅"],
          ["Cloudflare WAF", "Rate limiting e proteção contra bots", "✅"],
          ["Uptime Robot", "Health checks e alertas", "✅"],
          ["Grafana + Prometheus", "Dashboard unificado", "✅"],
          ["Let's Encrypt", "TLS automático para seus domínios", "✅"],
          ["Jenkins / GitHub Actions", "Pipeline de CI/CD integrado", "✅"],
        ].map(([tool, what, status]) => (
          <div key={tool} style={{
            padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", fontSize: "0.875rem",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontWeight: 600, color: "var(--fg)", marginBottom: "0.15rem" }}>{tool}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>{what}</div>
            </div>
            <span style={{ fontSize: "1.1rem" }}>{status}</span>
          </div>
        ))}
      </div>

      <h2>Dashboard</h2>
      <p>
        O Nidus vem com um dashboard nativo (Next.js) que mostra tudo que você precisa
        em um só lugar:
      </p>
      <ul>
        <li><strong>Projetos</strong> — lista de todas as aplicações deployadas, status, recursos</li>
        <li><strong>Métricas</strong> — CPU, RAM, requisições por segundo, latência p95/p99</li>
        <li><strong>Logs</strong> — busca centralizada com filtros por projeto, nível, data</li>
        <li><strong>Tráfego</strong> — número de requisições, bandwidth, top rotas</li>
        <li><strong>Custo</strong> — estimativa de gasto por projeto baseado em recursos usados</li>
        <li><strong>Alertas</strong> — health checks, rate limit excedido, build falhou</li>
      </ul>

      <h2>Proteção Empresarial</h2>
      <p>
        Nidus não é só um deployer. Ele é um proxy de borda completo construído
        em Rust que protege suas aplicações contra ataques comuns:
      </p>
      <ul>
        <li><strong>Rate limiting distribuído</strong> — baseado em Redis, compartilhado entre instâncias</li>
        <li><strong>Proteção contra bots</strong> — detecção de padrões de scraping e DDoS</li>
        <li><strong>TLS 1.3</strong> — terminação SSL com Let's Encrypt automático</li>
        <li><strong>Firewall de requisições</strong> — bloqueio por IP, user-agent, headers</li>
        <li><strong>Health checks ativos</strong> — remove upstreams com falha automaticamente</li>
      </ul>

      <h2>Versão Gratuita vs Paga</h2>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem",
        marginBottom: "1.5rem",
      }}>
        <div style={{
          padding: "1rem", borderRadius: "var(--radius)",
          border: "1px solid var(--border)", background: "var(--bg-secondary)",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.5rem", color: "var(--fg)" }}>
            🆓 Gratuita (Sempre)
          </div>
          <ul style={{ fontSize: "0.8rem", paddingLeft: "1rem", margin: 0, color: "var(--fg-secondary)" }}>
            <li>Deploy via Git + CLI</li>
            <li>Dashboard com métricas</li>
            <li>Logs centralizados</li>
            <li>Rate limiting + TLS</li>
            <li>Health checks</li>
            <li>Rolling updates</li>
            <li>Domínios customizados</li>
            <li>App macOS</li>
          </ul>
        </div>
        <div style={{
          padding: "1rem", borderRadius: "var(--radius)",
          border: "1px solid var(--border)", background: "var(--bg-secondary)",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.5rem", color: "var(--fg)" }}>
            💎 Paga (Q1 2027)
          </div>
          <ul style={{ fontSize: "0.8rem", paddingLeft: "1rem", margin: 0, color: "var(--fg-secondary)" }}>
            <li>Multi-node (cluster)</li>
            <li>Auto-scaling</li>
            <li>Observabilidade avançada</li>
            <li>Alertas por e-mail/Slack/Discord</li>
            <li>RBAC (múltiplos usuários)</li>
            <li>Template marketplace</li>
            <li>Audit logs</li>
            <li>Suporte prioritário</li>
          </ul>
        </div>
      </div>

      <h2>Roda em Qualquer Lugar</h2>
      <p>
        Nidus roda no Mac (desenvolvimento local) e Linux (produção). No Mac,
        você pode testar seus deploys localmente antes de subir para produção.
        No Linux (VPS, bare metal, Raspberry Pi), ele roda 24/7 consumindo menos de 100MB de RAM.
      </p>
      <CodeBlock
        code={`# Mac (desenvolvimento local)
git clone https://github.com/mateussiqueira/nidus.git
cd nidus && docker compose up -d
open http://localhost:3001

# Linux (produção em VPS)
ssh usuario@meu-vps
git clone https://github.com/mateussiqueira/nidus.git
cd nidus && docker compose up -d
# Pronto. Dashboard em http://meu-vps:3001`}
        language="bash"
        filename="terminal"
      />

      <h2>Tudo que Você Precisa, sem Pagar</h2>
      <table>
        <thead>
          <tr><th>Ferramenta</th><th>Custo Mensal</th><th>Nidus</th></tr>
        </thead>
        <tbody>
          <tr><td>Vercel Pro</td><td>$20/mês</td><td><strong>Grátis</strong></td></tr>
          <tr><td>Datadog (infra)</td><td>$15/mês</td><td><strong>Grátis</strong></td></tr>
          <tr><td>Logtail</td><td>$15/mês</td><td><strong>Grátis</strong></td></tr>
          <tr><td>Cloudflare Pro</td><td>$20/mês</td><td><strong>Grátis</strong></td></tr>
          <tr><td>Uptime Robot</td><td>$7/mês</td><td><strong>Grátis</strong></td></tr>
          <tr><td>New Relic</td><td>$15/mês</td><td><strong>Grátis</strong></td></tr>
          <tr><td><strong>Total</strong></td><td><strong>$92/mês</strong></td><td><strong>$0</strong></td></tr>
        </tbody>
      </table>

      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <a
          href="/pt/docs/quickstart"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.7rem 1.5rem", borderRadius: "var(--radius)",
            background: "var(--accent)", color: "white", fontWeight: 600,
            fontSize: "1rem", textDecoration: "none",
          }}
        >
          Comece Agora →
        </a>
        <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: "0.75rem" }}>
          Gratuito e open source. Roda em Mac, Linux, VPS. Sem vendor lock-in.
        </p>
      </div>
    </div>
  );
}
