# Validação — user-profile-update

**Date**: 2026-08-15  
**Spec**: `.specs/features/user-profile-update/spec.md`  
**Diff range**: `b2a0fec..f84dd48`  
**Verifier**: sub-agente independente (autor ≠ verificador)  
**Verdict**: PASS ✅

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | JWT `sub` assertado como o UUID persistido. |
| T2 | ✅ Done | Testes do guard cobrem admin, self e cross-user. |
| T3 | ✅ Done | Testes de update incluem tradução de `P2025` para `NotFoundException`. |
| T4 | ✅ Done | PATCH faz parse de UUID, usa o update guard e passa o ator. |
| T5 | ✅ Done | E2E cobre sucesso, autorização, validação, conflito e não autenticado. |

---

## Spec-Anchored Acceptance Criteria

| ID | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| -- | --------- | -------------------- | ----------------------- | ------ |
| USR-01 | Admin atualiza perfil parcial válido | Persiste valores; HTTP 200; sem `password` | `test/users-update.e2e-spec.ts:95-108` — `.expect(200)`, `expect(body.name).toBe('User A Updated')`, `expect(body.street).toBe('Nova Rua')`, e `expect(body).not.toHaveProperty('password')` | ✅ PASS |
| USR-02 | `:id` UUID usado como PK sem coerção | Repository recebe UUID string em `where.id` | `src/users/users.service.spec.ts:77-86` — `expect(repo.updateUser).toHaveBeenCalledWith({ where: { id: userId }, ... })` | ✅ PASS |
| USR-03 | Alvo inexistente | HTTP 404 | `test/users-update.e2e-spec.ts:131-136` — `.expect(404)` | ✅ PASS |
| USR-04 | Body de update vazio | HTTP 400 | `src/users/users.service.spec.ts:99-102` — `.rejects.toBeInstanceOf(BadRequestException)` | ✅ PASS |
| USR-05 | Segredo na resposta de update | Resposta nunca inclui `password` | `test/users-update.e2e-spec.ts:106-108` — `expect(body).not.toHaveProperty('password')` | ✅ PASS |
| USR-06 | Normal atualiza próprio perfil | Persiste campo permitido; HTTP 200; sem `password` | `test/users-update.e2e-spec.ts:111-120` — `.expect(200)`, `expect(body.neighborhood).toBe('Bairro Novo')`, e sem password | ✅ PASS |
| USR-07 | Normal atualiza outro usuário | HTTP 403 | `test/users-update.e2e-spec.ts:123-128` — `.expect(403)` | ✅ PASS |
| USR-08 | Normal envia `perfil` | HTTP 403 | `src/users/users.service.spec.ts:105-108` — `.rejects.toBeInstanceOf(ForbiddenException)` | ✅ PASS |
| USR-09 | Admin envia `perfil` | Persiste o novo `perfil` | `src/users/users.service.spec.ts:118-123` — payload de update inclui `data: { perfil: Perfil.admin }` | ✅ PASS |
| USR-10 | E-mail pertence a outro usuário | HTTP 409 | `test/users-update.e2e-spec.ts:139-144` — `.expect(409)` | ✅ PASS |
| USR-11 | Novo e-mail igual ao atual do alvo | Update aceito sem conflito | `src/users/users.service.spec.ts:135-145` — chamada ok e `data: { email: 'user@example.com' }` | ✅ PASS |
| USR-12 | Valor de campo inválido | Formato de e-mail inválido retorna HTTP 400 | `test/users-update.e2e-spec.ts:155-160` — `.expect(400)` | ✅ PASS |
| USR-13 | Password enviado | Guarda hash bcrypt e omite password na resposta | `src/users/users.service.spec.ts:148-161` — `expect(bcrypt.hash).toHaveBeenCalledWith('new-secret', 10)`, payload hasheado, e password ausente | ✅ PASS |
| USR-14 | Password ausente | Hash de senha existente permanece inalterado | `src/users/users.service.spec.ts:77-86` — payload sem password não tem chave `password` | ✅ PASS |

**Status**: ✅ 14/14 ACs bateram o outcome preciso da spec. Sem gaps de precisão da spec.

---

## Edge Cases

- [x] UUID inválido → 400: `test/users-update.e2e-spec.ts:147-152` asserta `.expect(400)`.
- [x] Chamador não autenticado → 401: `test/users-update.e2e-spec.ts:163-167` asserta `.expect(401)`.
- [x] Prisma `P2025` no write → 404: `src/users/users.service.ts:101-115` traduz o erro, e `src/users/users.service.spec.ts:164-170` asserta `NotFoundException`.
- [x] Update só de neighborhood é estreito: `src/users/users.service.ts:76-78` monta só o campo enviado, e `test/users-update.e2e-spec.ts:111-120` verifica o neighborhood alterado.

---

## Discrimination Sensor

O sensor usou worktrees temporárias destacadas em `f84dd48`; scratch removido após cada run. O porcelain da árvore real foi idêntico antes e depois da limpeza.

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1 | `src/users/update-user.guard.ts:28` | Inverteu comparação self de `===` para `!==` | ✅ Killed — `src/users/update-user.guard.spec.ts` falhou nas assertions self-allow e cross-user-deny. |
| 2 | `src/users/users.service.ts:111` | Mudou código Prisma tratado de `P2025` para `P2026` | ✅ Killed — `src/users/users.service.spec.ts` falhou na assertion esperada de `NotFoundException`. |

**Sensor depth**: lightweight  
**Result**: 2/2 killed — PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Código mínimo | ✅ |
| Mudanças cirúrgicas | ✅ |
| Sem escopo creeping | ✅ |
| Alinha a padrões existentes | ✅ |
| Checagem ancorada na spec | ✅ |
| Expectativa de cobertura por camada | ✅ |
| Todo teste mapeia a AC/edge case | ✅ |
| Guidelines documentadas seguidas | ✅ nenhuma — defaults fortes aplicados |

---

## Gate Check

- **Build**: `npm run build` — PASS.
- **Feature lint**: `npx eslint` com escopo nos arquivos auth/users/repository/e2e alterados — PASS.
- **Unit tests**: `npm test` — PASS: 3 suites, 14 testes, 0 failed, 0 skipped.
- **E2E tests**: `npm run test:e2e` — PASS: 1 suite, 8 testes, 0 failed, 0 skipped.
- **Arquivos de teste antes/depois**: 1 → 4 (`+3`); sem diminuição.

---

## Requirement Traceability Update

| Requirement | Verification result |
| ----------- | ------------------- |
| USR-01–USR-14 | ✅ Verified com evidência ancorada na spec |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 14/14 ACs bateram o outcome definido; 0 gaps de precisão.  
**Sensor**: 2/2 mutações mortas.  
**Gate**: build, lint com escopo, 14 unit e 8 e2e passaram.

**What works**: updates autenticados admin/self, proteção de papel, roteamento UUID, segredo na resposta, e-mail duplicado/inválido, hash de senha, rejeição sem auth e tradução de corrida P2025.

**Issues found**: none.

**Next steps**: feature pronta para review.
