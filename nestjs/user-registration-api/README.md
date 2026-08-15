# User Registration API

API NestJS para cadastro e gestão de usuários, com autenticação JWT e autorização por perfil (CASL).

## Requisitos

- Node.js 20+
- npm

## Setup

```bash
cp .env.example .env
# Preencha JWT_SECRET no .env

npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

A API sobe em `http://localhost:3000` (ou na porta definida em `PORT`).

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run start:dev` | Desenvolvimento com watch |
| `npm run build` | Build de produção |
| `npm run start:prod` | Sobe o build |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários |
| `npm run test:e2e` | Testes e2e |

## Endpoints principais

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/auth/login` | Pública | Login (retorna JWT) |
| `POST` | `/users` | Admin | Criar usuário |
| `GET` | `/users` | Autenticado | Listar usuários |
| `GET` | `/users/:email` | Autenticado | Buscar por e-mail |
| `PATCH` | `/users/:id` | Autenticado | Atualizar (stub) |
| `DELETE` | `/users/:id` | Admin | Remover usuário |

Envie o token no header: `Authorization: Bearer <access_token>`.

## Documentação

- Análise de aderência ao PRD: [docs/prd-gap-analysis.md](docs/prd-gap-analysis.md)
