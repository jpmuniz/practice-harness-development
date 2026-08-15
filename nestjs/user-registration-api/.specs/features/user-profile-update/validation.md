# user-profile-update Validation

**Date**: 2026-08-15  
**Spec**: `.specs/features/user-profile-update/spec.md`  
**Diff range**: `b2a0fec..f84dd48`  
**Verifier**: independent sub-agent (author ≠ verifier)  
**Verdict**: PASS ✅

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 | ✅ Done | JWT `sub` is asserted as the persisted UUID. |
| T2 | ✅ Done | Guard tests cover admin, self, and cross-user paths. |
| T3 | ✅ Done | Update tests include `P2025` translation to `NotFoundException`. |
| T4 | ✅ Done | PATCH parses UUID, uses the update guard, and passes the actor. |
| T5 | ✅ Done | E2E covers success, authorization, validation, conflict, and unauthenticated paths. |

---

## Spec-Anchored Acceptance Criteria

| ID | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| -- | --------- | -------------------- | ----------------------- | ------ |
| USR-01 | Admin updates a valid partial profile | Persists values; HTTP 200; no `password` | `test/users-update.e2e-spec.ts:95-108` — `.expect(200)`, `expect(body.name).toBe('User A Updated')`, `expect(body.street).toBe('Nova Rua')`, and `expect(body).not.toHaveProperty('password')` | ✅ PASS |
| USR-02 | UUID `:id` is used as the primary key without coercion | Repository receives the UUID string as `where.id` | `src/users/users.service.spec.ts:77-86` — `expect(repo.updateUser).toHaveBeenCalledWith({ where: { id: userId }, ... })` | ✅ PASS |
| USR-03 | Missing target | HTTP 404 | `test/users-update.e2e-spec.ts:131-136` — `.expect(404)` | ✅ PASS |
| USR-04 | Empty update body | HTTP 400 | `src/users/users.service.spec.ts:99-102` — `.rejects.toBeInstanceOf(BadRequestException)` | ✅ PASS |
| USR-05 | Update response secrecy | Response never includes `password` | `test/users-update.e2e-spec.ts:106-108` — `expect(body).not.toHaveProperty('password')` | ✅ PASS |
| USR-06 | Normal user updates own profile | Persists allowed field; HTTP 200; no `password` | `test/users-update.e2e-spec.ts:111-120` — `.expect(200)`, `expect(body.neighborhood).toBe('Bairro Novo')`, and no password | ✅ PASS |
| USR-07 | Normal user updates another user | HTTP 403 | `test/users-update.e2e-spec.ts:123-128` — `.expect(403)` | ✅ PASS |
| USR-08 | Normal user supplies `perfil` | HTTP 403 | `src/users/users.service.spec.ts:105-108` — `.rejects.toBeInstanceOf(ForbiddenException)` | ✅ PASS |
| USR-09 | Admin supplies `perfil` | Persists the new `perfil` | `src/users/users.service.spec.ts:118-123` — exact update payload includes `data: { perfil: Perfil.admin }` | ✅ PASS |
| USR-10 | Email belongs to another user | HTTP 409 | `test/users-update.e2e-spec.ts:139-144` — `.expect(409)` | ✅ PASS |
| USR-11 | New email equals target's existing email | Update is accepted without conflict | `src/users/users.service.spec.ts:135-145` — successful call and `data: { email: 'user@example.com' }` | ✅ PASS |
| USR-12 | Invalid provided field value | Invalid email format returns HTTP 400 | `test/users-update.e2e-spec.ts:155-160` — `.expect(400)` | ✅ PASS |
| USR-13 | Password supplied | Stores bcrypt hash and omits password response field | `src/users/users.service.spec.ts:148-161` — `expect(bcrypt.hash).toHaveBeenCalledWith('new-secret', 10)`, hashed payload, and absent password | ✅ PASS |
| USR-14 | Password absent | Existing password hash remains unchanged | `src/users/users.service.spec.ts:77-86` — password-absent update payload has no `password` key | ✅ PASS |

**Status**: ✅ 14/14 ACs matched their precise specified outcome. No spec-precision gaps.

---

## Edge Cases

- [x] Invalid UUID → 400: `test/users-update.e2e-spec.ts:147-152` asserts `.expect(400)`.
- [x] Unauthenticated caller → 401: `test/users-update.e2e-spec.ts:163-167` asserts `.expect(401)`.
- [x] Prisma `P2025` during write → 404: `src/users/users.service.ts:101-115` translates the error, and `src/users/users.service.spec.ts:164-170` asserts `NotFoundException`.
- [x] Neighborhood-only update is narrow: `src/users/users.service.ts:76-78` constructs only the supplied field, and `test/users-update.e2e-spec.ts:111-120` verifies the changed neighborhood.

---

## Discrimination Sensor

The sensor used temporary detached worktrees at `f84dd48`; scratch worktrees were removed after each run. The real-tree porcelain was identical before and after cleanup:

```text
?? nestjs/user-registration-api/.cursor/
?? nestjs/user-registration-api/.specs/features/user-profile-update/validation.md
```

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| 1 | `src/users/update-user.guard.ts:28` | Reversed self comparison from `===` to `!==` | ✅ Killed — `src/users/update-user.guard.spec.ts` failed the self-allow and cross-user-deny assertions. |
| 2 | `src/users/users.service.ts:111` | Changed handled Prisma error code from `P2025` to `P2026` | ✅ Killed — `src/users/users.service.spec.ts` failed the expected `NotFoundException` assertion. |

**Sensor depth**: lightweight  
**Result**: 2/2 killed — PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ✅ |
| Per-layer coverage expectation | ✅ |
| Every test maps to a spec requirement or listed edge case | ✅ |
| Documented guidelines followed | ✅ none — strong defaults applied |

---

## Gate Check

- **Build**: `npm run build` — PASS.
- **Feature lint**: scoped `npx eslint` over all changed auth, users, repository, and PATCH E2E files — PASS.
- **Unit tests**: `npm test` — PASS: 3 suites, 14 tests, 0 failed, 0 skipped.
- **E2E tests**: `npm run test:e2e` — PASS: 1 suite, 8 tests, 0 failed, 0 skipped.
- **Test files before/after**: 1 → 4 (`+3`); no test-file decrease.

---

## Requirement Traceability Update

| Requirement | Verification result |
| ----------- | ------------------- |
| USR-01–USR-14 | ✅ Verified with spec-anchored evidence |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 14/14 ACs matched the defined outcome; 0 spec-precision gaps.  
**Sensor**: 2/2 mutations killed.  
**Gate**: build, scoped lint, 14 unit tests, and 8 E2E tests passed.

**What works**: authenticated admin/self updates, role protection, UUID routing, response secrecy, duplicate and invalid email handling, password hashing, unauthenticated rejection, and Prisma write-race translation.

**Issues found**: none.

**Next steps**: feature is ready for review.
