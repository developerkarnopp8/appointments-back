# CLAUDE.md — Backend (appointments-back)

> Documento vivo: deve ser atualizado a cada alteração significativa no projeto e commitado junto com as mudanças.

---

## Visão Geral

API backend do sistema **EvolveConfirma** — confirmação de presença em festas de aniversário.  
Construído com **Strapi 4** (Headless CMS), expõe REST API + GraphQL consumida pelo frontend Vue.

- **Prod (API):** https://powerful-stream-27507-4600a6a04640.herokuapp.com/
- **Admin Strapi (Heroku):** https://powerful-stream-27507-4600a6a04640.herokuapp.com/admin/
- **Plataforma:** Heroku

---

## Stack

| Tecnologia | Versão | Função |
|---|---|---|
| Strapi | 4.13.7 | Headless CMS + REST/GraphQL API |
| Node.js | 18.17.0 | Runtime |
| npm | 6.14.0 | Gerenciador de pacotes |
| SQLite | dev | Banco de desenvolvimento (`.tmp/data.db`) |
| PostgreSQL/MySQL | prod | Banco de produção (configurável via env) |
| SendGrid | - | Envio de e-mails |

---

## Estrutura de Pastas

```
appointments-back/
├── config/
│   ├── server.js               # Host: 0.0.0.0, Port: 1337
│   ├── database.js             # Suporte SQLite / MySQL / PostgreSQL
│   ├── admin.js                # JWT secret, API token salt, transfer token salt
│   ├── api.js                  # Paginação padrão: 25/página, max 100, withCount: true
│   ├── middlewares.js          # Stack: errors, security, CORS, logger, body, session
│   ├── plugins.js              # SendGrid configurado via env SENDGRID_API_KEY
│   └── env/
│       └── production/
│           ├── database.js     # Config de BD para produção
│           └── server.js       # Config de servidor para produção
├── src/
│   ├── index.js                # Bootstrap entry (mínimo)
│   ├── api/
│   │   ├── confimation/        # Content Type: Evento de aniversário
│   │   │   ├── content-types/confimation/schema.json
│   │   │   ├── controllers/confimation.js
│   │   │   ├── routes/confimation.js
│   │   │   ├── services/confimation.js
│   │   │   └── documentation/
│   │   ├── nome-convidado/     # Content Type: Convidado
│   │   │   ├── content-types/nome-convidado/schema.json
│   │   │   ├── controllers/nome-convidado.js
│   │   │   ├── routes/nome-convidado.js
│   │   │   ├── services/nome-convidado.js
│   │   │   └── documentation/
│   │   └── acompanhante/       # Content Type: Acompanhante do convidado
│   │       ├── content-types/acompanhante/schema.json
│   │       ├── controllers/acompanhante.js
│   │       ├── routes/acompanhante.js
│   │       ├── services/acompanhante.js
│   │       └── documentation/
│   ├── extensions/
│   │   ├── documentation/      # Docs auto-gerados da API
│   │   └── users-permissions/  # Plugin de autenticação (customizações)
│   ├── admin/                  # Config webpack do painel admin
│   └── types/generated/        # Tipos TypeScript auto-gerados
├── database/
│   └── migrations/             # Migrações de banco de dados
├── public/
│   └── uploads/                # Arquivos enviados via upload
└── .env.example                # Template de variáveis de ambiente
```

---

## Content Types (Entidades)

### 1. `confimation` (Evento de Aniversário)
**Collection:** `confimations`  
**Endpoint base:** `/api/confimations`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome_aniversariante` | string | Sim | Nome do aniversariante |
| `nome_responsavel` | string | Sim | Nome do organizador |
| `local_evento` | text | Sim | Local da festa |
| `data_evento` | date | Sim | Data (default: 2023-09-08) |
| `hora_evento` | time | Sim | Hora (default: 00:00) |
| `qtd_esperada_convidados` | integer | Não | Quantidade esperada |
| `qtd_confirmado_convidados` | integer | Não | Confirmados (default: 0) |
| `qtd_nao_confirmado_convidados` | biginteger | Não | Não confirmados (default: 0) |
| `qtd_acompanhantes_confirm` | biginteger | Não | Acompanhantes confirmados (default: 0) |
| `contato_confirm` | biginteger | Não | Telefone de contato |
| `users_permissions_user` | manyToOne | - | Usuário criador do evento |
| `nome_convidados` | oneToMany | - | Lista de convidados |

### 2. `nome-convidado` (Convidado)
**Collection:** `nome_convidados`  
**Endpoint base:** `/api/nome-convidados`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome_convidado` | string | Não | Nome do convidado |
| `phone_contato` | biginteger | Não | Telefone do convidado |
| `qtd_acompanhantes` | integer | Não | Quantidade de acompanhantes |
| `tem_acompanhates` | boolean | Não | Tem acompanhantes? (default: false) |
| `ip_user` | text | Não | IP para prevenção de duplicatas |
| `confirmation` | manyToOne | - | Evento pai |
| `acompanhantes` | oneToMany | - | Lista de acompanhantes |

