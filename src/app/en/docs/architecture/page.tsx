import Mermaid from "@/components/Mermaid";
import CodeBlock from "@/components/CodeBlock";
import { MemoryChart } from "@/components/Charts";

const systemDiagram = `graph TB
    subgraph Internet["🌐 Internet"]
        User["Usuário"]
        Webhook["GitHub Webhook"]
    end

    subgraph Proxy["nidus-proxy (Rust) — Porta 3080"]
        direction LR
        TLS["TLS Termination"]
        RL["Rate Limiter"]
        LB["Load Balancer"]
    end

    subgraph Apps["Aplicações Deployadas"]
        App1["App 1 :3000"]
        App2["App 2 :3001"]
        App3["App 3 :3002"]
    end

    subgraph Control["Control Plane (Go) — Porta 3001"]
        API["REST API"]
        Auth["Auth JWT/OAuth"]
        WH["Webhook Handler"]
        Queue["Deploy Queue"]
    end

    subgraph Workers["Worker Pool (Go Goroutines)"]
        W1["Worker 1"]
        W2["Worker 2"]
        W3["Worker n"]
    end

    Redis["Redis\nJob Queue\nSession Store"]

    User --> Proxy
    Proxy --> Apps
    Webhook --> WH
    Control --> Workers
    Workers --> Redis
    Redis --> Workers`;

const deployDiagram = `graph LR
    A[("📦 Push no GitHub")] --> B["🔔 Webhook (Go)"]
    B --> C["📋 Redis Queue"]
    C --> D["⚙️ Worker (Go)"]
    D --> E["📥 git clone"]
    D --> F["🐳 docker build"]
    E --> G["📂 checkout"]
    F --> H["🔨 BuildKit"]
    G --> I["▶️ docker run"]
    H --> I
    I --> J["❤️ health check"]
    J --> K["🔗 register upstream"]
    K --> L["✅ App live!"]`;

