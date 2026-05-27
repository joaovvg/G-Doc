# G-Doc enterprise - PostgreSQL Backend

Este projeto utiliza um banco de dados PostgreSQL com uma API Node.js/Express.xistente do sistema foi mantida no frontend, e a persistência foi movida para uma API própria que grava em banco relacional.

## Estrutura

```text
G-Doc-main/
├── backend/
│   ├── db/
│   │   ├── schema.sql
│   │   └── seed.sql
│   └── src/
│       ├── config.js
│       ├── db.js
│       ├── repositories.js
│       └── server.js
├── components/
├── views/
├── lib/
│   └── database.ts
└── vite.config.ts
```

## O que foi alterado

- Criado backend com API REST para leitura, gravação e exclusão dos dados.
- Criado esquema PostgreSQL com tabelas para:
  - unidades organizacionais
  - perfis e permissões
  - setores
  - usuários, lotações e níveis de acesso autorizados
  - tipos documentais
  - classificações arquivísticas
  - contratos
  - interessados
  - modelos de capa
  - níveis de acesso
  /**
   * Test connection to the PostgreSQL API.
   */documento
  - processos, histórico e interessados do processo
  - logs de acesso
  - contador global de NUP
- O frontend agora consulta a API em `/api/...`.
- Foi mantido cache local apenas como contingência de leitura temporária.

## Banco de dados

Crie um banco PostgreSQL, por exemplo:

```sql
CREATE DATABASE gdoc;
```

Depois execute os scripts:

```bash
psql -U postgres -d gdoc -f backend/db/schema.sql
psql -U postgres -d gdoc -f backend/db/seed.sql
```

## Variáveis de ambiente

### Frontend

Copie `.env.example` para `.env`:

```env
VITE_API_URL=http://localhost:3001
```

### Backend

Copie `backend/.env.example` para `backend/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gdoc
CORS_ORIGIN=http://localhost:3000
```

## Instalação

### Frontend

Na raiz do projeto:

```bash
npm install
```

### Backend

Na pasta `backend`:

```bash
npm install
```

## Execução em desenvolvimento

### Rodar frontend e backend juntos

Na raiz:

```bash
npm run dev
```

### Rodar separadamente

Frontend:

```bash
npm run dev:frontend
```

Backend:

```bash
npm run dev:backend
```

## Endpoints principais

- `GET /api/health`
- `GET /api/:tableName`
- `POST /api/:tableName/upsert`
- `DELETE /api/:tableName/:id`

Tabelas agregadas suportadas pela API:

- `units`
- `profiles`
- `sectors`
- `users`
- `doc_types`
- `classifications`
- `cover_templates`
- `interested`
- `documents`
- `processes`
- `counter`
- `contracts`
- `access_levels`
- `access_logs`

## Observações técnicas

- Os IDs existentes do sistema foram preservados como `TEXT` no PostgreSQL para evitar quebra da regra atual do frontend.
- Campos compostos como permissões, lotações, anexos, comentários e históricos foram normalizados em tabelas auxiliares.
- O login continua compatível com a regra atual do sistema.
- A aplicação continua gerando NUP no frontend com o contador persistido no banco.

## Próximos passos recomendados

1. Mover autenticação para o backend com hash de senha.
2. Criar endpoints específicos de negócio para tramitação, arquivamento, anexação e autuação.
3. Adicionar migrações versionadas com ferramenta própria.
4. Implementar auditoria automática no backend para acessos e mutações.
