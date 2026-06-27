import CodeBlock from "@/components/CodeBlock";

export default function PTQuickStartPage() {
  return (
    <div className="prose">
      <h1>Primeiros Passos com Nidus</h1>

      <p className="lead">
        Um guia prático para colocar sua própria PaaS no ar em menos de 10 minutos — com
        controle total, sem depender de Vercel, Railway ou Heroku.
      </p>

      <h2>1. Introdução</h2>

      <p>
        Nidus não é mais um "orquestrador de containers" genérico. Ele nasceu de uma
        necessidade real: ter uma plataforma de deploy leve o suficiente para rodar em
        uma VPS de desenvolvimento, mas robusta para servir aplicações em produção.
      </p>

      <p>
        A stack é Go no control plane + Rust no proxy — uma combinação que entrega
        desempenho de proxy com ~2ms de latência adicional e consumo de RAM que não
        assusta nem em servidores de 512MB. Enquanto soluções como Dokku exigem
        conhecimento avançado de Docker e Kamal demanda Ruby na equipe, o Nidus foi
        pensado para o dev que quer fazer deploy sem virar especialista em infra.
      </p>

      <p>
        Este tutorial cobre o fluxo completo: da instalação até o primeiro deploy.
        Se você já teve dor de cabeça configurando Nginx reverso, lidando com
        certificados TLS ou debugando health checks na mão, o Nidus vai te poupar
        um bom punhado de horas.
      </p>

      <h2>2. Pré-requisitos</h2>

      <p>Antes de começar, você vai precisar de:</p>

      <ul>
        <li>
          <strong>Um VPS Linux</strong> — 2 vCPU e 1 GB de RAM é o recomendado, mas
          o Nidus funciona em servidores de 512 MB (já testamos em Digital Ocean
          Droplets e Hostinger KVM 1). Ubuntu 22.04+ ou Debian 12+ são as distros
          mais testadas.
        </li>
        <li>
          <strong>Docker 24+ e Docker Compose v2</strong> — O Nidus usa compose
          como formato de deploy nativo. Se você ainda usa a versão antiga do
          docker-compose (v1), está na hora de migrar.
        </li>
        <li>
          <strong>Git</strong> — Para clonar o repositório e, mais tarde, para
          integração com webhooks de deploy automático.
        </li>
        <li>
          <strong>Um domínio ou IP público</strong> — Para acessar o dashboard e
          as aplicações deployadas. Um IP direto funciona, mas um domínio com
          DNS apontado facilita muito a configuração de TLS.
        </li>
      </ul>

      <div className="alert alert-info">
        <strong>Dica de quem já quebrou muita coisa:</strong> use uma VPS limpa.
        Se você já tem Nginx, Apache ou outro proxy na porta 80/443, vai precisar
        lidar com conflito de portas. Uma droplet nova evita surpresas.
      </div>

      <h2>3. Passo 1: Clone e Configure</h2>

      <p>
        O repositório do Nidus já vem com tudo que você precisa. O setup é
        deliberadamente simples: clone, copie o .env, edite e rode.
      </p>

      <CodeBlock
        code={`git clone https://github.com/mateussiqueira/nidus.git
cd nidus
cp .env.example .env`}
        language="bash"
        filename="terminal"
      />

      <p>
        Antes de subir qualquer container, você precisa configurar o arquivo <code>.env</code>.
        Diferente de projetos que escondem dezenas de variáveis, o Nidus mantém
        só o essencial:
      </p>

      <ul>
        <li>
          <code>NIDUS_DOMAIN</code> — Seu domínio ou IP público. É usado pelo proxy
          para gerar as URLs dos projetos e pelo dashboard para links de acesso.
          Exemplo: <code>nidus.exemplo.com</code>.
        </li>
        <li>
          <code>NIDUS_JWT_SECRET</code> — Chave secreta para os tokens de
          autenticação. <strong>Não use a mesma do exemplo em produção.</strong>
          Um comando rápido resolve: <code>openssl rand -hex 32</code>.
        </li>
        <li>
          <code>NIDUS_STORAGE_PATH</code> — Onde os dados ficam armazenados no
          host. Por padrão, <code>/var/lib/nidus</code>. Se você usa um volume
          separado, aponte para ele.
        </li>
        <li>
          <code>NIDUS_REDIS_URL</code> — Conexão com Redis. O docker-compose já
          sobe um container Redis, então o valor padrão
          <code>redis://redis:6379</code> funciona direto.
        </li>
        <li>
          <code>NIDUS_WORKER_CONCURRENCY</code> — Número de builds simultâneos.
          O padrão é 2. Se sua VPS tem 4+ vCPUs, pode subir para 4. Acima disso
          em VPS pequenas, você satura o disco.
        </li>
      </ul>

      <p>
        Depois de editar, dê uma conferida rápida no arquivo antes de prosseguir:
      </p>

      <CodeBlock
        code={`cat .env | grep -v "^#" | grep -v "^$"
# A saída deve mostrar algo como:
# NIDUS_DOMAIN=nidus.exemplo.com
# NIDUS_JWT_SECRET=abc123def456...
# NIDUS_STORAGE_PATH=/var/lib/nidus
# NIDUS_REDIS_URL=redis://redis:6379
# NIDUS_WORKER_CONCURRENCY=2`}
        language="bash"
        filename="terminal"
      />

      <h2>4. Passo 2: Inicie os Serviços</h2>

      <p>
        Com o .env configurado, é hora de subir a stack completa. O comando é
        um só:
      </p>

      <CodeBlock
        code={`docker compose up -d

# Saída esperada (pode variar com a versão do Compose):
# [+] Running 5/5
#  ✔ Container nidus-redis       Started
#  ✔ Container nidus-server       Started
#  ✔ Container nidus-proxy        Started
#  ✔ Container nidus-worker       Started
#  ✔ Container nidus-dashboard    Started`}
        language="bash"
        filename="terminal"
      />

      <p>
        A primeira execução pode levar de 30 segundos a 2 minutos, dependendo
        da velocidade da sua VPS e da conexão para baixar as imagens. O Docker
        faz o pull das imagens Go (~15MB) e Rust (~8MB) — sim, são enxutas de
        propósito.
      </p>

      <p>Para acompanhar os logs em tempo real:</p>

      <CodeBlock
        code={`docker compose logs -f

# Você deve ver algo como:
# nidus-server  | 2025/06/27 10:00:01 Server listening on :3001
# nidus-server  | 2025/06/27 10:00:01 Database migrated (sqlite)
# nidus-proxy   | 2025/06/27 10:00:02 Proxy listening on :3080
# nidus-worker  | 2025/06/27 10:00:02 Worker pool ready (2 goroutines)
# nidus-dashboard | ready - started server on 0.0.0.0:3000`}
        language="bash"
        filename="terminal"
      />

      <div className="alert alert-warning">
        <strong>Atenção:</strong> se o worker não aparecer nos logs, espere
        alguns segundos. Ele faz uma conexão inicial com o Redis e o server
        antes de ficar disponível. Se depois de 30 segundos ele não subir,
        verifique se o Redis está rodando com <code>docker compose ps</code>.
      </div>

      <h2>5. Passo 3: Verifique a Instalação</h2>

      <p>
        Com tudo rodando, o health check é o primeiro comando a executar. Ele
        confirma que o control plane está operacional:
      </p>

      <CodeBlock
        code={`curl http://localhost:3001/health

# Resposta esperada:
# {"status":"ok","version":"1.0.0","uptime":"32s"}`}
        language="bash"
        filename="terminal"
      />

      <p>
        Se você configurou um domínio, já pode testar o proxy. O dashboard
        também fica acessível:
      </p>

      <CodeBlock
        code={`# Teste o proxy (deve retornar 404 - significa que está vivo)
curl -I http://localhost:3080/
# HTTP/1.1 404 Not Found
# X-Nidus-Version: 1.0.0
# X-Nidus-Latency: 0ms

# Teste o dashboard
curl -I http://localhost:3000/
# HTTP/1.1 200 OK

# Liste os containers rodando
docker compose ps

# Saída:
# NAME                IMAGE                STATUS   PORTS
# nidus-server        nidus/server:1.0.0   Up       0.0.0.0:3001->3001
# nidus-proxy         nidus/proxy:1.0.0    Up       0.0.0.0:3080->3080
# nidus-worker        nidus/worker:1.0.0   Up
# nidus-dashboard     nidus/dashboard:1.0  Up       0.0.0.0:3000->3000
# nidus-redis         redis:7-alpine       Up       6379`}
        language="bash"
        filename="terminal"
      />

      <p>
        O proxy retornar 404 é um bom sinal — significa que ele está ativo e
        apenas não encontrou nenhuma rota configurada ainda. Isso muda no
        primeiro deploy.
      </p>

      <h2>6. Passo 4: Deploy sua Primeira Aplicação</h2>

      <p>
        Com o Nidus rodando, você pode fazer deploy de uma aplicação de duas
        formas: via CLI ou via API REST. A CLI é mais prática para o dia a dia.
      </p>

      <h3>Via CLI</h3>

      <CodeBlock
        code={`# Instale a CLI globalmente
npm install -g nidus-cli

# Faça login na sua instância
nidus login --url http://localhost:3001

# Você vai digitar o token de acesso (gerado no primeiro login do admin)
# Ou usar a flag --token se preferir via script

# Agora, vá até o diretório do seu projeto e faça deploy
cd ~/meu-projeto-node
nidus deploy

# Saída esperada:
# ✔ Preparando build...
# ✔ Enviando arquivos (12.4 MB)
# ✔ Build concluído em 8.3s
# ✔ Iniciando container...
# ✔ Health check passou (2 tentativas)
# ✔ Deploy realizado com sucesso!
# 
# URL: http://localhost:3080/meu-projeto-node
# Status: running`}
        language="bash"
        filename="terminal"
      />

      <h3>Via API</h3>

      <p>
        Se você prefere integrar com CI/CD (GitHub Actions, GitLab CI, etc.),
        a API REST é o caminho:
      </p>

      <CodeBlock
        code={`# Crie um projeto via API
curl -X POST http://localhost:3001/api/projects \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"meu-app","framework":"node","entry":"index.js"}'

# Resposta:
# {
#   "id": "proj_abc123",
#   "name": "meu-app",
#   "slug": "meu-app",
#   "status": "created",
#   "url": "http://localhost:3080/meu-app"
# }`}
        language="bash"
        filename="terminal"
      />

      <p>
        Depois de criar o projeto, você faz upload do código como um tarball
        para o endpoint de deploy. A CLI faz todo esse processo automaticamente,
        mas a API dá controle fino para pipelines automatizadas.
      </p>

      <div className="alert alert-success">
        <strong>Testado em produção:</strong> o deploy via CLI comprime o
        diretório, envia em chunks paralelos e faz retry automático em caso de
        falha de rede. Se a conexão cair no meio do upload, ele retoma de onde
        parou.
      </div>

      <h2>7. Solução de Problemas Comuns</h2>

      <p>
        Mesmo com um setup simples, alguns problemas aparecem com frequência.
        Aqui estão os mais comuns e como resolver:
      </p>

      <h3>Erro de permissão Docker</h3>

      <CodeBlock
        code={`docker compose up -d
# permission denied while trying to connect to the Docker daemon socket

# Solução: adicione seu usuário ao grupo docker
sudo usermod -aG docker $USER

# Depois, saia e entre novamente (ou execute: newgrp docker)`}
        language="bash"
        filename="terminal"
      />

      <p>
        Esse é o erro mais frequente em VPS recém-configuradas. O Docker
        exige que o usuário esteja no grupo <code>docker</code> ou use sudo.
        Adicionar ao grupo evita ter que ficar digitando sudo toda vez.
      </p>

      <h3>Porta 3001 ou 3080 já ocupada</h3>

      <CodeBlock
        code={`docker compose up -d
# Error response from daemon: driver failed programming external connectivity
# Error starting userland proxy: listen tcp4 0.0.0.0:3001: bind: address already in use

# Descubra quem está usando:
sudo lsof -i :3001

# Se for outro container ou processo, pare-o ou mude a porta no .env.
# Exemplo: NIDUS_SERVER_PORT=3002`}
        language="bash"
        filename="terminal"
      />

      <p>
        Se você já tem um servidor web (Nginx, Apache, Caddy) rodando na
        porta 80/443, lembre-se de que o proxy do Nidus usa a 3080 por padrão.
        Não há conflito direto, mas você pode querer configurar um reverse
        proxy do Nginx para o Nidus mais tarde.
      </p>

      <h3>Timeout no health check do deploy</h3>

      <CodeBlock
        code={`nidus deploy
# ...
# ✗ Health check falhou após 30s
# O deploy foi marcado como failed

# Causas possíveis:
# 1. A aplicação não expõe a porta esperada
# 2. O entry point está incorreto
# 3. A aplicação demora mais que 30s para iniciar

# Solução rápida: verifique os logs do container
docker logs nidus-worker

# Se for tempo de inicialização, aumente o timeout:
# NIDUS_HEALTH_CHECK_TIMEOUT=60s no .env`}
        language="bash"
        filename="terminal"
      />

      <p>
        Aplicações em Node.js com muitas dependências ou em Java costumam
        precisar de mais tempo. O Nidus usa 30s como padrão, mas você pode
        ajustar tanto globalmente quanto por projeto.
      </p>

      <h3>Redis não responde</h3>

      <CodeBlock
        code={`docker compose logs nidus-server
# 2025/06/27 10:05:00 Failed to connect to Redis: dial tcp: lookup redis on ...

# Solução: verifique se o container Redis está rodando
docker compose ps redis
# Se estiver parado, inicie manualmente:
docker compose start redis`}
        language="bash"
        filename="terminal"
      />

      <p>
        Em VPS com pouca RAM, o OOM killer do Linux pode derrubar o Redis
        se a memória acabar. Monitore com <code>htop</code> e considere
        configurar <code>vm.overcommit_memory=1</code> no sysctl se isso
        acontecer com frequência.
      </p>

      <h2>8. Próximos Passos</h2>

      <p>
        Com o Nidus rodando e seu primeiro deploy no ar, você já tem uma
        PaaS funcional. Mas isso é só o começo. Aqui vai o que explorar em
        seguida:
      </p>

      <ul>
        <li>
          <strong>Arquitetura:</strong> entenda como o control plane em Go
          se comunica com o proxy em Rust, como o worker gerencia builds
          concorrentes e por que essa separação faz diferença em produção.
          Leia o guia de <a href="/pt/docs/architecture">Arquitetura</a>.
        </li>
        <li>
          <strong>Deploy avançado:</strong> integração com webhooks do GitHub
          para deploy automático em cada push, múltiplos ambientes (staging,
          produção), variáveis de ambiente por projeto e domínios customizados.
          Tudo em <a href="/pt/docs/deployment">Deploy</a>.
        </li>
        <li>
          <strong>CLI completa:</strong> a CLI não serve só para deploy. Dá
          para listar projetos, ver logs em tempo real, fazer rollback,
          gerenciar variáveis de ambiente e até executar comandos remotos
          nos containers.
        </li>
        <li>
          <strong>API REST:</strong> se você quer automatizar tudo — criar
          projetos via script, integrar com CI/CD existente ou construir
          seu próprio dashboard — a API REST tem cobertura completa dos
          recursos.
        </li>
        <li>
          <strong>Segurança:</strong> hardening para produção, configuração
          de TLS, rate limiting, isolamento entre projetos e boas práticas
          de JWT. Veja o guia de <a href="/pt/docs/security">Segurança</a>.
        </li>
        <li>
          <strong>Benchmarks:</strong> números reais de desempenho —
          throughput, latência em diferentes cenários e comparação com
          alternativas como Dokku, Kamal e Traefik. Disponível em
          <a href="/pt/docs/performance">Performance</a>.
        </li>
      </ul>

      <blockquote>
        <strong>Nota do autor:</strong> o Nidus foi construído para resolver
        um problema real — deploy simples e rápido sem depender de serviços
        externos. Se algo não funcionar como esperado, abra uma issue no
        GitHub. A plataforma é nova e cada feedback ajuda a melhorar.
      </blockquote>
    </div>
  );
}