### 3. `acompanhante` (Acompanhante)
**Collection:** `acompanhantes`  
**Endpoint base:** `/api/acompanhantes`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `name_acompanhante` | string | Não | Nome do acompanhante |
| `categoria_acompanhantes` | string | Não | Categoria/tipo do acompanhante |
| `nome_convidado` | manyToOne | - | Convidado pai |

---

## Endpoints REST

### Autenticação (plugin users-permissions)
```
POST /api/auth/local                    # Login
POST /api/auth/local/register           # Registro
GET  /api/users/:id?populate=*          # Dados do usuário com relações
```

### Eventos (Confimations)
```
GET    /api/confimations?populate=*     # Listar todos os eventos
GET    /api/confimations/:id?populate=* # Buscar evento com convidados e acompanhantes
POST   /api/confimations                # Criar evento
PUT    /api/confimations/:id            # Atualizar contagens do evento
DELETE /api/confimations/:id            # Remover evento
```

### Convidados (Nome Convidados)
```
GET    /api/nome-convidados             # Listar todos os convidados
GET    /api/nome-convidados/:id?populate=* # Convidado com acompanhantes
POST   /api/nome-convidados             # Criar convidado (salva IP para dedup)
PUT    /api/nome-convidados/:id         # Atualizar convidado
DELETE /api/nome-convidados/:id         # Remover convidado
```

### Acompanhantes
```
GET    /api/acompanhantes               # Listar acompanhantes
POST   /api/acompanhantes               # Criar acompanhante (chamado em loop no frontend)
DELETE /api/acompanhantes/:id           # Remover acompanhante
```

---

## Plugins Instalados

| Plugin | Versão | Função |
|---|---|---|
| `@strapi/plugin-users-permissions` | 4.13.7 | Autenticação JWT + gestão de usuários/roles |
| `@strapi/plugin-graphql` | 4.13.7 | Endpoint GraphQL em `/graphql` |
| `@strapi/plugin-documentation` | 4.13.7 | Docs automáticos da API |
| `@strapi/plugin-i18n` | 4.13.7 | Internacionalização |
| `strapi-plugin-email` | 3.6.11 | Serviço de e-mail |
| `@amicaldo/strapi-google-maps` | 1.1.3 | Integração Google Maps |

---

## Variáveis de Ambiente

```bash
HOST=0.0.0.0
PORT=1337
APP_KEYS=toBeModified1,toBeModified2
API_TOKEN_SALT=tobemodified
ADMIN_JWT_SECRET=tobemodified
TRANSFER_TOKEN_SALT=tobemodified
JWT_SECRET=tobemodified

# SendGrid
SENDGRID_API_KEY=sua_chave_aqui

# Banco (produção)
DATABASE_CLIENT=postgres        # ou mysql
DATABASE_HOST=host
DATABASE_PORT=5432
DATABASE_NAME=nome_bd
DATABASE_USERNAME=usuario
DATABASE_PASSWORD=senha
DATABASE_SSL=true
```

---

## Configurações Importantes

### Paginação (`config/api.js`)
- Default: 25 itens/página
- Máximo: 100 itens/página
- `withCount: true` (retorna total de registros)

### CORS (`config/middlewares.js`)
- Configurado no middleware padrão do Strapi
- Ajustar origens permitidas conforme necessário para o domínio do frontend

### Controllers e Routes
Todos os controllers e routes usam factory do Strapi:
```js
// Padrão atual — sem customizações
module.exports = createCoreController('api::confimation.confimation');
module.exports = createCoreRouter('api::confimation.confimation');
```
Para adicionar lógica customizada, sobrescrever métodos dentro do `createCoreController`.

---

## Relações Entre Entidades

```
users_permissions_user (1)
    └─── confimation (N)          # Um usuário tem vários eventos
              └─── nome_convidado (N)    # Um evento tem vários convidados
                        └─── acompanhante (N)  # Um convidado tem vários acompanhantes
```

---

## Scripts

```bash
npm run develop   # Dev com auto-reload (porta 1337)
npm run start     # Produção sem auto-reload
npm run build     # Build do painel admin
```

---

## Deploy

- **Plataforma:** Heroku
- **Node:** 18.17.0
- **Banco de produção:** PostgreSQL (configurar via env vars)
- **Upload de arquivos:** `public/uploads/` (considerar migrar para S3 em escala)

---

## Histórico de Mudanças

| Data | Descrição | Autor |
|---|---|---|
| 2026-04-10 | Criação do CLAUDE.md com mapeamento inicial completo | Claude |
