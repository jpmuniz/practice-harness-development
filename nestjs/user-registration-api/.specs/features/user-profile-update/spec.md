# Especificação — Atualização de Perfil de Usuário

## Problem Statement

`PATCH /users/:id` é um stub que devolve uma string e coerciona UUID com `+id`. O repositório já tem `updateUser`, mas não é usado. Chamadores não conseguem atualizar dados de perfil, e não há autorização nem checagem de unicidade na atualização.

## Goals

- [ ] Usuários autenticados podem atualizar um usuário existente por UUID com persistência real
- [ ] Autorização garante self-update para usuários normal e update de qualquer usuário para admin; só admin altera `perfil`
- [ ] Unicidade de e-mail e validação falham com status HTTP precisos; respostas nunca incluem `password`

## Out of Scope

Exclusões explícitas. Documentadas para evitar escopo creeping.

| Feature | Reason |
| ------- | ------ |
| Auto-cadastro público (RF01) | Decisão de produto separada |
| Omitir password na listagem GET | Correção de segurança separada |
| Login 401 vs 404 | Correção de auth separada |
| Envio de e-mail (RF04) | Feature separada |
| Nota fiscal / NFe (RF05) | Feature separada |
| GET usuário por id | Gap separado do RF02 |

---

## Assumptions & Open Questions

Toda ambiguidade está resolvida ou registrada aqui — nada fica silenciosamente indefinido.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quem pode atualizar | Admin: qualquer usuário; normal: só o próprio (`sub === id`) | Alinha à matriz de permissões do PRD para editar próprio perfil | y |
| Quem pode mudar `perfil` | Só admin; normal enviando `perfil` → 403 | Regra 5 do PRD | y |
| Campos atualizáveis | Parcial: name, email, neighborhood, street, password; perfil só admin | Alinha ao formato de `UserDto` / `UpdateUserDto` | y |
| Body PATCH vazio | 400 Bad Request | Update sem efeito não é útil e esconde bug de cliente | y |
| E-mail duplicado no update | 409 Conflict (excluindo o próprio) | Mesmo contrato do create + UniqueEmailPipe | y |
| Corpo da resposta | 200 + usuário sem `password` | Mesmo padrão de omit do `findOne`; evita vazamento de hash | y |
| Tipo do id | UUID string, sem `+id` | Schema usa `String @id @default(uuid())` | y |
| Usuário inexistente | 404 Not Found | Alinha ao `findOne` / estilo Nest | y |
| Senha no update | Hash com bcrypt saltRounds 10 quando enviada | Mesmo caminho do create | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Persistir atualização de perfil ⭐ MVP

**User Story**: Como admin autenticado, quero atualizar campos de perfil de qualquer usuário por UUID para manter os dados de cadastro atualizados.

**Why P1**: Núcleo do RF03; sem persistência o endpoint é inutilizável.

**Acceptance Criteria** (cada linha é um padrão EARS):

1. WHEN an authenticated admin sends `PATCH /users/:id` with a valid partial body THEN the system SHALL persist the changes and respond with HTTP 200 and the updated user without `password`
2. WHEN `:id` is a UUID string THEN the system SHALL use it as the user primary key without numeric coercion
3. IF no user exists for `:id` THEN the system SHALL respond with HTTP 404
4. IF the request body contains no updatable fields THEN the system SHALL respond with HTTP 400
5. The system SHALL never include `password` in the update response body

**Independent Test**: Criar usuário, PATCH name/street como admin com JWT, GET por e-mail e confirmar novos valores; resposta sem campo password.

---

### P1: Self-update e proteção de perfil ⭐ MVP

**User Story**: Como usuário normal autenticado, quero atualizar meu próprio perfil (mas não meu papel) para manter meus dados sem ajuda de admin.

**Why P1**: Exigido pela matriz de permissões do PRD e pela regra 5.

**Acceptance Criteria**:

