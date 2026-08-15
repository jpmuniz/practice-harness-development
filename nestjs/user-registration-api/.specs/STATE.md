# STATE

## Decisions

### AD-001
- **Decision**: `.specs/` is the source of truth for features; every new feature follows the tlc-spec-driven harness flow (Specify → Design/Tasks as needed → Execute → Verify).
- **Reason**: Requirement-to-test traceability and deterministic gates prevent silent drift between intent and code.
- **Trade-off**: More ceremony per feature in exchange for auditable acceptance criteria and atomic commits.
- **Scope**: All features under this NestJS user-registration-api project
- **Date**: 2026-08-15
- **Status**: active

### AD-002
- **Decision**: Build-level gate runs `npx eslint "{src,test}/**/*.ts"` without `--fix`.
- **Reason**: `npm run lint` uses `--fix` and would mutate files during verification, contaminating the task's atomic commit.
- **Trade-off**: Gate command differs from the package.json `lint` script; manual lint still auto-fixes.
- **Scope**: Gate Check Commands in every feature `tasks.md`
- **Date**: 2026-08-15
- **Status**: active

### AD-003
- **Decision**: JWT `sub` claim is the user UUID (`User.id`), not email.
- **Reason**: Self-update on `PATCH /users/:id` compares token subject to the path id; email-as-sub cannot match a UUID route param.
- **Trade-off**: Existing tokens with email-as-sub become ownership-mismatched until clients re-login; login response shape otherwise unchanged.
- **Scope**: AuthService payload and any future ownership checks
- **Date**: 2026-08-15
- **Status**: active

## Handoff

- **Feature**: user-profile-update
- **Phase / Task**: Execute / T1 - JWT sub = user id
- **Completed**: bootstrap, specify, design, tasks (validate_tasks OK)
- **In-progress**: T1
- **Next step**: Implement T1 AuthService payload + unit tests
- **Blockers**: none
- **Uncommitted files**: `.specs/`
- **Branch**: master
