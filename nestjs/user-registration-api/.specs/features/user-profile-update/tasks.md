# Tasks — Atualização de Perfil de Usuário

## Execution Protocol (MANDATORY -- do not skip)

Implementar estas tasks com a skill `tlc-spec-driven`: **ative-a pelo nome e siga o fluxo Execute e as Critical Rules.** Não procure arquivos da skill por caminho no filesystem. A skill é a fonte da verdade do fluxo completo (ciclo por task, delegação a sub-agentes, revisão de adequação, Verifier, sensor de discriminação).

**Se a skill não puder ser ativada, PARE e avise o usuário — não prossiga sem ela.**

---

**Design**: `.specs/features/user-profile-update/design.md`
**Status**: Done

---

## Test Coverage Matrix

> Gerada a partir do codebase, guidelines do projeto e da spec — confirmar antes do Execute. Guidelines encontradas: nenhuma — defaults fortes aplicados. Piso: unit Nest Jest em `src/**/*.spec.ts`; e2e em `test/*.e2e-spec.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| UsersService (domínio/negócio) | unit | 1:1 com ACs USR no escopo do service; todos os edge cases de update listados | `src/**/*.spec.ts` | `npm test` |
| UpdateUserGuard | unit | Admin permite, self permite, cross-user nega | `src/**/*.spec.ts` | `npm test` |
| AuthService payload | unit | `sub` igual a user.id | `src/**/*.spec.ts` | `npm test` |
| UsersController / rota PATCH | e2e | Happy path admin + self; 403/404/409; sem password no body | `test/*.e2e-spec.ts` | `npm run test:e2e` |
| DTO / entity | none | só gate de build | - | build gate only |

## Gate Check Commands

> Gerado a partir do codebase — confirmar antes do Execute. Lint sem `--fix` conforme AD-002.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Após tasks só com unit tests | `npm test` |
| Full | Após tasks com e2e/integration | `npm test && npm run test:e2e` |
| Build | Após fim de fase ou tasks só de config/entity | `npm run build && npx eslint "{src,test}/**/*.ts" && npm test && npm run test:e2e` |

---

## Execution Plan

Fases ordenadas e sequenciais — cada fase termina antes da próxima; tasks dentro da fase rodam em ordem.

### Phase 1: Fundação de auth

```
T1
```

### Phase 2: Autorização + update de domínio

```
T2 → T3
```

### Phase 3: HTTP + e2e

```
T4 → T5
```

---

## Task Breakdown

### T1: Colocar UUID do usuário no JWT sub

**What**: Alterar o payload de signIn do AuthService para `sub` = `user.id`; incluir claim `email`; manter `username` e `perfil`.
**Where**: `src/auth/auth.service.ts`
**Depends on**: None
**Reuses**: Fluxo atual de signIn / bcrypt compare
**Requirement**: USR-06

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Payload `sub` é o UUID persistido do usuário
- [x] Unit tests assertam `sub === user.id` e incluem email/perfil/username
- [x] Gate passa: `npm test`
- [x] Contagem de testes: pelo menos 1 arquivo novo passa

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete

---

### T2: Adicionar UpdateUserGuard admin-ou-self

**What**: Criar guard que permite PATCH quando o ator tem `perfil` admin OU `request.user.sub === params.id`; caso contrário 403.
**Where**: `src/users/update-user.guard.ts`
**Depends on**: T1
**Reuses**: `AuthenticatedUser` / enum Perfil; estilo de mensagem ForbiddenException do PoliciesGuard
**Requirement**: USR-06, USR-07

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Guard implementa CanActivate com regras admin/self
- [x] Unit tests cobrem admin permite, self permite, outro usuário nega
- [x] Gate passa: `npm test`
- [x] Contagem de testes: suite passa (sem deleções silenciosas)

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete

---

### T3: Implementar UsersService.update com regras de negócio

