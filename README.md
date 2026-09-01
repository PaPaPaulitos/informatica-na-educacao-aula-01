# Informática na Educação · Aula 01

Site interativo para a aula: participantes respondem em `/`, e o professor acompanha tudo em `/dashboard`.

## Fluxo

1. Em **`/`**, cada pessoa responde: *“Escreva algo que você conheça bem”*.
2. No **`/dashboard`**, o professor vê o mural da pergunta 1 e clica em **Avançar para a próxima pergunta**.
3. Todos passam automaticamente para a pergunta 2: relacionar o conhecimento com uma das 3 teorias (Carga Cognitiva, ZDP ou Reforço Variável).
4. A resposta final de cada pessoa usa **a mesma cor** da primeira resposta.

## Rotas

| Rota | Uso |
|------|-----|
| `/` | Participantes |
| `/dashboard` | Professor — 2 telas + avanço de fase |

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. (Recomendado) Em **Storage**, crie um **Upstash Redis** e conecte ao projeto. Isso define:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Faça o deploy.

Sem Redis, o app funciona em memória (ótimo para teste local). Em produção serverless, o Redis evita perder respostas entre instâncias.

## Reiniciar a sessão

No dashboard, use **Reiniciar sessão** para limpar respostas e voltar à pergunta 1.
