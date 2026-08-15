# User Profile Update Specification

## Problem Statement

`PATCH /users/:id` is a stub that returns a string and coerces UUID with `+id`. The repository already has `updateUser`, but it is unused. Callers cannot update profile data, and there is no authorization or uniqueness check on update.

## Goals

- [ ] Authenticated users can update an existing user by UUID with a real persistence path
- [ ] Authorization enforces self-update for normal users and any-user update for admins; only admin may change `perfil`
- [ ] Email uniqueness and validation fail with precise HTTP status codes; responses never include `password`

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Public self-registration (RF01) | Separate product decision |
| Omitting password on GET list | Separate security fix |
| Login 401 vs 404 | Separate auth fix |
| Email sending (RF04) | Separate feature |
| Invoice / NFe (RF05) | Separate feature |
| GET user by id | Separate RF02 gap |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Who may update | Admin: any user; normal: own record only (`sub === id`) | Matches PRD permission matrix for own-profile edit | y |
| Who may change `perfil` | Admin only; normal sending `perfil` → 403 | PRD rule 5 | y |
| Updatable fields | Partial: name, email, neighborhood, street, password; perfil admin-only | Aligns with `UserDto` / `UpdateUserDto` shape | y |
| Empty PATCH body | 400 Bad Request | No-op updates are not useful and hide client bugs | y |
| Duplicate email on update | 409 Conflict (exclude self) | Same contract family as create + UniqueEmailPipe | y |
| Response body | 200 + user without `password` | Matches `findOne` omit pattern; avoids hash leak | y |
| Id type | UUID string, no `+id` | Schema uses `String @id @default(uuid())` | y |
| Missing user | 404 Not Found | Matches `findOne` / Nest style | y |
| Password on update | Hash with bcrypt saltRounds 10 when provided | Same as create path | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Persist profile update ⭐ MVP

**User Story**: As an authenticated admin, I want to update any user's profile fields by UUID so that registration data stays current.

**Why P1**: Core of RF03; without persistence the endpoint is unusable.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN an authenticated admin sends `PATCH /users/:id` with a valid partial body THEN the system SHALL persist the changes and respond with HTTP 200 and the updated user without `password`
2. WHEN `:id` is a UUID string THEN the system SHALL use it as the user primary key without numeric coercion
3. IF no user exists for `:id` THEN the system SHALL respond with HTTP 404
4. IF the request body contains no updatable fields THEN the system SHALL respond with HTTP 400
5. The system SHALL never include `password` in the update response body

**Independent Test**: Create a user, PATCH name/street as admin with JWT, GET by email and confirm new values; response has no password field.

---

### P1: Self-update and perfil guard ⭐ MVP

**User Story**: As a normal authenticated user, I want to update my own profile (but not my role) so that I can keep my data current without admin help.

**Why P1**: Required by the PRD permission matrix and rule 5.

**Acceptance Criteria**:

1. WHEN an authenticated normal user sends `PATCH /users/:id` where `:id` equals their JWT `sub` THEN the system SHALL persist allowed fields and respond with HTTP 200 and the updated user without `password`
2. IF an authenticated normal user sends `PATCH /users/:id` where `:id` differs from their JWT `sub` THEN the system SHALL respond with HTTP 403
3. IF an authenticated normal user includes `perfil` in the body THEN the system SHALL respond with HTTP 403
4. WHEN an authenticated admin includes `perfil` in the body THEN the system SHALL persist the new `perfil` value

**Independent Test**: Login as normal user A, PATCH own id succeeds; PATCH user B id returns 403; PATCH with `perfil` as normal returns 403; admin PATCH perfil succeeds.

---

### P1: Email uniqueness on update ⭐ MVP

**User Story**: As the API consumer, I want duplicate emails rejected on update so that uniqueness is preserved after create.

**Why P1**: Uniqueness is a core RNF already enforced on create; update must not bypass it.

**Acceptance Criteria**:

1. IF the new `email` belongs to a different user THEN the system SHALL respond with HTTP 409
2. WHEN the new `email` equals the current user's email THEN the system SHALL accept the update (no conflict with self)
3. IF provided field values fail validation (e.g. invalid email format) THEN the system SHALL respond with HTTP 400

**Independent Test**: Two users; update user A email to user B's email → 409; update A email to same value → 200.

---

### P2: Password change on update

**User Story**: As an authenticated user allowed to update the target, I want to change password via PATCH so that credentials can rotate without a separate endpoint.

**Why P2**: Useful but secondary to profile fields; same endpoint, optional field.

**Acceptance Criteria**:

1. WHEN the body includes `password` THEN the system SHALL store a bcrypt hash (not plaintext) and omit `password` from the response
2. WHERE `password` is absent the system SHALL leave the existing password hash unchanged

**Independent Test**: PATCH with password; login with new password succeeds; old password fails; response has no password.

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
| USR-01 | P1: Persist profile update | Execute | Verified |
| USR-02 | P1: Persist profile update | Execute | Verified |
| USR-03 | P1: Persist profile update | Execute | Verified |
| USR-04 | P1: Persist profile update | Execute | Verified |
| USR-05 | P1: Persist profile update | Execute | Verified |
| USR-06 | P1: Self-update and perfil guard | Execute | Verified |
| USR-07 | P1: Self-update and perfil guard | Execute | Verified |
| USR-08 | P1: Self-update and perfil guard | Execute | Verified |
| USR-09 | P1: Self-update and perfil guard | Execute | Verified |
| USR-10 | P1: Email uniqueness on update | Execute | Verified |
| USR-11 | P1: Email uniqueness on update | Execute | Verified |
| USR-12 | P1: Email uniqueness on update | Execute | Verified |
| USR-13 | P2: Password change on update | Execute | Verified |
| USR-14 | P2: Password change on update | Execute | Verified |

**ID format:** `USR-[NUMBER]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 14 total, 14 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Admin can update any user by UUID and receive 200 without password in the body
- [ ] Normal user can update only self; cross-user and perfil change return 403
- [ ] Duplicate email on update returns 409; self-same email allowed
- [ ] Stub string response and `+id` coercion are gone
