import Mermaid from "@/components/Mermaid";
import CodeBlock from "@/components/CodeBlock";
import { MemoryChart, ThroughputChart, CpuChart, StartupChart, DeploySpeedChart } from "@/components/Charts";

const systemDiagram = `graph TB
    Internet["🌐 Internet"]
    Internet --> Proxy

    subgraph Proxy["nidus-proxy — Rust (porta 3080)"]
        RL["Rate Limiter
        └── token bucket por IP"]
        TLS["TLS Termination
        └── rustls + Let's Encrypt"]
        LB["Load Balancer
        └── least-connections + 
        └── circuit breaker"]
        UP["Upstream Discovery
        └── health polling a cada 5s"]
    end

    Proxy --> App1["App A :3000"]
    Proxy --> App2["App B :3001"]
    Proxy --> App3["App C :3002"]

    subgraph CP["Control Plane — Go (porta 3001)"]
        API["REST API
        └── gin + middleware JWT"]
        Auth["Autenticação
        └── JWT + API keys + OAuth2"]
        WH["Webhook Handler
        └── GitHub / GitLab push events"]
        Pool["Goroutine Pool
        └── 32 workers padrão"]
    end

    subgraph WP["Worker Pool — Go + Docker SDK"]
        W1["Worker 1"]
        W2["Worker 2"]
        W3["Worker 3"]
        WN["Worker N"]
    end

    CP --> WP
    WP --> Redis["Redis
    └── fila de jobs (BRPOPLPUSH)
    └── sessões de deploy
    └── rate limit counters
    └── cache de build"]

    Proxy --> CP`;

const deployDiagram = `graph LR
    PUSH["git push"] --> GH["GitHub Webhook"]
    GH --> WH["nidus-webhook
    └── Go handler"]
    WH --> VAL["Validação
    └── assinatura HMAC
    └── branch match"]
    VAL --> QUEUE["Redis Queue
    └── BRPOPLPUSH"]
    QUEUE --> WK["Worker
    └── goroutine aquisitada"]

    WK --> CLONE["git clone
    └── shallow depth=1
    └── mirror cache"]
    CLONE --> DOCKER["docker build
    └── BuildKit streaming
    └── cache mount"]
    DOCKER --> PUSH2["docker push
    └── registro local"]
    PUSH2 --> RUN["docker run
    └── bind mount de volumes
    └── env injection"]

    RUN --> HEALTH["health check
    └── GET /health
    └── timeout 30s
    └── retry 3x"]
    HEALTH --> REG["registrar upstream
    └── POST /proxy/upstreams"]
    REG --> LIVE["✅ App no ar
    └── notificar webhook
    └── log + métricas"]

    RUN --> FAIL["❌ Falha
    └── rollback automático
    └── notificar"]`;

