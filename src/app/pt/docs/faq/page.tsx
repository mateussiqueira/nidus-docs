import CodeBlock from "@/components/CodeBlock";

export default function PTFAQPage() {
  return (
    <div className="prose">
      <h1>FAQ e Troubleshooting</h1>
      <p>
        Perguntas frequentes sobre configuração, deploy, desempenho e segurança
        do Nidus. Se você não encontrar sua dúvida aqui, abra uma issue no
        <a href="https://github.com/nidus/nidus/issues"> GitHub </a>
        ou pergunte no nosso Discord.
      </p>

      <h2>Configuração</h2>

      <h3>O arquivo .env.example não veio com os valores preenchidos — preciso preencher manualmente?</h3>
      <p>
        Sim. O <code>.env.example</code> é um template com os nomes das variáveis
        e comentários explicativos. Copie para <code>.env</code> e preencha os
        valores reais do seu ambiente:
      </p>
      <CodeBlock
        code={`cp .env.example .env
# Edite as variáveis obrigatórias:
#   NIDUS_SECRET          — chave para assinar JWTs (gere com openssl rand -hex 32)
#   REDIS_URL             — conexão com Redis (ex.: redis://localhost:6379/0)
#   DATABASE_PATH         — caminho do SQLite (ex.: /data/nidus.db)
#   SERVER_HTTP_PORT      — porta do servidor web (padrão: 3000)
#   PROXY_HTTP_PORT       — porta do proxy HTTP (padrão: 80)
#   PROXY_HTTPS_PORT      — porta do proxy HTTPS (padrão: 443)
vim .env`}
        language="bash"
        filename="terminal"
      />

      <h3>O Nidus exige Redis? Dá para usar apenas SQLite?</h3>
      <p>
        O Redis é obrigatório — não é uma opção. Nidus usa o Redis para três
        finalidades que o SQLite não atende bem: fila de jobs de deploy
        (BRPOP/LPUSH), cache de sessão com TTL e rate limiting atômico.
        Sem Redis, deploys simultâneos geram condição de corrida, sessões
        não expiram corretamente e o rate limit simplesmente não funciona.
        Você pode rodar Redis via Docker com um único comando:
      </p>
      <CodeBlock
        code={`docker run -d --name nidus-redis -p 6379:6379 redis:7-alpine
# Consumo aproximado: 15 MB de RAM`}
        language="bash"
        filename="terminal"
      />

      <h3>O Nidus vem com um usuário admin padrão? Como faço o primeiro login?</h3>
      <p>
        Na primeira execução, o Nidus cria automaticamente um usuário admin
        com as credenciais definidas nas variáveis de ambiente
        <code>NIDUS_ADMIN_EMAIL</code> e <code>NIDUS_ADMIN_PASSWORD</code>.
        Se você não definiu essas variáveis, o Nidus usa valores padrão
        (<code>admin@nidus.local</code> / <code>niduspwd</code>) e exibe
        um aviso no log na primeira inicialização. Mude a senha imediatamente:
      </p>
      <CodeBlock
        code={`nidus user change-password --email admin@nidus.local
# Você será solicitado a digitar a senha atual e a nova`}
        language="bash"
        filename="terminal"
      />

      <h3>Posso mudar a porta do servidor web depois de já ter projetos configurados?</h3>
      <p>
        Sim, mas você precisa atualizar a variável <code>SERVER_HTTP_PORT</code>
        no <code>.env</code> e reiniciar o serviço. O proxy do Nidus também
        precisa ser reconfigurado se ele depende de uma porta específica para
        rotear o tráfego. Lembre-se de atualizar quaisquer regras de firewall
        ou balanceadores que apontem para a porta antiga:
      </p>
      <CodeBlock
        code={`nidus config set server.http_port 8080
nidus restart server
# Verifique se a nova porta está ouvindo:
ss -tlnp | grep 8080`}
        language="bash"
        filename="terminal"
      />

      <h2>Deploy</h2>

      <h3>Meu deploy fica travado em "building" por mais de 10 minutos. O que pode ser?</h3>
      <p>
        Isso geralmente acontece por um destes três motivos. Primeiro, verifique
        se o Docker daemon está rodando — sem ele o build não começa. Segundo,
        veja se há espaço em disco suficiente; builds geram camadas de imagem
        que consomem espaço temporário. Terceiro, o build pode estar consumindo
        mais memória que o disponível e o kernel está matando processos (OOM).
        Execute estes comandos para diagnosticar:
      </p>
      <CodeBlock
        code={`# 1. Verificar logs do worker
nidus logs --service worker --level debug --tail 50

# 2. Checar espaço em disco
df -h

# 3. Verificar OOM killer
dmesg | grep -i oom

# 4. Limpar resíduos de builds anteriores
docker system prune -af

# 5. Aumentar timeout do build (padrão: 300s)
nidus config set worker.build.timeout 600`}
        language="bash"
        filename="terminal"
      />

      <h3>O deploy conclui com sucesso mas o health check do container falha e o proxy retorna 502</h3>
      <p>
        O health check padrão do Nidus espera que o container responda
        <code>200 OK</code> em <code>GET /</code> ou no path configurado
        como <code>healthcheckPath</code> do projeto. Se sua aplicação
        expõe o health check em outra rota (como <code>/api/health</code>),
        você precisa configurar isso no projeto. Para diagnosticar:
      </p>
      <CodeBlock
        code={`# Descobrir o container do projeto
docker ps | grep meu-app

# Testar o health check manualmente
curl -v http://localhost:$(docker port $(docker ps -q -f name=meu-app) 3000 | cut -d: -f2)/

# Se funcionar manualmente, o timeout do health check pode ser curto:
# Aumente o grace period
nidus config set proxy.healthcheck.grace 30
nidus config set proxy.healthcheck.interval 5
nidus config set proxy.healthcheck.timeout 3`}
        language="bash"
        filename="terminal"
      />

      <h3>Precisei fazer rollback de um deploy mas o comando rollback não existe. Como volto à versão anterior?</h3>
      <p>
        O Nidus não tem um comando <code>rollback</code> explícito por design —
        o mecanismo de rollback é fazer um novo deploy apontando para o commit
        anterior. Veja o histórico de deploys, pegue o SHA do commit estável
        e faça um deploy com <code>skipBuild: true</code> para reutilizar a
        última imagem bem-sucedida. Isso é mais rápido que rebuildar:
      </p>
      <CodeBlock
        code={`# 1. Ver histórico de deploys
nidus deploy list --project meu-app

# 2. Fazer deploy do commit estável sem rebuild
curl -X POST https://seu-nidus.com/api/deploy \\
  -H "Authorization: Bearer nid_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectId": "proj_abc123",
    "commitSha": "a1b2c3d4e5f6",
    "skipBuild": true
  }'`}
        language="bash"
        filename="terminal"
      />

      <h3>Meu build falha com "Exit code 1" mas não mostra erro nenhum nos logs. Como debugo?</h3>
      <p>
        Mude o nível de log do worker para <code>debug</code> antes de tentar
        o deploy novamente. Isso faz o Nidus exibir a saída completa do build,
        incluindo stdout e stderr do Docker. Outra abordagem é tentar buildar
        manualmente fora do Nidus para isolar o problema:
      </p>
      <CodeBlock
        code={`# Habilitar logs detalhados
nidus config set worker.log.level debug
nidus restart worker

# Build manual para isolar o problema
git clone https://github.com/usuario/meu-app /tmp/test-build
cd /tmp/test-build
docker build -f Dockerfile -t test-app .
docker run --rm test-app npm run build`}
        language="bash"
        filename="terminal"
      />

      <h2>Proxy</h2>

      <h3>Meu domínio customizado retorna 404. O proxy do Nidus não está roteando o tráfego</h3>
      <p>
        Isso acontece quando o DNS do domínio não aponta para o IP da sua
        instância Nidus, ou quando o certificado TLS não foi emitido. O Nidus
        só roteia tráfego para domínios com status <code>active</code>.
        Verifique o status do domínio e a configuração de DNS:
      </p>
      <CodeBlock
        code={`# Verificar status do domínio
nidus domain list --project meu-app

# Verificar resolução DNS
dig +short meuapp.com.br
# O resultado deve ser o IP da sua instância Nidus

# Verificar se o proxy está ouvindo na porta certa
ss -tlnp | grep -E ':(80|443) '

# Verificar logs do proxy
nidus logs --service proxy --level debug --tail 30`}
        language="bash"
        filename="terminal"
      />

      <h3>O Nidus tem rate limiting? Um usuário está fazendo muitas requisições e derrubando meu app</h3>
      <p>
        Sim. O proxy do Nidus inclui um rate limiter baseado em IP que pode
        ser configurado globalmente ou por projeto. O padrão é 1000 requisições
        por minuto por IP. Para ajustar ou desabilitar seletivamente:
      </p>
      <CodeBlock
        code={`# Configurar rate limit global
nidus config set proxy.rate_limit.enabled true
nidus config set proxy.rate_limit.requests_per_minute 100
nidus config set proxy.rate_limit.burst 20

# Configurar por domínio (exceções)
nidus config set proxy.rate_limit.exempt_domains "healthcheck.com,webhook.com"

# Ver requisições bloqueadas nos logs
nidus logs --service proxy | grep "rate limit"`}
        language="bash"
        filename="terminal"
      />

      <h3>Configurei TLS manualmente mas o Nidus continua tentando emitir Let's Encrypt. Como desabilito?</h3>
      <p>
        O Nidus tenta automaticamente Let's Encrypt para todo domínio adicionado.
        Para usar um certificado customizado (ex.: Cloudflare Origin CA,
        certificado wildcard via DNS-01), você precisa desabilitar o ACME
        automático e apontar para os arquivos do certificado:
      </p>
      <CodeBlock
        code={`# Desabilitar ACME automático
nidus config set proxy.tls.acme.enabled false

# Apontar para certificado customizado
nidus config set proxy.tls.cert_path /etc/nidus/certs/meuapp.pem
nidus config set proxy.tls.key_path /etc/nidus/certs/meuapp-key.pem

# Formato esperado: PEM com certificado + chain
# O arquivo .pem deve conter o certificado do domínio seguido
# dos certificados intermediários

# Reiniciar o proxy
nidus restart proxy`}
        language="bash"
        filename="terminal"
      />

      <h2>Performance</h2>

      <h3>O worker do Nidus está usando mais memória que o esperado. O que pode estar consumindo?</h3>
      <p>
        O worker gerencia builds Docker, que por natureza são intensivos em
        memória. Cada build concorrente consome aproximadamente 200-400 MB
        adicionais durante a execução. Verifique quantos builds estão rodando
        em paralelo, se há imagens órfãs acumuladas e se o limite de workers
        está adequado ao seu VPS:
      </p>
      <CodeBlock
        code={`# Quantos builds rodando agora?
docker ps --filter "name=nidus-build"

# Ver imagens órfãs
docker images --filter "dangling=true" -q | wc -l

# Limpar imagens antigas
docker image prune -af

# Reduzir concorrência de builds
nidus config set worker.concurrency 1
nidus restart worker

# Verificar memória do sistema
free -h
# Se estiver perto do limite, considere aumentar swap ou o plano do VPS`}
        language="bash"
        filename="terminal"
      />

      <h3>Meu app está lento mesmo com poucos acessos. O proxy do Nidus pode estar causando gargalo?</h3>
      <p>
        O proxy em Rust do Nidus processa 50k+ requisições por segundo em um
        VPS de $5 — gargalo no proxy é improvável. A lentidão geralmente está
        na aplicação ou no número de instâncias configuradas. Verifique se o
        projeto está rodando com apenas 1 instância e se a aplicação consegue
        aproveitar múltiplas conexões:
      </p>
      <CodeBlock
        code={`# Ver instâncias rodando
nidus project status meu-app
# Se "instances: 1", aumente para 2:
nidus config set projeto.instances 2
nidus deploy --project meu-app

# Testar latência do proxy isoladamente
curl -o /dev/null -s -w "Tempo total: %{time_total}s\n" \\
  https://meuapp.com.br/health

# Ver logs de slow requests no proxy
nidus logs --service proxy | grep "slow"`}
        language="bash"
        filename="terminal"
      />

      <h3>O deploy está cada vez mais lento conforme adiciono projetos. O que fazer?</h3>
      <p>
        Isso é sinal de que o disco está ficando cheio de imagens Docker antigas
        ou o worker está sobrecarregado. O Nidus não limpa imagens antigas
        automaticamente — é uma decisão consciente para evitar rebuilds
        desnecessários em rollbacks. Crie um cron job para limpeza periódica:
      </p>
      <CodeBlock
        code={`# Adicionar ao crontab (roda todo domingo às 3h)
crontab -e
0 3 * * 0 docker system prune -af --filter "until=72h" > /dev/null 2>&1

# Ou limpar manualmente projetos específicos
nidus project clean --slug meu-app --keep-last 5`}
        language="bash"
        filename="terminal"
      />

      <h2>Segurança</h2>

      <h3>Recebi um erro 401 "Token expirado" mesmo tendo acabado de gerar a chave. O que há de errado?</h3>
      <p>
        Tokens de API (<code>nid_live_</code>) não expiram, mas JWTs de sessão
        sim. Se você está usando um JWT de sessão em um script, lembre-se de que
        ele expira em 7 dias por padrão. Para automações, sempre use um token
        de API. Se o erro persiste com token de API, verifique se o header está
        sendo enviado corretamente e se o token não foi revogado:
      </p>
      <CodeBlock
        code={`# Testar token manualmente
curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer nid_live_abc123..." \\
  https://seu-nidus.com/api/projects

# Se retornar 401, gere um novo token
nidus token create --name "minha-automacao" --output json

# Listar tokens ativos para ver se o antigo foi revogado
nidus token list`}
        language="bash"
        filename="terminal"
      />

      <h3>Descobri que uma chave de API vazou no GitHub. Como revogar imediatamente?</h3>
      <p>
        Revogue o token comprometido imediatamente pelo CLI e gere um novo.
        Depois, verifique os logs para ver se houve acesso não autorizado
        com a chave vazada. Considere também rotacionar segredos expostos
        nas variáveis de ambiente dos projetos:
      </p>
      <CodeBlock
        code={`# Revogar token imediatamente (o token para de funcionar na hora)
nidus token revoke nid_live_abc123def456ghi789jkl

# Gerar novo token
nidus token create --name "minha-automacao-v2" --output json

# Verificar acessos suspeitos nos logs
nidus logs --service server | grep "abc123def456" --context 5

# Rotacionar variáveis de ambiente dos projetos
nidus env set --project meu-app --key DATABASE_URL --value "postgres://nova-senha@..."`}
        language="bash"
        filename="terminal"
      />

      <h3>O Nidus expõe alguma porta de gerenciamento que não deveria estar pública?</h3>
      <p>
        Por padrão, o Nidus expõe três portas: 80 (proxy HTTP), 443 (proxy HTTPS)
        e a porta do servidor web (3000 por padrão). A porta 3000 não deveria
        estar acessível publicamente — ela é para administração interna. Se o
        seu VPS expõe a porta 3000 para a internet, qualquer um pode acessar
        o painel de admin. Configure o firewall para bloquear:
      </p>
      <CodeBlock
        code={`# Usando iptables (Linux)
iptables -A INPUT -p tcp --dport 3000 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP

# Ou UFW (mais simples)
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3000/tcp
ufw enable

# Alternativa: configurar Nidus para ouvir apenas localhost
# no .env: SERVER_HTTP_BIND=127.0.0.1`}
        language="bash"
        filename="terminal"
      />

      <h2>Geral</h2>

      <h3>Qual a diferença prática entre Nidus e Coolify para um time pequeno?</h3>
      <p>
        Coolify é escrito em PHP/Laravel com proxy Traefik. Nidus usa Go para
        o control plane e Rust para o proxy. No mundo real, isso significa:
        Nidus consome ~15 MB de RAM idle contra ~50 MB do Coolify; o proxy em
        Rust processa cerca de 3x mais requisições no mesmo hardware; deploys
        no Nidus são 2-3x mais rápidos porque o pipeline de build é em Go puro
        sem overhead de Laravel. Ambos resolvem o mesmo problema (self-hosted
        deploy), mas Nidus é significativamente mais leve e rápido. A desvantagem
        é que Coolify tem mais integrações prontas (Plausible, NocoDB, etc.)
        por ser mais maduro. Se você quer algo que "apenas funciona" e não se
        importa com eficiência de recursos, Coolify é uma boa escolha. Se você
        quer extrair o máximo de um VPS de $5, Nidus é a opção certa.
      </p>

      <h3>Qual é a licença do Nidus? Posso usar comercialmente?</h3>
      <p>
        O Nidus é distribuído sob a licença <strong>AGPLv3</strong>. Isso
        significa que você pode usar, modificar e distribuir livremente, mas
        se você modificar o código e oferecer como serviço (SaaS), você precisa
        disponibilizar as modificações sob a mesma licença. Para uso interno
        na sua empresa, não há restrição — você pode deployar quantos projetos
        quiser sem pagar nada. Se precisar de uma licença comercial (MIT
        equivalente) para uso em produto proprietário, entre em contato pelo
        Discord para adquirir uma licença enterprise.
      </p>

      <h3>Como contribuir com o projeto? Aceitam PRs de features grandes?</h3>
      <p>
        Sim, contribuições são bem-vindas. Antes de abrir um PR grande, abra
        uma issue descrevendo a mudança proposta para alinhar com os mantenedores.
        O repositório segue Conventional Commits e usa GitHub Actions para CI.
        Para começar:
      </p>
      <CodeBlock
        code={`# Fork e clone
git clone https://github.com/seu-usuario/nidus
cd nidus

# Instalar dependências de desenvolvimento
make setup

# Rodar testes
make test

# Rodar linter
make lint

# Criar branch e fazer alterações
git checkout -b feat/minha-feature`}
        language="bash"
        filename="terminal"
      />

      <h3>O Nidus funciona em Windows? Preciso de Docker Desktop?</h3>
      <p>
        O Nidus é desenvolvido e testado primariamente em Linux (amd64 e arm64).
        Ele também roda em macOS (Intel e Apple Silicon) para desenvolvimento
        local, mas não é recomendado para produção em macOS. Windows não é
        suportado oficialmente — o proxy em Rust depende de syscalls específicas
        do Linux para performance máxima. Você pode rodar o Nidus no Windows
        via WSL2, mas sem garantia de suporte. Docker é obrigatório em qualquer
        plataforma.
      </p>
    </div>
  );
}
