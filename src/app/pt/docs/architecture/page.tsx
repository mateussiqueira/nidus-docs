import Mermaid from "@/components/Mermaid";
import { MemoryChart } from "@/components/Charts";

const systemOverviewDiagram = `graph TD
    Internet["Internet"]
    Internet --> Proxy

    subgraph Proxy["nidus-proxy (Rust) — Porta 3080"]
        RL["Rate Limiter"]
        TLS["TLS Termination"]
        LB["Load Balancer"]
    end

    Proxy --> App1["App 1 :3000"]
    Proxy --> App2["App 2 :3001"]
    Proxy --> App3["App 3 :3002"]

    subgraph ControlPlane["Control Plane (Go)"]
        API["REST API :3001"]
        Auth["Auth JWT/OAuth"]
        Webhook["Webhook Handler"]
        Queue["Fila de Deploy"]
    end

    subgraph WorkerPool["Worker Pool (Go goroutines)"]
        GW1["GW1"]
        GW2["GW2"]
        GW3["GW3"]
        GW4["... GWn"]
    end

    ControlPlane --> WorkerPool
    WorkerPool --> Redis["Redis — Fila de Jobs + Sessão"]`;

const deployPipelineDiagram = `graph TD
    Push["Push para GitHub"] --> Webhook["Webhook (Go)"]
    Webhook --> Redis["Redis Queue"]
    Redis --> Worker["Worker (Go)"]

    Worker --> Clone["git clone"]
    Worker --> Build["docker build"]
    Clone --> Checkout["checkout"]
    Build --> BuildKit["BuildKit streaming"]
    Checkout --> Run["docker run"]
    BuildKit --> Run
    Run --> Health["health check"]
    Health --> Register["registrar upstream"]
    Register --> Live["App rodando!"]`;

export default function PTArchitecturePage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>{" "}
        <span className="badge badge-perf">Deep Dive</span>
      </div>

      <h1>Arquitetura</h1>
      <p>
        Nidus é projetado para ambientes com recursos limitados. Cada componente é
        escolhido para minimizar uso de memória e maximizar throughput.
      </p>

      <h2>Visão Geral do Sistema</h2>
      <Mermaid chart={systemOverviewDiagram} id="pt-system-overview" />

      <h2>Deep Dive dos Componentes</h2>

      <h3>Control Plane — Go</h3>
      <p>
        O control plane é um binário Go único (~12MB compilado) que lida com:
      </p>
      <ul>
        <li><strong>REST API</strong> — CRUD completo para projetos, deploys, domínios</li>
        <li><strong>Autenticação</strong> — Tokens JWT, API keys, OAuth2 opcional</li>
        <li><strong>Webhook Handler</strong> — Eventos push GitHub/GitLab → fila de deploy</li>
        <li><strong>Fila de Deploy</strong> — Fila baseada em Redis com prioridade e retentativas</li>
      </ul>

      <p><strong>Por que Go?</strong></p>
      <ul>
        <li>Deploy de binário único — sem dependências de runtime</li>
        <li>Goroutines para tratamento concorrente de requests (~2KB stack cada)</li>
        <li>Tempo de startup rápido (&lt;100ms cold start)</li>
        <li>Baixo consumo de memória (~15MB idle, ~50MB sob carga)</li>
        <li>Integração nativa com Docker SDK (sem Docker-in-Docker)</li>
      </ul>

      <h3>Data Plane — Rust</h3>
      <p>
        O data plane é um reverse proxy de alta performance (~4MB binário) que lida com
        todo o tráfego inbound das aplicações deployed.
      </p>

      <p><strong>Por que Rust?</strong></p>
      <ul>
        <li>Sem pausas de garbage collector — latência previsível</li>
        <li>Abstrações de custo zero — código de alto nível, performance de assembly</li>
        <li>Segurança de memória sem overhead em runtime</li>
        <li>Runtime async (Tokio) lida com 100K+ conexões concorrentes</li>
        <li>~8MB RAM idle, processa 50K+ req/s em VPS de $5</li>
      </ul>

      <h2>Comparação de Uso de Memória</h2>
      <div className="not-prose my-8"><MemoryChart /></div>

      <h2>Pipeline de Deploy</h2>
      <Mermaid chart={deployPipelineDiagram} id="pt-deploy-pipeline" />

      <h2>Por que Não Node.js?</h2>
      <table>
        <thead>
          <tr>
            <th>Métrica</th>
            <th>Go</th>
            <th>Node.js</th>
            <th>Python (FastAPI)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tamanho Binário</td>
            <td>12MB</td>
            <td>N/A (runtime)</td>
            <td>N/A (runtime)</td>
          </tr>
          <tr>
            <td>RAM Idle</td>
            <td>15MB</td>
            <td>80MB</td>
            <td>60MB</td>
          </tr>
          <tr>
            <td>Requests/sec (p99)</td>
            <td>45.000</td>
            <td>12.000</td>
            <td>8.000</td>
          </tr>
          <tr>
            <td>Latência p99</td>
            <td>2ms</td>
            <td>8ms</td>
            <td>12ms</td>
          </tr>
          <tr>
            <td>Cold Start</td>
            <td>50ms</td>
            <td>800ms</td>
            <td>1.2s</td>
          </tr>
        </tbody>
      </table>

      <blockquote>
        <strong>Resumo:</strong> Go lhe dá produtividade de desenvolvimento e ecossistema.
        Rust lhe dá performance bruta para o hot path. Juntos, usam
        3x menos memória que alternativas Node.js/PHP enquanto lidam com 4x mais tráfego.
      </blockquote>
    </div>
  );
}
