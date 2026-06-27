import CodeBlock from "@/components/CodeBlock";

export default function PTAPIPage() {
  return (
    <div className="prose">
      <div className="mb-4"><span className="badge badge-go">Go</span></div>
      <h1>Referência da API</h1>
      <p>
        A API do Nidus é RESTful, construída em Go, e todos os endpoints retornam
        JSON. Você pode usá-la para automatizar deploys, gerenciar projetos,
        configurar domínios e monitorar o status da sua infraestrutura.
      </p>

      <h2>Introdução</h2>
      <p>
        A URL base para todas as requisições é o endereço da sua instância Nidus
        acrescido de <code>/api</code>:
      </p>
      <CodeBlock
        code={`https://seu-nidus.com/api`}
        language="bash"
        filename="terminal"
      />
      <p>
        O cabeçalho <code>Content-Type</code> deve ser <code>application/json</code>
        em requisições que enviam corpo. Todas as respostas são JSON. Datas seguem
        o formato ISO 8601 (<code>2025-06-27T14:30:00Z</code>). Identificadores
        usam prefixos que indicam o tipo do recurso: <code>proj_</code> para projetos,
        <code>dep_</code> para deploys, <code>dom_</code> para domínios.
      </p>

      <h2>Autenticação</h2>
      <p>
        A API usa tokens JWT no esquema <code>Bearer</code>. Existem dois tipos
        de credencial:
      </p>
      <ul>
        <li>
          <strong>Token de API</strong> — gerado no painel administrativo do Nidus,
          prefixo <code>nid_live_</code>. Ideal para CI/CD e automações.
        </li>
        <li>
          <strong>JWT de sessão</strong> — obtido via login no painel web, usado
          para requisições do frontend.
        </li>
      </ul>
      <CodeBlock
        code={`# Token de API (recomendado para scripts)
Authorization: Bearer nid_live_abc123def456ghi789jkl

# Header alternativo (compatibilidade)
X-Nidus-Key: nid_live_abc123def456ghi789jkl

# JWT de sessão (frontend)
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6MTc1MDAwMDAwMH0.signature`}
        language="bash"
        filename="terminal"
      />
      <p>
        Tokens de API não expiram a menos que sejam revogados manualmente. JWTs
        de sessão expiram em 7 dias por padrão — configurável via
        <code>server.auth.jwt.ttl</code>.
      </p>

      <h2>Health Check</h2>
      <p>
        O endpoint de health check não requer autenticação e serve para
        monitoramento externo, balanceadores de carga e probes do Docker.
        Retorna o status de cada componente do sistema.
      </p>

      <h3>Requisição</h3>
      <CodeBlock
        code={`GET /api/health`}
        language="bash"
        filename="terminal"
      />

      <h3>Resposta de sucesso</h3>
      <CodeBlock
        code={`{
  "status": "ok",
  "version": "2.1.0",
  "uptime": "12h47m32s",
  "commit": "a1b2c3d4e5f6",
  "components": {
    "server": "ok",
    "proxy": "ok",
    "worker": "ok",
    "redis": "ok"
  },
  "metrics": {
    "totalProjects": 24,
    "activeDeploys": 3,
    "containersRunning": 18
  }
}`}
        language="json"
        filename="response.json"
      />

      <h3>Resposta com falha</h3>
      <CodeBlock
        code={`{
  "status": "degraded",
  "version": "2.1.0",
  "uptime": "12h47m32s",
  "components": {
    "server": "ok",
    "proxy": "ok",
    "worker": "ok",
    "redis": "down"
  },
  "metrics": {
    "totalProjects": 24,
    "activeDeploys": 0,
    "containersRunning": 0
  }
}`}
        language="json"
        filename="response.json"
      />

      <h2>Deploy</h2>
      <p>
        Inicia um deploy a partir do repositório configurado no projeto. O Nidus
        clona o repositório, detecta o framework, constrói a imagem Docker e
        faz o rolling update do container. O deploy é assíncrono — o endpoint
        retorna imediatamente com o ID do deploy; o status real deve ser
        consultado no endpoint de status do projeto.
      </p>

      <h3>Requisição</h3>
      <CodeBlock
        code={`POST /api/deploy
Authorization: Bearer nid_live_abc123def456ghi789jkl
Content-Type: application/json

{
  "projectId": "proj_abc123",
  "branch": "main",
  "commitSha": "a1b2c3d4e5f6",
  "skipBuild": false,
  "env": {
    "NEXT_PUBLIC_URL": "https://meuapp.com.br",
    "DATABASE_URL": "postgres://..."
  }
}`}
        language="bash"
        filename="terminal"
      />

      <h3>Resposta de sucesso</h3>
      <CodeBlock
        code={`{
  "id": "dep_xyz789",
  "projectId": "proj_abc123",
  "projectSlug": "meu-app",
  "status": "queued",
  "branch": "main",
  "commitSha": "a1b2c3d4e5f6",
  "commitMessage": "feat: adiciona página de contato",
  "author": "joao.silva",
  "createdAt": "2025-06-27T14:30:00Z",
  "estimatedDuration": "45s"
}`}
        language="json"
        filename="response.json"
      />

      <h3>Parâmetros opcionais</h3>
      <ul>
        <li>
          <code>branch</code> — branch a ser deployada. Omite para usar a branch
          padrão do projeto.
        </li>
        <li>
          <code>commitSha</code> — SHA específico para fazer checkout. Sobrescreve
          o HEAD da branch.
        </li>
        <li>
          <code>skipBuild</code> — <code>true</code> para pular a etapa de build
          e usar a última imagem bem-sucedida. Útil para rollbacks rápidos.
        </li>
        <li>
          <code>env</code> — variáveis de ambiente temporárias que sobrescrevem as
          configuradas no projeto durante este deploy apenas.
        </li>
      </ul>

      <h2>Listar Projetos</h2>
      <p>
        Retorna todos os projetos registrados na instância. Suporta paginação
        e filtros opcionais. Projetos deletados não aparecem na listagem a menos
        que o filtro <code>showDeleted</code> seja passado.
      </p>

      <h3>Requisição</h3>
      <CodeBlock
        code={`GET /api/projects?page=1&perPage=20&search=blog&framework=next
Authorization: Bearer nid_live_abc123def456ghi789jkl`}
        language="bash"
        filename="terminal"
      />

      <h3>Resposta de sucesso</h3>
      <CodeBlock
        code={`{
  "data": [
    {
      "id": "proj_abc123",
      "slug": "meu-app",
      "name": "Meu App",
      "framework": "next",
      "repoUrl": "https://github.com/usuario/meu-app",
      "branch": "main",
      "rootDir": ".",
      "status": "healthy",
      "domain": "meuapp.com.br",
      "lastDeployAt": "2025-06-26T10:00:00Z",
      "lastDeployStatus": "success",
      "createdAt": "2025-04-01T08:00:00Z"
    },
    {
      "id": "proj_def456",
      "slug": "blog",
      "name": "Blog Pessoal",
      "framework": "astro",
      "repoUrl": "https://github.com/usuario/blog",
      "branch": "main",
      "rootDir": ".",
      "status": "building",
      "domain": "blog.usuario.com",
      "lastDeployAt": null,
      "lastDeployStatus": null,
      "createdAt": "2025-05-15T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 2,
    "totalPages": 1
  }
}`}
        language="json"
        filename="response.json"
      />

      <h3>Parâmetros de consulta</h3>
      <ul>
        <li><code>page</code> — página atual (padrão: 1).</li>
        <li><code>perPage</code> — itens por página (padrão: 20, máximo: 100).</li>
        <li><code>search</code> — busca textual por nome ou slug.</li>
        <li><code>framework</code> — filtro por framework (next, nuxt, astro, sveltekit, etc.).</li>
        <li><code>status</code> — filtro por status (healthy, building, error, paused).</li>
      </ul>

      <h2>Status do Projeto</h2>
      <p>
        Retorna os detalhes completos de um projeto, incluindo o histórico dos
        últimos deploys, domínios configurados e variáveis de ambiente. Use este
        endpoint para monitorar o estado do seu projeto em tempo real.
      </p>

      <h3>Requisição</h3>
      <CodeBlock
        code={`GET /api/projects/meu-app
Authorization: Bearer nid_live_abc123def456ghi789jkl`}
        language="bash"
        filename="terminal"
      />

      <h3>Resposta de sucesso</h3>
      <CodeBlock
        code={`{
  "id": "proj_abc123",
  "slug": "meu-app",
  "name": "Meu App",
  "framework": "next",
  "repoUrl": "https://github.com/usuario/meu-app",
  "branch": "main",
  "rootDir": ".",
  "buildCommand": "npm run build",
  "outputDir": ".next",
  "status": "healthy",
  "port": 3000,
  "instances": 2,
  "domain": "meuapp.com.br",
  "customDomains": [
    "meuapp.com.br",
    "www.meuapp.com.br"
  ],
  "env": {
    "NEXT_PUBLIC_URL": "https://meuapp.com.br",
    "NODE_ENV": "production"
  },
  "lastDeploys": [
    {
      "id": "dep_xyz789",
      "status": "success",
      "branch": "main",
      "commitSha": "a1b2c3d4e5f6",
      "commitMessage": "feat: adiciona página de contato",
      "createdAt": "2025-06-26T10:00:00Z",
      "duration": "32s"
    },
    {
      "id": "dep_xyz788",
      "status": "failed",
      "branch": "main",
      "commitSha": "f6e5d4c3b2a1",
      "commitMessage": "fix: atualiza dependências",
      "createdAt": "2025-06-25T18:00:00Z",
      "duration": "12s",
      "error": "Build falhou na etapa de instalação de dependências"
    }
  ],
  "createdAt": "2025-04-01T08:00:00Z",
  "updatedAt": "2025-06-26T10:05:00Z"
}`}
        language="json"
        filename="response.json"
      />

      <h2>Deletar Projeto</h2>
      <p>
        Remove permanentemente o projeto e todos os seus recursos: containers,
        volumes, imagens Docker, domínios e histórico de deploys. Esta operação
        <strong>não pode ser desfeita</strong>. Por segurança, projetos com
        domínios em produção exigem confirmação explícita.
      </p>

      <h3>Requisição</h3>
      <CodeBlock
        code={`DELETE /api/projects/meu-app
Authorization: Bearer nid_live_abc123def456ghi789jkl
Content-Type: application/json

{
  "confirmProductionDomains": true,
  "preserveVolumes": false
}`}
        language="bash"
        filename="terminal"
      />

      <h3>Resposta de sucesso</h3>
      <CodeBlock
        code={`{
  "message": "Projeto 'meu-app' deletado com sucesso",
  "slug": "meu-app",
  "deletedAt": "2025-06-27T14:30:00Z",
  "resourcesFreed": {
    "containers": 2,
    "volumes": 1,
    "images": 4,
    "domains": 2
  }
}`}
        language="json"
        filename="response.json"
      />

      <h3>Resposta de erro (domínio em produção sem confirmação)</h3>
      <CodeBlock
        code={`{
  "error": {
    "code": "CONFIRMATION_REQUIRED",
    "message": "O projeto possui domínios em produção. Envie confirmProductionDomains: true para confirmar.",
    "status": 409,
    "details": {
      "productionDomains": ["meuapp.com.br", "www.meuapp.com.br"]
    }
  }
}`}
        language="json"
        filename="error.json"
      />

      <h2>Gerenciar Domínios</h2>
      <p>
        Adiciona um domínio personalizado a um projeto. O Nidus valida o domínio,
        solicita um certificado TLS via Let's Encrypt e configura o proxy para
        rotear o tráfego automaticamente. O DNS do domínio deve apontar para o
        IP da sua instância Nidus antes da validação.
      </p>

      <h3>Requisição</h3>
      <CodeBlock
        code={`POST /api/domains
Authorization: Bearer nid_live_abc123def456ghi789jkl
Content-Type: application/json

{
  "projectId": "proj_abc123",
  "domain": "meuapp.com.br",
  "wildcard": false,
  "ssl": {
    "provider": "letsencrypt",
    "email": "admin@meuapp.com.br"
  }
}`}
        language="bash"
        filename="terminal"
      />

      <h3>Resposta de sucesso</h3>
      <CodeBlock
        code={`{
  "id": "dom_456def",
  "domain": "meuapp.com.br",
  "projectId": "proj_abc123",
  "status": "provisioning",
  "sslStatus": "pending",
  "dnsInstructions": {
    "type": "A",
    "name": "@",
    "value": "192.168.1.100",
    "ttl": 300
  },
  "createdAt": "2025-06-27T14:30:00Z"
}`}
        language="json"
        filename="response.json"
      />

      <h3>Status de domínio</h3>
      <p>
        O campo <code>status</code> pode assumir os seguintes valores:
      </p>
      <ul>
        <li><code>provisioning</code> — aguardando validação de DNS e emissão de certificado.</li>
        <li><code>active</code> — DNS validado, certificado emitido e tráfego roteado.</li>
        <li><code>failed</code> — falha na validação de DNS ou na emissão do certificado SSL.</li>
        <li><code>removing</code> — domínio em processo de remoção.</li>
      </ul>

      <h2>Tabela de Endpoints</h2>
      <table>
        <thead>
          <tr>
            <th>Método</th>
            <th>URL</th>
            <th>Descrição</th>
            <th>Autenticação</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET</code></td>
            <td><code>/api/health</code></td>
            <td>Health check do sistema</td>
            <td>Não</td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>/api/deploy</code></td>
            <td>Iniciar novo deploy</td>
            <td>Sim</td>
          </tr>
          <tr>
            <td><code>GET</code></td>
            <td><code>/api/projects</code></td>
            <td>Listar projetos</td>
            <td>Sim</td>
          </tr>
          <tr>
            <td><code>GET</code></td>
            <td><code>/api/projects/:slug</code></td>
            <td>Detalhes do projeto</td>
            <td>Sim</td>
          </tr>
          <tr>
            <td><code>DELETE</code></td>
            <td><code>/api/projects/:slug</code></td>
            <td>Deletar projeto</td>
            <td>Sim</td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>/api/domains</code></td>
            <td>Adicionar domínio</td>
            <td>Sim</td>
          </tr>
          <tr>
            <td><code>GET</code></td>
            <td><code>/api/projects/:slug/env</code></td>
            <td>Listar variáveis de ambiente</td>
            <td>Sim</td>
          </tr>
          <tr>
            <td><code>PUT</code></td>
            <td><code>/api/projects/:slug/env</code></td>
            <td>Atualizar variáveis de ambiente</td>
            <td>Sim</td>
          </tr>
          <tr>
            <td><code>DELETE</code></td>
            <td><code>/api/projects/:slug/env/:key</code></td>
            <td>Remover variável de ambiente</td>
            <td>Sim</td>
          </tr>
        </tbody>
      </table>

      <h2>Tratamento de Erros</h2>
      <p>
        A API usa códigos HTTP padrão e retorna um objeto <code>error</code>
        padronizado em todas as respostas de falha. O formato é consistente
        entre todos os endpoints.
      </p>

      <h3>Estrutura do erro</h3>
      <CodeBlock
        code={`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token inválido ou expirado",
    "status": 401,
    "details": {}
  }
}`}
        language="json"
        filename="error.json"
      />

      <h3>Códigos HTTP e códigos de erro</h3>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Significado</th>
            <th>Código de erro</th>
            <th>Causa comum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>400</code></td>
            <td>Bad Request</td>
            <td><code>VALIDATION_ERROR</code></td>
            <td>JSON malformado ou campo obrigatório ausente</td>
          </tr>
          <tr>
            <td><code>401</code></td>
            <td>Unauthorized</td>
            <td><code>UNAUTHORIZED</code></td>
            <td>Token ausente, inválido ou expirado</td>
          </tr>
          <tr>
            <td><code>403</code></td>
            <td>Forbidden</td>
            <td><code>FORBIDDEN</code></td>
            <td>Token válido mas sem permissão para o recurso</td>
          </tr>
          <tr>
            <td><code>404</code></td>
            <td>Not Found</td>
            <td><code>NOT_FOUND</code></td>
            <td>Projeto ou recurso inexistente</td>
          </tr>
          <tr>
            <td><code>409</code></td>
            <td>Conflict</td>
            <td><code>CONFIRMATION_REQUIRED</code></td>
            <td>Ação destrutiva sem confirmação explícita</td>
          </tr>
          <tr>
            <td><code>422</code></td>
            <td>Unprocessable</td>
            <td><code>UNPROCESSABLE</code></td>
            <td>Dados semanticamente inválidos (ex.: domínio mal formatado)</td>
          </tr>
          <tr>
            <td><code>429</code></td>
            <td>Too Many Requests</td>
            <td><code>RATE_LIMITED</code></td>
            <td>Limite de requisições excedido</td>
          </tr>
          <tr>
            <td><code>500</code></td>
            <td>Internal Error</td>
            <td><code>INTERNAL_ERROR</code></td>
            <td>Erro inesperado no servidor</td>
          </tr>
          <tr>
            <td><code>503</code></td>
            <td>Service Unavailable</td>
            <td><code>SERVICE_UNAVAILABLE</code></td>
            <td>Manutenção ou componente critical indisponível</td>
          </tr>
        </tbody>
      </table>

      <h2>Rate Limiting</h2>
      <p>
        A API aplica rate limiting por token de autenticação. Os limites são
        retornados nos cabeçalhos HTTP de toda resposta:
      </p>
      <CodeBlock
        code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1719408060`}
        language="bash"
        filename="terminal"
      />
      <p>
        O limite padrão é de 1.000 requisições por hora por token. Ao atingir
        o limite, a API retorna <code>429 Too Many Requests</code>. Você pode
        contratar um plano superior para aumentar o limite ou usar múltiplos
        tokens de API para distribuir as requisições.
      </p>
    </div>
  );
}