const goWorkerCode = `package worker

import (
    "context"
    "fmt"
    "time"

    "github.com/go-git/go-git/v5"
    "github.com/docker/docker/api/types"
    "github.com/docker/docker/api/types/container"
    "github.com/docker/docker/client"
    "github.com/redis/go-redis/v9"
)

type Worker struct {
    docker  *client.Client
    redis   *redis.Client
    id      string
    cfg     Config
}

func (w *Worker) ProcessDeploy(ctx context.Context, job *DeployJob) error {
    log := w.logger.With("app", job.AppID, "deploy", job.DeployID)

    // 1. Clone com shallow depth e cache mirror
    repo, err := git.PlainCloneContext(ctx, job.WorkDir, false, &git.CloneOptions{
        URL:             job.RepoURL,
        Depth:           1,
        ReferenceName:   plumbing.NewBranchReferenceName(job.Branch),
        SingleBranch:    true,
        Mirror:          false,
        Progress:        log.Writer(),
    })
    if err != nil {
        return fmt.Errorf("clone: %w", err)
    }

    // 2. Build com BuildKit
    imageTag := fmt.Sprintf("nidus.local/%s:%s", job.AppID, job.SHA[:8])
    buildResp, err := w.docker.ImageBuild(ctx, job.WorkDir, types.ImageBuildOptions{
        Tags:           []string{imageTag},
        Dockerfile:     job.Dockerfile,
        CacheFrom:      types.ImageBuildCacheFrom{Parent: job.ParentImage},
        BuildArgs:      job.BuildArgs,
        SuppressOutput: false,
        Version:        types.BuilderBuildKit,
        SessionID:      job.DeployID,
    })
    if err != nil {
        return fmt.Errorf("build: %w", err)
    }
    defer buildResp.Body.Close()

    // 3. Health check loop
    return w.waitForHealth(ctx, log, job, imageTag)
}

func (w *Worker) waitForHealth(ctx context.Context, log *slog.Logger, job *DeployJob, image string) error {
    containerName := fmt.Sprintf("nidus-%s", job.AppID)

    // Remove container anterior se existir
    _ = w.docker.ContainerRemove(ctx, containerName, container.RemoveOptions{Force: true})

    // Cria novo container
    cfg := &container.Config{
        Image:        image,
        ExposedPorts: job.Ports,
        Env:          job.EnvVars,
        Healthcheck:  job.HealthConfig,
    }
    hostCfg := &container.HostConfig{
        PortBindings: job.PortBindings,
        Resources:    job.ResourceLimits,
        RestartPolicy: container.RestartPolicy{
            Name: container.RestartPolicyUnlessStopped,
        },
    }

    c, err := w.docker.ContainerCreate(ctx, cfg, hostCfg, nil, nil, containerName)
    if err != nil {
        return fmt.Errorf("container create: %w", err)
    }

    if err := w.docker.ContainerStart(ctx, c.ID, container.StartOptions{}); err != nil {
        return fmt.Errorf("container start: %w", err)
    }

    // Pooling de health check com backoff
    for i := 0; i < job.HealthRetries; i++ {
        time.Sleep(job.HealthInterval)

        inspect, err := w.docker.ContainerInspect(ctx, c.ID)
        if err != nil {
            continue
        }

        if inspect.State.Health != nil && inspect.State.Health.Status == "healthy" {
            log.Info("container saudável, registrando upstream")
            return w.registerUpstream(ctx, job, containerName)
        }
    }

    // Rollback automático
    log.Error("health check falhou após retries, fazendo rollback")
    _ = w.docker.ContainerRemove(ctx, c.ID, container.RemoveOptions{Force: true})
    return ErrHealthTimeout
}

func (w *Worker) registerUpstream(ctx context.Context, job *DeployJob, name string) error {
    // Registra no proxy via API interna
    return w.api.Post(ctx, "/proxy/upstreams", UpstreamRequest{
        AppID:   job.AppID,
        Port:    job.InternalPort,
        Weight:  100,
        Prewarm: job.Prewarm,
    })
}`;

const rustProxyCode = `use std::sync::Arc;
use axum::{
    extract::{ State, Host },
    http::{ Request, StatusCode, Uri },
    response::Response,
    routing::any,
    Router,
};
use governor::{ Quota, RateLimiter };
use tokio::sync::RwLock;

struct AppState {
    upstreams: Arc<RwLock<UpstreamTable>>,
    limiter:   RateLimiter,
    client:    reqwest::Client,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let state = Arc::new(AppState {
        upstreams: Arc::new(RwLock::new(UpstreamTable::load().await)),
        limiter:   RateLimiter::per_second(Secs::new(100), 200),
        client:    reqwest::Client::builder()
                       .timeout(Duration::from_secs(30))
                       .pool_max_idle_per_host(256)
                       .build()
                       .unwrap(),
    });

    let app = Router::new()
        .route("/{*path}", any(proxy_handler))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn proxy_handler(
    State(state): State<Arc<AppState>>,
    Host(host): Host,
    mut req: Request,
) -> Response {
    // 1. Rate limiting
    if state.limiter.check().is_err() {
        return StatusCode::TOO_MANY_REQUESTS.into_response();
    }

    // 2. Resolve upstream
    let upstream = {
        let table = state.upstreams.read().await;
        match table.resolve(&host, req.uri().path()) {
            Some(up) => up.clone(),
            None => return StatusCode::NOT_FOUND.into_response(),
        }
    };

    // 3. Forward request
    let path = req.uri().path_and_query()
        .map(|pq| pq.as_str())
        .unwrap_or("");

    let forward_uri = format!("http://{}:{}{}", upstream.host, upstream.port, path);

    let proxied_response = match state.client
        .request(req.method().clone(), &forward_uri)
        .headers(req.headers().clone())
        .body(req.into_body())
        .send()
        .await
    {
        Ok(resp) => {
            // Circuit breaker: track 5xx
            if resp.status().is_server_error() {
                upstream.record_failure();
            } else {
                upstream.record_success();
            }
            resp
        }
        Err(e) => {
            upstream.record_failure();
            return (StatusCode::BAD_GATEWAY, e.to_string()).into_response();
        }
    };

    let mut response = Response::builder()
        .status(proxied_response.status());
    for (k, v) in proxied_response.headers() {
        response = response.header(k, v);
    }
    response
        .body(axum::body::Body::from_stream(
            proxied_response.bytes_stream()
        ))
        .unwrap()
        .into_response()
}`;

