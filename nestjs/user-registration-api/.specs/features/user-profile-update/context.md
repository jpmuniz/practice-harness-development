# Contexto — Atualização de Perfil de Usuário

**Coletado:** 2026-08-15
**Spec:** `.specs/features/user-profile-update/spec.md`
**Status:** Pronto para design

---

## Feature Boundary

Implementar de fato o `PATCH /users/:id` para que um chamador autenticado atualize um usuário existente por UUID. Substitui o stub que devolve string. Cobre autorização, regras de campos, unicidade de e-mail na alteração e resposta segura sem hash de senha.

---

## Implementation Decisions

### Quem pode atualizar

- **admin** autenticado pode atualizar qualquer usuário.
- Usuário **normal** autenticado pode atualizar **somente o próprio** registro (`JWT.sub === :id`).
- Requisições sem autenticação continuam bloqueadas pelo `AuthGuard` global (401).
- Usuário normal atualizando outro usuário → 403 Forbidden.

### Campos atualizáveis

- Permitidos para self ou admin: `name`, `email`, `neighborhood`, `street`, `password` (todos opcionais / parciais).
- `perfil`: **somente admin**. SE um usuário normal enviar `perfil` ENTÃO o sistema DEVE rejeitar com 403.
- Body vazio (sem campos) → 400 Bad Request.

### Unicidade de e-mail na atualização

- QUANDO o novo e-mail colidir com o de outro usuário ENTÃO responder 409 Conflict com mensagem clara (mesma família do create).
- Trocar o e-mail para o mesmo valor do usuário atual é permitido (sem conflito consigo mesmo).

### Formato da resposta

- HTTP 200 com o objeto do usuário atualizado.
- A resposta NÃO PODE incluir `password`.
- Incluir: `id`, `name`, `email`, `perfil`, `neighborhood`, `street`, `createdAt`, `updatedAt`.

### Identificador

- `:id` é string UUID. Não coercionar com `+`.
- Id desconhecido → 404 com mensagem clara.

### Agent's Discretion

- Texto exato das mensagens de erro em português para 404 / 403 / 409 / 400, alinhado ao estilo Nest já usado no código.
- Hash de senha reutiliza `bcrypt` com saltRounds = 10 como no create (sim — igualar ao create).
- Como amarrar condições CASL de self-update (conditions no subject User vs policy handler customizado).

### Declined / Undiscussed Gray Areas → Assumptions

Todas as áreas cinzentas de produto acima foram travadas a partir da matriz do PRD e da análise de gaps (edição self + admin; regra 5 de perfil) sem rodada live de discuss; ficam registradas como Assumptions em `spec.md`.

---

## Specific References

- Matriz do PRD: Admin e Normal podem "Consultar/editar próprio perfil"; só Admin altera perfil (regra 5).
- Gap analysis RF03: update stub, `UsersRepository.updateUser()` sem uso, bug `+id` em UUID, sem CASL no PATCH.

---

## Deferred Ideas

- Auto-cadastro público (decisão de produto do RF01).
- Omitir hash de senha no `GET /users`.
- Login retornar 401 em vez de 404.
- Consulta por id de usuário (GET).
- Módulo de e-mail (RF04) e módulo de nota fiscal (RF05).