export default function ArchitecturePage() {
  return (
    <div className="prose">
      <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.5rem" }}>
        <span className="badge badge-go">Go</span>
        <span className="badge badge-rust">Rust</span>
        <span className="badge badge-perf">Deep Dive</span>
      </div>

      <h1>Arquitetura do Nidus</h1>

      <p>
        Nidus foi projetado do zero para ambientes com recursos limitados. Cada decisão
        técnica — da escolha de linguagens ao design de cada componente — foi tomada
        com um objetivo: <strong>máximo desempenho com mínimo de recursos</strong>.
      </p>

      <p>
        Enquanto concorrentes como Coolify e Conecthu empilham containers sobre containers
        (Node.js rodando PHP que orquestra Docker-in-Docker), Nidus faz o oposto: dois
        binários compilados (Go + Rust) que somados ocupam menos de 20MB de RAM em idle.
      </p>

      <h2>Visão Geral do Sistema</h2>

      <p>
        O fluxo é simples: o tráfego chega pela internet, passa pelo proxy em Rust que faz
        TLS, rate limiting e load balancing, e é roteado para a aplicação correta. Em paralelo,
        o control plane em Go gerencia deploys, autenticação e webhooks.
      </p>

      <Mermaid chart={systemDiagram} id="system-overview" />

      <h2>Componentes em Detalhe</h2>

      <h3>Control Plane — Go</h3>
      <p>
        O control plane é um único binário Go de ~12MB. Ele roda na porta 3001 e concentra
        toda a lógica de negócio: API REST, autenticação JWT, handlers de webhook e a fila
        de deploys. Escolhemos Go por três razões:
      </p>

      <ul>
        <li><strong>Binário único</strong> — sem dependências de runtime. Copia e executa.</li>
        <li><strong>Goroutines</strong> — cada requisição consome ~2KB de stack. 1000 conexões simultâneas = 2MB.</li>
        <li><strong>Compilação rápida</strong> — iteramos rápido. O build completo leva segundos.</li>
      </ul>

      <p>
        O resultado é um servidor que <strong>consome 15MB em idle</strong> e responde
        a 45.000 requisições por segundo com latência p99 de 4.2ms. Para comparação, um
        servidor Express (Node.js) equivalente consome 80MB e faz 12.000 req/s.
      </p>

      <CodeBlock
        code={`func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
    // 15MB de RAM. 45K req/s. Sem runtime.
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status":  "ok",
        "version": "1.0.0",
        "uptime":  time.Since(startTime).String(),
        "goroutines": runtime.NumGoroutine(),
    })
}`}
        language="go"
        filename="server.go"
      />

      <h3>Data Plane — Rust</h3>
      <p>
        O proxy reverso em Rust é o componente mais crítico em termos de performance. Ele
        lida com todo o tráfego de entrada — centenas de milhares de conexões concorrentes — e
        precisa fazer isso com latência mínima.
      </p>

      <p>
        Rust foi a escolha natural porque oferece performance de C com segurança de memória.
        Sem garbage collector, sem pausas, sem overhead. O binário tem ~4MB e consome
        <strong>8MB de RAM em idle</strong>, processando 54.656 req/s em um VPS de $5.
      </p>

      <CodeBlock
        code={`use hyper::{Request, Response, Body};
use tower::ServiceBuilder;
use std::time::Instant;

pub async fn handle_request(req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
    let start = Instant::now();
    let upstream = resolve_upstream(&req).await?;

    let response = proxy_request(upstream, req).await?;

    // Cada request adiciona ~2ms de latência
    tracing::info!(
        latency_ms = start.elapsed().as_millis(),
        upstream = %upstream.addr,
    );

    Ok(response)
}`}
        language="rust"
        filename="proxy.rs"
      />

      <h3>Worker Pool — Go</h3>
      <p>
        O worker é onde o deploy acontece de verdade. Diferente de soluções que usam
        Docker-in-Docker (como Coolify e Conecthu), o worker do Nidus se comunica
        <strong>diretamente com a API do Docker</strong> através do SDK nativo. Isso
        elimina uma camada inteira de indireção.
      </p>

      <p>O pipeline de deploy completo:</p>

      <ol>
        <li>Recebe o job da fila Redis</li>
        <li>Clona o repositório Git</li>
        <li>Faz docker build com BuildKit (direto, sem DinD)</li>
        <li>Para o container antigo</li>
        <li>Sobe o novo container</li>
        <li>Espera o health check (timeout configurável)</li>
        <li>Registra o upstream no proxy</li>
      </ol>

      <Mermaid chart={deployDiagram} id="deploy-pipeline" />

      <p>
        O resultado é um deploy cold em <strong>12.3 segundos</strong> — contra 34.2s do
        Coolify. Em deploys com cache (quando a imagem já foi construída antes), o tempo
        cai para <strong>3.8 segundos</strong>.
      </p>

      <CodeBlock
        code={`func (w *Worker) deploy(job *DeployJob) error {
    // 1. Clona o repo
    git.PlainClone(job.RepoURL, workDir)

    // 2. Build direto com Docker SDK
    image, _ := w.docker.ImageBuild(ctx, buildCtx, types.ImageBuildOptions{
        Dockerfile: "Dockerfile",
    })

    // 3. Sobe novo container
    container, _ := w.docker.ContainerCreate(ctx, &container.Config{
        Image: image.ID,
    })

    // 4. Health check
    if err := w.waitHealth(container, 30*time.Second); err != nil {
        w.rollback(job) // rollback automático
        return err
    }

    // 5. Registra no proxy
    return w.proxy.Register(job.Slug, container.Address())
}`}
        language="go"
        filename="worker.go"
      />

      <h2>Consumo de Memória</h2>
      <p>
        A tabela abaixo mostra o consumo de cada componente em idle. Enquanto Nidus soma
        ~87MB, concorrentes como Coolify consomem mais de 270MB — sem contar o overhead
        de Docker-in-Docker que adiciona mais 50-100MB dependendo da carga.
      </p>

      <MemoryChart />

      <h2>Por que Não Node.js?</h2>
      <p>
        Esta pergunta surge com frequência. Node.js é uma plataforma excelente para
        aplicações web, mas para um sistema de deploy self-hosted, ele apresenta problemas
        fundamentais:
      </p>

      <ul>
        <li>Runtime pesado — 80MB+ só pra iniciar</li>
        <li>Garbage collector imprevisível — pausas que afetam latência</li>
        <li>Single-threaded — não aproveita CPUs modernas sem clustering manual</li>
        <li>Dependências frágeis — node_modules, compatibilidade quebrada</li>
      </ul>

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
          <tr><td>Binário</td><td>12MB</td><td>N/A (runtime)</td><td>N/A (runtime)</td></tr>
          <tr><td>RAM Idle</td><td>15MB</td><td>80MB</td><td>60MB</td></tr>
          <tr><td>Req/s (p99)</td><td>45.000</td><td>12.000</td><td>8.000</td></tr>
          <tr><td>Latência p99</td><td>2ms</td><td>8ms</td><td>12ms</td></tr>
          <tr><td>Cold Start</td><td>50ms</td><td>800ms</td><td>1.2s</td></tr>
        </tbody>
      </table>

      <h2>Por que Não Nginx?</h2>
      <p>
        Nginx é um proxy maduro e estável, mas foi projetado para um mundo estático —
        você configura os upstreams uma vez e dificilmente os altera. No Nidus, aplicações
        sobem e descem o tempo todo. O proxy em Rust foi construído para este cenário:
      </p>

      <ul>
        <li><strong>Upstreams dinâmicos</strong> — workers registram e removem upstreams via API, sem reload de config</li>
        <li><strong>Rate limiting distribuído</strong> — token bucket com Redis, não por processo</li>
        <li><strong>Health checks ativos</strong> — upstreams com falha são removidos automaticamente</li>
        <li><strong>Logs estruturados</strong> — JSON com request ID, latência, upstream, status code</li>
        <li><strong>WebSocket nativo</strong> — sem módulos especiais, suporte async nativo</li>
      </ul>

      <blockquote>
        <strong>Em resumo:</strong> Go te dá produtividade e ecossistema. Rust te dá
        performance bruta. Juntos, eles usam 3x menos memória que alternativas Node.js/PHP
        e lidam com 4x mais tráfego. Tudo isso rodando em um VPS de $5/mês.
      </blockquote>
    </div>
  );
}