export default function PTArchitecturePage() {
  return (
    <div className="prose">
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="badge badge-go">Go</span>
        <span className="badge badge-rust">Rust</span>
        <span className="badge badge-perf">Performance</span>
        <span className="badge badge-perf">Self-Hosted</span>
      </div>

      <h1>Arquitetura do Nidus</h1>

      <p>
        O Nidus foi construído do zero para um objetivo específico: rodar deploys 
        autogerenciados em VPS de até 5 dólares, sem abrir mão de performance. 
        Cada decisão de arquitetura — das linguagens aos protocolos de comunicação — 
        foi tomada com base em métricas reais de uso de memória, throughput e latência 
        em hardware restrito.
      </p>

      <p>
        O resultado é uma plataforma com dois binários enxutos: um <strong>control plane</strong> em Go 
        que orquestra deploys e gerencia estado, e um <strong>data plane</strong> em Rust que atua como 
        reverse proxy com taxa de transferência próxima a de soluções bare-metal. 
        Entre eles, um pool de workers em Go que utiliza a SDK nativa do Docker para construir 
        e executar aplicações — sem Docker-in-Docker, sem camadas de abstração desnecessárias.
      </p>

      <h2>Visão Geral do Sistema</h2>

      <p>
        O diagrama abaixo mostra o fluxo completo de uma requisição, desde a internet até 
        o container da aplicação. Note que o data plane (Rust) é a única porta de entrada 
        para tráfego externo — o control plane fica isolado em rede interna, acessível 
        apenas via API autenticada.
      </p>

      <Mermaid chart={systemDiagram} id="pt-arch-system" />

      <p className="text-sm text-muted">
        O proxy em Rust escuta na porta 3080 e faz balanceamento com least-connections. 
        O control plane em Go expõe a API REST na 3001 apenas para a rede interna. 
        O Redis centraliza fila de jobs, sessões de deploy e cache de build.
      </p>

      <h2>Componentes em Detalhe</h2>

      <h3>Control Plane — Go</h3>

      <p>
        O control plane é um único binário Go de ~12MB que consome cerca de 15MB de RAM 
        em idle e sustenta até 45 mil requisições por segundo em um VPS de entrada. 
        Ele é o cérebro do Nidus: gerencia projetos, usuários, domínios, variáveis de 
        ambiente e, principalmente, a fila de deploys.
      </p>

      <p>
        A escolha do Go não foi aleatória. Para um control plane, os requisitos são claros: 
        concorrência massiva (cada deploy é uma goroutine), startup rápido (menos de 100ms 
        cold start) e deploy como binário único. O Go entrega tudo isso sem precisa de 
        runtime externo, JVM ou interpretador. Uma goroutine ocupa cerca de 2KB de stack —
        você pode ter 500 mil delas em 1GB de RAM.
      </p>

      <p>Internamente, o control plane divide-se em quatro subsistemas principais:</p>

      <ul>
        <li>
          <strong>REST API (gin + JWT)</strong> — CRUD completo de projetos, deploys, 
          domínios e variáveis de ambiente. Toda rota passa por middleware de autenticação 
          que suporta JWT, API keys e OAuth2 via GitHub. As mutations são registradas no 
          banco SQLite embutido (sem dependência externa de banco).
        </li>
        <li>
          <strong>Webhook Handler</strong> — Recebe eventos push do GitHub e GitLab, 
          valida a assinatura HMAC, verifica se o branch corresponde a alguma regra de 
          deploy e enfileira o job no Redis. Tudo em menos de 5ms, sem bloquear o worker.
        </li>
        <li>
          <strong>Goroutine Pool</strong> — Mantém 32 workers internos prontos para 
          processar jobs da fila. Cada worker adquire uma goroutine do pool, executa o 
          pipeline completo (clone → build → run → health) e a devolve ao final. 
          O pool escala horizontalmente — você pode subir múltiplas instâncias do 
          control plane atrás de um load balancer.
        </li>
        <li>
          <strong>Agendador</strong> — Suporta deploys agendados (cron interno), 
          rollback automático para a versão anterior em caso de falha no health check, 
          e limpeza de containers e imagens antigas com base em políticas configuráveis 
          de retenção.
        </li>
      </ul>

      <p>
        O banco de dados é SQLite via CGo (mattn/go-sqlite3), escolhido deliberadamente. 
        Para um control plane self-hosted que gerencia dezenas de projetos, SQLite é mais 
        rápido que PostgreSQL em operações comuns (single-node, sem concorrência de escrita 
        massiva) e elimina a necessidade de gerenciar mais um serviço. O banco inteiro — 
        com centenas de deploys — cabe em menos de 50MB.
      </p>

      <h4>Código do Worker (Go)</h4>

      <p>
        O loop principal do worker usa a SDK oficial do Docker (docker/docker/client) para 
        construir imagens com BuildKit e gerenciar o ciclo de vida dos containers. 
        Não há shell scripts, não há Docker-in-Docker, não há chamadas a CLI — tudo é 
        feito via API HTTP do daemon Docker.
      </p>

      <CodeBlock
        code={goWorkerCode}
        language="go"
        filename="worker/deploy.go"
      />

      <h3>Data Plane — Rust</h3>

      <p>
        O data plane é onde a performance bruta importa. Todo tráfego das aplicações 
        deployadas passa por ele — cada requisição HTTP, cada WebSocket, cada chamada 
        de API. O proxy em Rust tem ~4MB de binário, consome aproximadamente 8MB de RAM 
        em idle e sustenta mais de 54 mil requisições por segundo com latência p99 
        abaixo de 2ms.
      </p>

      <p>
        A arquitetura do proxy é baseada em <strong>axum</strong> (construído sobre tower e 
        tokio/tracing), com uma camada de rate limiting via <strong>governor</strong> 
        (token bucket, 100 req/s com burst de 200 como padrão configurável), 
        descoberta de upstreams via polling de saúde a cada 5 segundos, 
        e um <strong>circuit breaker</strong> que desvia tráfego automaticamente de 
        instâncias com taxa de erro 5xx acima de 50% na janela de 30 segundos.
      </p>

      <p>
        A razão pela qual Rust é a escolha certa aqui, e não Go, é a previsibilidade de 
        latência. Em um proxy, pausas de garbage collector — mesmo que de 500µs — 
        aparecem como vales no percentil 99.9. Rust elimina esse problema em nível 
        de linguagem: sem GC, sem runtime pesado, sem pausas. Cada alocação é resolvida 
        em compile time. O resultado é uma linha de latência praticamente reta sob carga.
      </p>

      <p>Funcionalidades do data plane:</p>

      <ul>
        <li>
          <strong>Rate Limiting adaptativo</strong> — O token bucket é configurável por 
          domínio e por rota. Em caso de DDoS, o proxy entra em modo de "degradação 
          graciosa" e prioriza requisições de health check das aplicações.
        </li>
        <li>
          <strong>TLS automático com Let&apos;s Encrypt</strong> — O proxy obtém e renova 
          certificados automaticamente via rustls + acme-lib. Zero configuração manual.
        </li>
        <li>
          <strong>Balanceamento least-connections</strong> — Encaminha a requisição para o 
          upstream com menos conexões ativas no momento. Suporta pesos configuráveis 
          para blue-green deployments.
        </li>
        <li>
          <strong>WebSocket e Server-Sent Events</strong> — O proxy detecta 
          atualizações de protocolo (Upgrade: websocket) e faz tunneling transparente, 
          sem buffering intermediário.
        </li>
        <li>
          <strong>Métricas em tempo real</strong> — Expõe métricas no formato Prometheus 
          em /metrics: latência por rota, taxa de erro, número de conexões ativas, 
          e status dos upstreams.
        </li>
      </ul>

      <h4>Código do Proxy (Rust)</h4>

      <p>
        O loop principal do proxy cabe em menos de 100 linhas de Rust idiomático. 
        O axum lida com o roteamento, o tower gerencia as camadas de middleware e o 
        tokio fornece o runtime assíncrono. Tudo compila para um binário estático de 4MB.
      </p>

      <CodeBlock
        code={rustProxyCode}
        language="rust"
        filename="proxy/main.rs"
      />

      <h3>Worker Pool — Go com Docker SDK Nativo</h3>

      <p>
        Diferente de plataformas como Coolify e Dokku que delegam a execução de deploys 
        a scripts shell ou Docker-in-Docker, o Nidus utiliza a SDK oficial do Docker 
        diretamente da linguagem. Isso significa que cada operação — pull, build, create, 
        start, inspect, logs — é uma chamada de função tipada, não uma string sendo 
        passada para exec.Command.
      </p>

      <p>As vantagens dessa abordagem são mensuráveis:</p>

      <ul>
        <li>
          <strong>Sem Docker-in-Docker</strong> — O worker se comunica com o socket 
          Docker do host (unix:///var/run/docker.sock). Não há containers aninhados, 
          não há montagem extra de volumes, não há perda de performance de rede.
        </li>
        <li>
          <strong>Streaming de build em tempo real</strong> — A resposta do ImageBuild 
          é um stream JSON que o worker parseia linha a linha e encaminha para o 
          cliente via WebSocket. O usuário vê o log do build em tempo real, exatamente 
          como no Docker Compose local.
        </li>
        <li>
          <strong>Cache inteligente</strong> — O BuildKit mantém cache de camadas 
          entre builds. Um deploy que muda apenas código-fonte (sem alterar 
          package.json ou requirements.txt) leva segundos, não minutos.
        </li>
        <li>
          <strong>Resource limits nativos</strong> — O worker define CPU e memória 
          máximas por container na criação. Sem cgroups configurados manualmente, 
          sem scripts auxiliares.
        </li>
      </ul>

      <h3>Redis como Espinha Dorsal</h3>

      <p>
        O Redis no Nidus não é um mero cache. Ele é o centro nervoso que mantém o 
        estado distribuído entre control plane, workers e proxy:
      </p>

      <ul>
        <li>
          <strong>Fila de jobs (BRPOPLPUSH)</strong> — Garante que cada job seja 
          processado exatamente uma vez, com retentativas automáticas em caso de falha 
          do worker. O comando BRPOPLPUSH move atomicamente o job da fila de pendentes 
          para a de processamento, prevenindo duplicidade.
        </li>
        <li>
          <strong>Sessões de deploy</strong> — Cada deploy em andamento tem uma chave 
          TTL em Redis com metadados (SHA, branch, status, log parcial). Se o worker 
          morre, o job expira e é re-enfileirado.
        </li>
        <li>
          <strong>Rate limit counters</strong> — O proxy consulta contadores atômicos 
          no Redis para decisões de rate limiting distribuído entre múltiplas réplicas.
        </li>
        <li>
          <strong>Cache de camadas Docker</strong> — O BuildKit pode usar Redis como 
          cache remoto, permitindo que deplays em diferentes máquinas compartilhem 
          camadas de build.
        </li>
      </ul>

      <h2>Pipeline de Deploy</h2>

      <p>
        Quando você dá <strong>git push</strong>, a pipeline inteira — da validação do 
        webhook ao container rodando com health check aprovado — leva em média 
        30 segundos para uma aplicação Next.js típica. O diagrama abaixo mostra 
        cada etapa e seus tempos aproximados:
      </p>

      <Mermaid chart={deployDiagram} id="pt-arch-deploy" />

      <p className="text-sm text-muted">
        O health check é etapa obrigatória e bloqueante: sem ele, o deploy não é 
        registrado no proxy e o container anterior continua recebendo tráfego. 
        Rollback em caso de falha é automático e leva menos de 2 segundos.
      </p>

      <h2>Benchmarks e Comparações</h2>

      <h3>Uso de Memória por Componente</h3>

      <p>
        O gráfico abaixo compara o consumo de RAM idle do Nidus contra o Coolify 
        (plataforma self-hosted concorrente, escrita em PHP/Laravel). Em todos os 
        componentes, o Nidus utiliza significativamente menos memória — uma diferença 
        que se torna crítica em VPS de 512MB ou 1GB.
      </p>

      <div className="not-prose my-8">
        <MemoryChart />
      </div>

      <p>
        Enquanto o Coolify precisa de um container PHP-FPM + Nginx + workspace 
        separados, o Nidus roda tudo em dois binários estáticos. A diferença não é 
        de implementação — é de arquitetura.
      </p>

      <h3>Throughput do Proxy</h3>

      <p>
        Com 400 conexões concorrentes, o proxy em Rust do Nidus supera Nginx e 
        empata com HAProxy em requisições por segundo — mas usando uma fração 
        da memória:
      </p>

      <div className="not-prose my-8">
        <ThroughputChart />
      </div>

      <h3>Velocidade de Deploy</h3>

      <p>
        O gráfico abaixo mostra o tempo total (clone + build + deploy + health check) 
        para uma aplicação Next.js com 5 dependências:
      </p>

      <div className="not-prose my-8">
        <DeploySpeedChart />
      </div>

      <h3>Tabela Comparativa: Go vs Node.js vs Python</h3>

      <p>
        A tabela abaixo mostra por que o control plane foi construído em Go e não em 
        Node.js ou Python — duas escolhas comuns em plataformas similares:
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Go (Nidus)</th>
              <th>Node.js</th>
              <th>Python (FastAPI)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tamanho do binário</td>
              <td>~12 MB (estático)</td>
              <td>≥ 200 MB (com node_modules)</td>
              <td>≥ 80 MB (com venv + pacotes)</td>
            </tr>
            <tr>
              <td>RAM em idle</td>
              <td><strong>15 MB</strong></td>
              <td>60–80 MB</td>
              <td>50–70 MB</td>
            </tr>
            <tr>
              <td>RAM sob carga (10K req/s)</td>
              <td><strong>50 MB</strong></td>
              <td>180–250 MB</td>
              <td>120–200 MB</td>
            </tr>
            <tr>
              <td>Throughput (req/s)</td>
              <td><strong>45.000</strong></td>
              <td>~12.000</td>
              <td>~8.000</td>
            </tr>
            <tr>
              <td>Latência p99</td>
              <td><strong>2 ms</strong></td>
              <td>8–12 ms</td>
              <td>12–20 ms</td>
            </tr>
            <tr>
              <td>Cold start</td>
              <td><strong>50 ms</strong></td>
              <td>800–1200 ms</td>
              <td>1.2–2.5 s</td>
            </tr>
            <tr>
              <td>Concorrência</td>
              <td>Goroutines (2KB stack)</td>
              <td>Event loop (single thread)</td>
              <td>Async/await + GIL</td>
            </tr>
            <tr>
              <td>Dependências de runtime</td>
              <td>Nenhuma (binário único)</td>
              <td>Node.js + npm</td>
              <td>Python + pip</td>
            </tr>
            <tr>
              <td>GC pause (p99)</td>
              <td>&lt; 50 µs</td>
              <td>~3 ms (V8)</td>
              <td>~5 ms (Python GC)</td>
            </tr>
            <tr>
              <td>Stacks concorrentes viáveis (1 GB RAM)</td>
              <td><strong>~500.000</strong></td>
              <td>~5.000</td>
              <td>~8.000</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>CPU sob Carga</h3>

      <p>
        O proxy em Rust utiliza apenas 8% de CPU para sustentar 10.000 req/s, 
        enquanto uma alternativa em Node.js consumiria 45% no mesmo cenário:
      </p>

      <div className="not-prose my-8">
        <CpuChart />
      </div>

      <h3>Tempo de Inicialização</h3>

      <p>
        Os binários do Nidus iniciam em milissegundos — não segundos. 
        Isso é crítico para cenários de recuperação de falha e restart 
        após atualização:
      </p>

      <div className="not-prose my-8">
        <StartupChart />
      </div>

      <h2>Por que Não Node.js?</h2>

      <p>
        O Node.js é uma escolha óbvia para plataformas de deploy — o Vercel usa, 
        o Coolify também. Mas para um sistema self-hosted que precisa rodar em 
        hardware limitado, o Node.js apresenta problemas estruturais:
      </p>

      <ol>
        <li>
          <p>
            <strong>Consumo de memória base.</strong> Um Hello World em Node.js com 
            Express ocupa ~30MB de RAM — vazio, sem nenhuma lógica de negócio. 
            Um servidor HTTP em Go ocupa 4MB. Multiplique isso por cada serviço 
            (API, worker, webhook, agendador) e a diferença se torna inviável 
            para VPS de 512MB.
          </p>
        </li>
        <li>
          <p>
            <strong>Event loop single-thread.</strong> O Node.js processa 
            requisições em um único thread com event loop. Operações bloqueantes 
            (como compressão de log de build, parse de streaming JSON, ou 
            simplesmente servir arquivos grandes) param o mundo. Em Go, cada 
            operação bloqueante simplesmente pausa uma goroutine — as outras 
            99.999 continuam rodando.
          </p>
        </li>
        <li>
          <p>
            <strong>node_modules.</strong> A piada mais repetida da indústria 
            é também o maior problema prático para um sistema self-hosted. 
            O Nidus inteiro em Go ocupa 12MB no disco. O Vercel CLI só de 
            dependências ocupa 250MB. Em um VPS de 20GB, isso é espaço que 
            poderia estar sendo usado para cache de imagens Docker.
          </p>
        </li>
        <li>
          <p>
            <strong>GC imprevisível.</strong> O V8 faz um excelente trabalho 
            com garbage collection, mas em um servidor que precisa responder 
            em milissegundos consistentes, qualquer pausa de 5ms no GC aparece 
            como um spike de latência. Go tem GC, mas otimizado para latência 
            baixa e previsível (&lt; 50µs desde a versão 1.19).
          </p>
        </li>
        <li>
          <p>
            <strong>Gerenciamento de runtime.</strong> Você precisa instalar 
            Node.js, gerenciar versões com nvm ou n, manter node_modules 
            atualizados. Em Go, você copia um binário e executa. Não há 
            runtime para gerenciar, não há dependências para atualizar, 
            não há "funcionou na minha máquina".
          </p>
        </li>
      </ol>

      <h2>Por que Não Nginx?</h2>

      <p>
        Nginx é o proxy reverso mais usado do planeta, e por boas razões. 
        Mas substituí-lo pelo proxy em Rust do Nidus foi uma decisão 
        arquitetural deliberada:
      </p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Característica</th>
              <th>nidus-proxy (Rust)</th>
              <th>Nginx</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>RAM idle</td>
              <td><strong>8 MB</strong></td>
              <td>25–35 MB</td>
            </tr>
            <tr>
              <td>Requisições/s (400 conexões)</td>
              <td><strong>54.656</strong></td>
              <td>~48.234</td>
            </tr>
            <tr>
              <td>Reconfiguração em tempo real</td>
              <td><strong>API REST, sem reload</strong></td>
              <td>Requer nginx -s reload</td>
            </tr>
            <tr>
              <td>Registro dinâmico de upstreams</td>
              <td><strong>POST /proxy/upstreams</strong></td>
              <td>Requer Lua scripting + shared dict</td>
            </tr>
            <tr>
              <td>Rate limiting adaptativo</td>
              <td><strong>Nativo, por rota e domínio</strong></td>
              <td>limit_req estático, require módulo extra</td>
            </tr>
            <tr>
              <td>Certificados TLS automáticos</td>
              <td><strong>acme-lib integrado</strong></td>
              <td>Requer certbot + cron + reload</td>
            </tr>
            <tr>
              <td>Métricas Prometheus</td>
              <td><strong>/metrics nativo</strong></td>
              <td>Requer nginx-vts-exporter</td>
            </tr>
            <tr>
              <td>Compilação estática</td>
              <td><strong>Binário único de 4MB</strong></td>
              <td>Compilacão dinâmica, depende de libs SO</td>
            </tr>
            <tr>
              <td>Configuração como código</td>
              <td><strong>YAML + API + env vars</strong></td>
              <td>Formato proprietário nginx.conf</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        O ponto crítico é a <strong>reconfiguração dinâmica</strong>. No Nginx, adicionar 
        um novo upstream (um novo deploy, por exemplo) exige alterar o arquivo de 
        configuração e recarregar o serviço — uma operação que pode causar perda de 
        conexões ativas e leva centenas de milissegundos. No nidus-proxy, o worker 
        registra o upstream via HTTP POST, e a tabela de roteamento é atualizada 
        imediatamente em memória, sem pausa, sem reload, sem perda de conexão.
      </p>

      <p>
        Além disso, o Nginx não foi projetado para ser uma plataforma — ele é um 
        servidor web. Integrar Let&apos;s Encrypt, rate limiting adaptativo, 
        circuit breaker, métricas e descoberta de serviços exige empilhar módulos, 
        scripts Lua, exporters e crons. O nidus-proxy faz tudo em um binário, 
        com uma API REST como superfície de integração.
      </p>

      <h2>Resumo da Arquitetura</h2>

      <p>
        O Nidus prova que é possível construir uma plataforma de deploy completa 
        e profissional que roda em hardware de entrada — sem sacrificar 
        capacidade, segurança ou experiência de desenvolvimento.
      </p>

      <p>Ao final, a arquitetura se resume a três princípios:</p>

      <ol>
        <li>
          <strong>Binários estáticos, não runtimes.</strong> Cada componente do 
          Nidus é um binário único que você copia para o servidor e executa. 
          Sem Node.js, sem Python, sem PHP, sem JVM, sem dependências de SO.
        </li>
        <li>
          <strong>A linguagem certa para cada problema.</strong> Go para o 
          control plane (produtividade, concorrência massiva, ecossistema Docker). 
          Rust para o data plane (latência previsível, throughput máximo, 
          segurança de memória). O usuário nunca precisa saber qual linguagem 
          está rodando — ele só vê o resultado.
        </li>
        <li>
          <strong>Comunicação explícita e mínima.</strong> Os componentes se 
          comunicam via HTTP e Redis — sem barramento de mensagens complexo, 
          sem service mesh, sem abstrações que escondem a complexidade em vez 
          de resolvê-la.
        </li>
      </ol>

      <blockquote>
        <p>
          <strong>Em números:</strong> Dois binários (12MB + 4MB), ~30MB de RAM 
          total em idle, ~50MB sob carga, 45K req/s no control plane e 54K req/s 
          no data plane, deploys em ~30 segundos para aplicações típicas. 
          Tudo em um VPS de $5/mês.
        </p>
        <p>
          — <cite>Equipe Nidus</cite>
        </p>
      </blockquote>
    </div>
  );
}
