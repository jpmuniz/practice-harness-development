# User Profile Update Context

**Gathered:** 2026-08-15
**Spec:** `.specs/features/user-profile-update/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Implement real `PATCH /users/:id` so an authenticated caller can update an existing user by UUID. Replaces the stub that returns a string. Covers authorization, field rules, email uniqueness on change, and a safe response without password hash.

---

## Implementation Decisions

### Who can update

- Authenticated **admin** may update any user.
- Authenticated **normal** user may update **only their own** record (`JWT.sub === :id`).
- Unauthenticated requests remain blocked by the global `AuthGuard` (401).
- Normal user updating another user → 403 Forbidden.

### Updatable fields

- Allowed for self or admin: `name`, `email`, `neighborhood`, `street`, `password` (all optional / partial).
- `perfil`: **admin only**. IF a normal user sends `perfil` THEN the system SHALL reject with 403.
- Empty body (no fields) → 400 Bad Request.

### Email uniqueness on update

- WHEN the new email collides with another user's email THEN respond with 409 Conflict and a clear message (same family as create).
- Changing email to the same value as the current user is allowed (no conflict with self).

### Response format

- HTTP 200 with the updated user object.
- Response MUST omit `password`.
- Include: `id`, `name`, `email`, `perfil`, `neighborhood`, `street`, `createdAt`, `updatedAt`.

### Identifier

- `:id` is a UUID string. Do not coerce with unary `+`.
- Unknown id → 404 with a clear message.

### Agent's Discretion

- Exact Portuguese error message wording for 404 / 403 / 409 / 400, matching existing Nest exception style in the codebase.
- Whether password hashing reuses the same `bcrypt` saltRounds = 10 as create (yes — match create).
- How to wire CASL subject conditions for self-update (conditions on User subject vs custom policy handler).

### Declined / Undiscussed Gray Areas → Assumptions

All product gray areas above were locked from the PRD matrix and gap analysis (self + admin edit; rule 5 on perfil) without a live discuss turn, so they are recorded as Assumptions in `spec.md`.

---

## Specific References

- PRD matrix: Admin and Normal may "Consultar/editar próprio perfil"; only Admin changes perfil (rule 5).
- Gap analysis RF03: stub update, unused `UsersRepository.updateUser()`, `+id` UUID bug, no CASL on PATCH.

---

## Deferred Ideas

- Public self-registration (RF01 product decision).
- Omitting password hash on `GET /users` list.
- Login returning 401 instead of 404.
- Lookup by user id (GET).
- Email module (RF04) and invoice module (RF05).
