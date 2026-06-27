import Mermaid from "@/components/Mermaid";
import CodeBlock from "@/components/CodeBlock";
import { MemoryChart } from "@/components/Charts";

const systemOverviewDiagram = `graph TD
    Internet["Internet"]
    Internet --> Proxy

    subgraph Proxy["nidus-proxy (Rust) — Port 3080"]
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
        Queue["Deploy Queue"]
    end

    subgraph WorkerPool["Worker Pool (Go goroutines)"]
        GW1["GW1"]
        GW2["GW2"]
        GW3["GW3"]
        GW4["... GWn"]
    end

    ControlPlane --> WorkerPool
    WorkerPool --> Redis["Redis — Job Queue + Session Store"]`;

const deployPipelineDiagram = `graph TD
    Push["Push to GitHub"] --> Webhook["Webhook (Go)"]
    Webhook --> Redis["Redis Queue"]
    Redis --> Worker["Worker (Go)"]

    Worker --> Clone["git clone"]
    Worker --> Build["docker build"]
    Clone --> Checkout["checkout"]
    Build --> BuildKit["BuildKit streaming"]
    Checkout --> Run["docker run"]
    BuildKit --> Run
    Run --> Health["health check"]
    Health --> Register["register upstream"]
    Register --> Live["App is live"]`;

