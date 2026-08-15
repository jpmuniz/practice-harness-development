# User Profile Update Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/user-profile-update/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none - strong defaults applied. Floor: Nest Jest unit under `src/**/*.spec.ts`; e2e under `test/*.e2e-spec.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| UsersService (domain/business) | unit | 1:1 to USR ACs in service scope; all listed edge cases for update rules | `src/**/*.spec.ts` | `npm test` |
| UpdateUserGuard | unit | Admin allow, self allow, cross-user deny | `src/**/*.spec.ts` | `npm test` |
| AuthService payload | unit | `sub` equals user.id | `src/**/*.spec.ts` | `npm test` |
| UsersController / PATCH route | e2e | Happy path admin + self; 403/404/409; no password in body | `test/*.e2e-spec.ts` | `npm run test:e2e` |
| DTO / entity | none | build gate only | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute. Lint without `--fix` per AD-002.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `npm test` |
| Full | After tasks with e2e/integration tests | `npm test && npm run test:e2e` |
| Build | After phase completion or config/entity-only tasks | `npm run build && npx eslint "{src,test}/**/*.ts" && npm test && npm run test:e2e` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Auth foundation

```
T1
```

### Phase 2: Authorization + domain update

```
T2 → T3
```

### Phase 3: HTTP + e2e

```
T4 → T5
```

---

## Task Breakdown

### T1: Put user UUID in JWT sub

**What**: Change AuthService signIn payload so `sub` is `user.id`; include `email` claim; keep `username` and `perfil`.
**Where**: `src/auth/auth.service.ts`
**Depends on**: None
**Reuses**: Existing signIn / bcrypt compare flow
**Requirement**: USR-06

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Payload `sub` is the persisted user UUID
- [x] Unit tests assert `sub === user.id` and include email/perfil/username
- [x] Gate check passes: `npm test`
- [x] Test count: at least 1 new test file passes

**Tests**: unit
**Gate**: quick
**Status**: ✅ Complete

---

### T2: Add UpdateUserGuard for admin-or-self

**What**: Create guard that allows PATCH when actor `perfil` is admin OR `request.user.sub === params.id`; otherwise 403.
**Where**: `src/users/update-user.guard.ts`
**Depends on**: T1
**Reuses**: `AuthenticatedUser` / Perfil enum; ForbiddenException message style from PoliciesGuard
**Requirement**: USR-06, USR-07

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [ ] Guard implements CanActivate with admin/self rules
- [ ] Unit tests cover admin allow, self allow, other-user deny
- [ ] Gate check passes: `npm test`
- [ ] Test count: tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T3: Implement UsersService.update with business rules

**What**: Replace stub with real update: load by UUID string, empty-body 400, normal+perfil 403, email uniqueness 409, hash password, persist via repository, return user without password. Adjust repository update to omit password if needed.
**Where**: `src/users/users.service.ts`
**Depends on**: T2
**Reuses**: `UsersRepository.updateUser` / `getUser`; bcrypt saltRounds 10 from create
**Requirement**: USR-01, USR-02, USR-03, USR-04, USR-05, USR-08, USR-09, USR-10, USR-11, USR-12, USR-13, USR-14

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [ ] Stub string response removed; id type is `string`
- [ ] Repository update omits password on return
- [ ] Unit tests cover happy path, 404, 400 empty, 403 perfil, 409 email, password hashed, omit password, self-same email allowed
- [ ] Gate check passes: `npm test`
- [ ] Test count: tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

---

### T4: Wire PATCH controller to guard and service

**What**: Controller uses string id with ParseUUIDPipe, applies UpdateUserGuard, passes actor from request into service; remove unary `+id` coercion. Do not run e2e until T5 (stale scaffold still present).
**Where**: `src/users/users.controller.ts`
**Depends on**: T3
**Reuses**: Existing UsersController patterns; Delete already uses string id
**Requirement**: USR-01, USR-02

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [ ] `+id` removed; ParseUUIDPipe yields 400 on bad id
- [ ] UpdateUserGuard applied on PATCH
- [ ] Actor passed to UsersService.update
- [ ] Gate check passes: `npm run build && npx eslint "{src,test}/**/*.ts" && npm test`
- [ ] Test count: unit suite unchanged/pass

**Tests**: none
**Gate**: build

---

### T5: Replace obsolete e2e with PATCH /users/:id suite

**What**: Delete `test/app.e2e-spec.ts`; add e2e covering admin update 200, self update 200, cross-user 403, missing 404, duplicate email 409, password omitted from body. Update requirement traceability statuses in spec.md.
**Where**: `test/users-update.e2e-spec.ts`
**Depends on**: T4
**Reuses**: AppModule, Auth login, admin create user
**Requirement**: USR-01, USR-03, USR-05, USR-06, USR-07, USR-10

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [ ] Hello World e2e removed
- [ ] E2E covers listed paths; password never in response
- [ ] Spec traceability statuses updated for implemented USR-* ids
- [ ] Gate check passes: `npm run build && npx eslint "{src,test}/**/*.ts" && npm test && npm run test:e2e`
- [ ] Test count: e2e cases pass

**Tests**: e2e
**Gate**: full

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

T1 → T2 → T3 → T4 → T5

Phase 1:  T1
Phase 2:  T2 → T3
Phase 3:  T4 → T5
```

Execution is strictly sequential - there is no intra-phase parallelism. Total tasks = 5 (single batch, execute inline).

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: JWT sub = user id | 1 service change + unit tests | Granular |
| T2: UpdateUserGuard | 1 guard + unit tests | Granular |
| T3: UsersService.update | 1 service method (+ repo omit) + unit tests | Granular |
| T4: Controller wire | 1 controller method | Granular |
| T5: E2E suite | 1 e2e file + remove scaffold | Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | (start) | Match |
| T2 | T1 | T1 → T2 (phase boundary) | Match |
| T3 | T2 | T2 → T3 | Match |
| T4 | T3 | T3 → T4 (phase boundary) | Match |
| T5 | T4 | T4 → T5 | Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: JWT sub | AuthService | unit | unit | OK |
| T2: UpdateUserGuard | UpdateUserGuard | unit | unit | OK |
| T3: UsersService.update | UsersService | unit | unit | OK |
| T4: Controller wire | UsersController | e2e (routes) | none — e2e in T5 when runnable | OK (merge-forward) |
| T5: PATCH e2e | Controller/route | e2e | e2e | OK |