1. WHEN an authenticated normal user sends `PATCH /users/:id` where `:id` equals their JWT `sub` THEN the system SHALL persist allowed fields and respond with HTTP 200 and the updated user without `password`
2. IF an authenticated normal user sends `PATCH /users/:id` where `:id` differs from their JWT `sub` THEN the system SHALL respond with HTTP 403
3. IF an authenticated normal user includes `perfil` in the body THEN the system SHALL respond with HTTP 403
4. WHEN an authenticated admin includes `perfil` in the body THEN the system SHALL persist the new `perfil` value

**Independent Test**: Login como normal A, PATCH no próprio id ok; PATCH no id de B → 403; PATCH com `perfil` como normal → 403; admin PATCH perfil ok.

---

### P1: Unicidade de e-mail na atualização ⭐ MVP

**User Story**: Como consumidor da API, quero que e-mails duplicados sejam rejeitados no update para preservar a unicidade após o create.

**Why P1**: Unicidade é RNF central já no create; o update não pode furar isso.

**Acceptance Criteria**:

1. IF the new `email` belongs to a different user THEN the system SHALL respond with HTTP 409
2. WHEN the new `email` equals the current user's email THEN the system SHALL accept the update (no conflict with self)
3. IF provided field values fail validation (e.g. invalid email format) THEN the system SHALL respond with HTTP 400

**Independent Test**: Dois usuários; update do e-mail de A para o de B → 409; update do e-mail de A para o mesmo valor → 200.

---

### P2: Troca de senha no update

**User Story**: Como usuário autenticado autorizado a atualizar o alvo, quero trocar a senha via PATCH para rotacionar credenciais sem endpoint separado.

**Why P2**: Útil, mas secundário aos campos de perfil; mesmo endpoint, campo opcional.

**Acceptance Criteria**:

1. WHEN the body includes `password` THEN the system SHALL store a bcrypt hash (not plaintext) and omit `password` from the response
2. WHERE `password` is absent the system SHALL leave the existing password hash unchanged

**Independent Test**: PATCH com password; login com a nova senha ok; senha antiga falha; resposta sem password.

---

## Edge Cases

- IF `:id` is not a valid UUID format THEN the system SHALL respond with HTTP 400
- IF the caller is unauthenticated THEN the system SHALL respond with HTTP 401
- IF Prisma update fails because the record disappeared between check and write THEN the system SHALL respond with HTTP 404
- WHEN only `neighborhood` is sent THEN the system SHALL update only that field and leave others unchanged

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| USR-01 | P1: Persistir atualização de perfil | Execute | Verified |
| USR-02 | P1: Persistir atualização de perfil | Execute | Verified |
| USR-03 | P1: Persistir atualização de perfil | Execute | Verified |
| USR-04 | P1: Persistir atualização de perfil | Execute | Verified |
| USR-05 | P1: Persistir atualização de perfil | Execute | Verified |
| USR-06 | P1: Self-update e proteção de perfil | Execute | Verified |
| USR-07 | P1: Self-update e proteção de perfil | Execute | Verified |
| USR-08 | P1: Self-update e proteção de perfil | Execute | Verified |
| USR-09 | P1: Self-update e proteção de perfil | Execute | Verified |
| USR-10 | P1: Unicidade de e-mail na atualização | Execute | Verified |
| USR-11 | P1: Unicidade de e-mail na atualização | Execute | Verified |
| USR-12 | P1: Unicidade de e-mail na atualização | Execute | Verified |
| USR-13 | P2: Troca de senha no update | Execute | Verified |
| USR-14 | P2: Troca de senha no update | Execute | Verified |

**ID format:** `USR-[NUMBER]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 14 total, 14 mapeados a tasks, 0 sem mapeamento

---

## Success Criteria

- [ ] Admin pode atualizar qualquer usuário por UUID e receber 200 sem password no body
- [ ] Usuário normal atualiza só a si; cross-user e troca de perfil retornam 403
- [ ] E-mail duplicado no update retorna 409; mesmo e-mail do próprio permitido
- [ ] Stub em string e coerção `+id` foram removidos