export default function ArchitecturePage() {
  return (
    <div className="prose">
      <div className="mb-4">
        <span className="badge badge-go">Go</span>{" "}
        <span className="badge badge-rust">Rust</span>{" "}
        <span className="badge badge-perf">Deep Dive</span>
      </div>

      <h1>Architecture</h1>
      <p>
        Nidus is designed for resource-constrained environments. Every component is
        chosen to minimize memory usage and maximize throughput. Here&apos;s the full picture.
      </p>

      <h2>System Overview</h2>
      <Mermaid chart={systemOverviewDiagram} id="system-overview" />

      <h2>Component Deep Dive</h2>

      <h3>Control Plane — Go</h3>
      <p>
        The control plane is a single Go binary (~12MB compiled) that handles:
      </p>
      <ul>
        <li><strong>REST API</strong> — Full CRUD for projects, deploys, domains</li>
        <li><strong>Authentication</strong> — JWT tokens, API keys, optional OAuth2</li>
        <li><strong>Webhook Handler</strong> — GitHub/GitLab push events → deploy queue</li>
        <li><strong>Deploy Queue</strong> — Redis-backed job queue with priority and retries</li>
      </ul>

      <p><strong>Why Go?</strong></p>
      <ul>
        <li>Single binary deployment — no runtime dependencies</li>
        <li>Goroutines for concurrent request handling (~2KB stack each)</li>
        <li>Fast startup time (&lt;100ms cold start)</li>
        <li>Low memory footprint (~15MB idle, ~50MB under load)</li>
        <li>Native Docker SDK integration (no Docker-in-Docker)</li>
      </ul>

      <CodeBlock
        code={`// Deploy worker uses native Docker SDK
func (w *Worker) buildImage(ctx context.Context, project *Project) error {
    buildCtx, err := archive.TarWithOptions(".", &archive.TarOptions{})
    if err != nil {
        return fmt.Errorf("archive build context: %w", err)
    }

    resp, err := w.docker.ImageBuild(ctx, buildCtx, types.ImageBuildOptions{
        Dockerfile: "Dockerfile",
        Tags:       []string{project.ImageTag()},
        Labels:     map[string]string{"nidus.project": project.Slug},
    })
    if err != nil {
        return fmt.Errorf("build image: %w", err)
    }
    defer resp.Body.Close()

    // Stream build output to deploy logs
    return json.NewDecoder(resp.Body).Decode(&buildLogger{})
}`}
        language="go"
        filename="worker.go"
      />

      <h3>Data Plane — Rust</h3>
      <p>
        The data plane is a high-performance reverse proxy (~4MB binary) that handles all
        inbound traffic to deployed applications.
      </p>

      <p><strong>Why Rust?</strong></p>
      <ul>
        <li>No garbage collector pauses — predictable latency</li>
        <li>Zero-cost abstractions — high-level code, assembly-level performance</li>
        <li>Memory safety without runtime overhead</li>
        <li>Async runtime (Tokio) handles 100K+ concurrent connections</li>
        <li>~8MB RAM idle, handles 50K req/s on a $5 VPS</li>
      </ul>

      <CodeBlock
        code={`use hyper::{Request, Response, Body};
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, rate_limit::RateLimitLayer};

pub async fn start_proxy(config: Config) -> Result<()> {
    let svc = ServiceBuilder::new()
        .layer(CorsLayer::permissive())
        .layer(RateLimitLayer::new(
            config.rate_limit.requests,
            config.rate_limit.window,
        ))
        .layer(TlsLayer::new(&config.tls))
        .service(tower::service_fn(|req: Request<Body>| async move {
            let upstream = resolve_upstream(&req).await?;
            let start = Instant::now();

            let mut proxy_req = Request::builder()
                .uri(upstream.addr)
                .body(Body::from(req.into_body()))?;

            // Forward headers
            for (key, val) in req.headers() {
                proxy_req.headers_mut().insert(key.clone(), val.clone());
            }

            // Add Nidus headers for debugging
            proxy_req.headers_mut().insert(
                "X-Nidus-Latency",
                HeaderValue::from(start.elapsed().as_millis() as u64),
            );

            let client = Client::new();
            client.request(proxy_req).await
        }));

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    Server::bind(&addr).serve(svc).await?;
    Ok(())
}`}
        language="rust"
        filename="proxy.rs"
      />

      <h3>Deploy Worker — Go</h3>
      <p>
        The worker consumes jobs from Redis and runs the full deploy pipeline:
      </p>
      <CodeBlock
        code={`func (w *Worker) processJob(job *DeployJob) error {
    // 1. Git clone
    repo, err := git.PlainCloneContext(job.Ctx, workDir, false, &git.CloneOptions{
        URL:      job.RepoURL,
        Progress: job.LogWriter,
    })

    // 2. Docker build (with BuildKit)
    imageID, err := w.buildImage(job.Ctx, workDir, job.Dockerfile)

    // 3. Stop old container
    w.stopContainer(job.ProjectSlug)

    // 4. Start new container
    container, err := w.startContainer(job.Ctx, &ContainerConfig{
        Image:    imageID,
        Ports:    map[string]string{"3000": "auto"},
        Env:      job.EnvVars,
        Labels:   map[string]string{"nidus.project": job.ProjectSlug},
    })

    // 5. Health check
    if err := w.waitForHealth(container, 30*time.Second); err != nil {
        w.rollback(job)
        return fmt.Errorf("health check failed: %w", err)
    }

    // 6. Register in proxy
    w.proxy.RegisterUpstream(job.ProjectSlug, container.Address())

    return nil
}`}
        language="go"
        filename="worker.go"
      />

      <h2>Memory Usage Comparison</h2>
      <div className="not-prose my-8"><MemoryChart /></div>

      <h2>Deploy Pipeline Flow</h2>
      <Mermaid chart={deployPipelineDiagram} id="deploy-pipeline" />

      <h2>Why Not Node.js?</h2>
      <p>
        We benchmarked the same API server in Go, Node.js, and Python:
      </p>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Go</th>
            <th>Node.js</th>
            <th>Python (FastAPI)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Binary Size</td>
            <td>12MB</td>
            <td>N/A (runtime)</td>
            <td>N/A (runtime)</td>
          </tr>
          <tr>
            <td>Idle RAM</td>
            <td>15MB</td>
            <td>80MB</td>
            <td>60MB</td>
          </tr>
          <tr>
            <td>Requests/sec (p99)</td>
            <td>45,000</td>
            <td>12,000</td>
            <td>8,000</td>
          </tr>
          <tr>
            <td>p99 Latency</td>
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

      <h2>Why Not Nginx?</h2>
      <p>
        The Rust proxy outperforms Nginx in dynamic routing scenarios:
      </p>
      <ul>
        <li><strong>Dynamic upstream resolution</strong> — No config reload needed. Register/unregister upstreams at runtime via API.</li>
        <li><strong>Per-request rate limiting</strong> — Built-in token bucket with Redis-backed distributed counters.</li>
        <li><strong>WebSocket proxying</strong> — Native async support, no special modules needed.</li>
        <li><strong>Structured logging</strong> — JSON logs with request ID, latency, upstream, status code.</li>
        <li><strong>Health checking</strong> — Active health checks with automatic upstream removal.</li>
      </ul>

      <blockquote>
        <strong>TL;DR:</strong> Go gives you the developer productivity and ecosystem.
        Rust gives you the raw performance for the hot path. Together, they use
        3x less memory than Node.js/PHP alternatives while handling 4x more traffic.
      </blockquote>
    </div>
  );
}