**What**: Substituir stub por update real: carregar por UUID string, body vazio 400, normal+perfil 403, unicidade de e-mail 409, hash de password, persistir via repository, retornar usuário sem password. Ajustar repository para omitir password se preciso. Traduzir P2025 para 404.
**Where**: `src/users/users.service.ts`
**Depends on**: T2
**Reuses**: `UsersRepository.updateUser` / `getUser`; bcrypt saltRounds 10 do create
**Requirement**: USR-01, USR-02, USR-03, USR-04, USR-05, USR-08, USR-09, USR-10, USR-11, USR-12, USR-13, USR-14

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Stub em string removido; tipo do id é `string`
- [x] Update do repository omite password no retorno
- [x] Unit tests cobrem happy path, 404, 400 vazio, 403 perfil, 409 e-mail, password hasheado, omit password, mesmo e-mail permitido, P2025→404
- [x] Gate passa: `npm test`
- [x] Contagem de testes: suite passa (sem deleções silenciosas)

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete

---

### T4: Ligar controller PATCH ao guard e ao service

**What**: Controller usa id string com ParseUUIDPipe, aplica UpdateUserGuard, passa o ator da request ao service; remove coerção `+id`. Não rodar e2e até T5 (scaffold obsoleto ainda presente).
**Where**: `src/users/users.controller.ts`
**Depends on**: T3
**Reuses**: Padrões atuais do UsersController; Delete já usa id string
**Requirement**: USR-01, USR-02

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `+id` removido; ParseUUIDPipe gera 400 em id inválido
- [x] UpdateUserGuard aplicado no PATCH
- [x] Ator passado para UsersService.update
- [x] Gate passa: `npm run build && npx eslint <arquivos da feature> && npm test` (eslint full-tree bloqueado por dívida pré-existente fora da feature)
- [x] Contagem de testes: suite unit passa

**Tests**: none
**Gate**: build
**Status**: ✅ Complete

---

### T5: Trocar e2e obsoleto pela suite de PATCH /users/:id

**What**: Remover `test/app.e2e-spec.ts`; adicionar e2e cobrindo update admin 200, self 200, cross-user 403, missing 404, e-mail duplicado 409, e-mail inválido 400, sem auth 401, password omitido do body. Atualizar status de rastreabilidade em spec.md.
**Where**: `test/users-update.e2e-spec.ts`
**Depends on**: T4
**Reuses**: AppModule, login Auth, seed de usuários
**Requirement**: USR-01, USR-03, USR-05, USR-06, USR-07, USR-10, USR-12

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] E2e Hello World removido
- [x] E2E cobre os caminhos listados; password nunca na resposta
- [x] Status de rastreabilidade USR-* atualizados em spec.md
- [x] Gate passa: `npm run build && npx eslint <arquivos da feature> && npm test && npm run test:e2e`
- [x] Contagem de testes: casos e2e passam

**Tests**: e2e
**Gate**: full
**Status**: ✅ Complete

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

T1 → T2 → T3 → T4 → T5

Phase 1:  T1
Phase 2:  T2 → T3
Phase 3:  T4 → T5
```

Execução estritamente sequencial — sem paralelismo intra-fase. Total de tasks = 5 (um único batch, execute inline).

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: JWT sub = user id | 1 mudança de service + unit tests | Granular |
| T2: UpdateUserGuard | 1 guard + unit tests | Granular |
| T3: UsersService.update | 1 método de service (+ omit no repo) + unit tests | Granular |
| T4: Wire do controller | 1 método de controller | Granular |
| T5: Suite e2e | 1 arquivo e2e + remoção do scaffold | Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | (início) | Match |
| T2 | T1 | T1 → T2 (fronteira de fase) | Match |
| T3 | T2 | T2 → T3 | Match |
| T4 | T3 | T3 → T4 (fronteira de fase) | Match |
| T5 | T4 | T4 → T5 | Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: JWT sub | AuthService | unit | unit | OK |
| T2: UpdateUserGuard | UpdateUserGuard | unit | unit | OK |
| T3: UsersService.update | UsersService | unit | unit | OK |
| T4: Wire do controller | UsersController | e2e (rotas) | none — e2e em T5 quando executável | OK (merge-forward) |
| T5: e2e PATCH | Controller/rota | e2e | e2e | OK |
