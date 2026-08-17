# Design — Atualização de Perfil de Usuário

**Spec**: `.specs/features/user-profile-update/spec.md`
**Context**: `.specs/features/user-profile-update/context.md`
**Status**: Approved

---

## Architecture Overview

Substituir o stub de `PATCH /users/:id` por um slice vertical: controller (UUID string + body via ValidationPipe) → `UsersService.update` (authz, unicidade, hash de senha, omit password) → `UsersRepository.updateUser` já existente. Autorização usa um guard de update consciente da request, além da capability CASL de admin. O JWT `sub` passa a ser o UUID do usuário para o self-update comparar `:id` com o token.

```mermaid
sequenceDiagram
    participant Client
    participant AuthGuard
    participant UpdateGuard
    participant UsersController
    participant UsersService
    participant UsersRepository
    participant DB

    Client->>AuthGuard: PATCH /users/:id + Bearer JWT
    AuthGuard->>UpdateGuard: request.user set
    UpdateGuard->>UpdateGuard: admin OR sub equals id
    UpdateGuard->>UsersController: allow
    UsersController->>UsersService: update(id, dto, actor)
    UsersService->>UsersService: regra de perfil, unicidade, hash password
    UsersService->>UsersRepository: updateUser
    UsersRepository->>DB: prisma.user.update
    DB-->>Client: 200 user without password
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --------- | -------- | ---------- |
| UsersRepository.updateUser | `src/service/user.service.ts` | Ligar a partir do UsersService; omitir password no retorno |
| UsersRepository.getUser | mesmo arquivo | Checagem de unicidade de e-mail excluindo o próprio |
| Padrão de hash bcrypt | `src/users/users.service.ts` create | Reutilizar saltRounds = 10 quando houver password |
| UpdateUserDto | `src/users/dto/update-user.dto.ts` | Manter PartialType(UserDto); ValidationPipe já é global |
| PoliciesGuard / CheckPolicies | `src/casl/` | Referência de padrão; update usa guard dedicado para ownership |
| Mensagem ConflictException | `src/pipes/unique-email.pipe.ts` | Mesma mensagem em português no e-mail duplicado |

### Integration Points

| System | Integration Method |
| ------ | ------------------ |
| JWT AuthGuard | Global; `request.user` deve expor `sub` como id do usuário |
| Prisma User | Update por `{ id }`; unique em email |
| CASL | Admin mantém Update irrestrito; ownership do normal no UpdateUserGuard |

---

## Components

### AuthService JWT payload (mudança)

- **Purpose**: Colocar id estável do usuário em `sub` para as checagens de ownership do PATCH
- **Location**: `src/auth/auth.service.ts`
- **Interfaces**:
  - `signIn(email, password): { access_token }` — payload `{ sub: user.id, username, perfil, email }`
- **Dependencies**: UsersRepository, JwtService
- **Reuses**: Fluxo atual de signIn; só muda o formato do payload

### UpdateUserGuard

- **Purpose**: Permitir PATCH quando o ator é admin OU `request.user.sub === params.id`
- **Location**: `src/users/update-user.guard.ts`
- **Interfaces**:
  - `canActivate(context): Promise<boolean>` — lança ForbiddenException ao negar
- **Dependencies**: `perfil === admin` direto (ou CaslAbilityFactory)
- **Reuses**: Tipo AuthenticatedUser do casl-ability.factory

### UsersService.update

- **Purpose**: Aplicar regras de negócio e persistir o update
- **Location**: `src/users/users.service.ts`
- **Interfaces**:
  - `update(id: string, dto: UpdateUserDto, actor: AuthenticatedUser): Promise<Omit<User, 'password'>>`
- **Dependencies**: UsersRepository
- **Reuses**: hash de senha do create(); estilo NotFoundException do findOne
- **Rules**:
  - SE usuário ausente → 404
  - SE ator normal e `dto.perfil` definido → 403
  - SE `dto.email` definido e outro usuário o possui → 409
  - SE body sem chaves após remover undefined → 400
  - SE password enviado → hash; senão omitir do data do prisma
  - Retornar usuário sem password
  - SE Prisma devolver P2025 no write → 404

### UsersRepository.updateUser

- **Purpose**: Persistir e devolver projeção segura
- **Location**: `src/service/user.service.ts`
- **Change**: `omit: { password: true }` no resultado do update (espelha getUser)

### UsersController.update

- **Purpose**: Adaptador HTTP
- **Location**: `src/users/users.controller.ts`
- **Change**: Passar `id` como string (sem `+id`); `@UseGuards(UpdateUserGuard)`; passar `request.user` ao service; ParseUUIDPipe para 400 em UUID inválido

### UpdateUserPolicyHandler (opcional fino)

- Desnecessário se o UpdateUserGuard cobrir admin + ownership. Preferir um único guard para evitar duas camadas de policy.

---

## Data Models (if applicable)

### Payload de update (existente)

```typescript
// UpdateUserDto = PartialType(UserDto)
{
  name?: string
  email?: string
  perfil?: Perfil
  password?: string
  neighborhood?: string
  street?: string
}
```

### Payload JWT (novo)

```typescript
{
  sub: string      // user.id UUID
  username: string
  perfil: Perfil
  email: string    // conveniência para logs; não usado em ownership
}
```

**Relationships**: `sub` deve ser igual a `User.id` nas checagens de self-update.

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| -------------- | -------- | ----------- |
| JWT ausente / inválido | AuthGuard UnauthorizedException | 401 |
| Normal atualiza outro usuário | UpdateUserGuard ForbiddenException | 403 |
| Normal envia perfil | UsersService ForbiddenException | 403 |
| Id desconhecido | NotFoundException | 404 |
| E-mail duplicado | ConflictException | 409 |
| Body vazio / campos inválidos / UUID inválido | BadRequestException / ValidationPipe / ParseUUIDPipe | 400 |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| ------- | -------------------- | ------ | ---------- |
| JWT `sub` era e-mail | `src/auth/auth.service.ts` | Self-update por UUID impossível | Mudar `sub` para `user.id` (AD-003); tokens antigos ficam inconsistentes até novo login |
| E2e scaffold obsoleto | `test/app.e2e-spec.ts` | Gate Full falha | Substituir por e2e de PATCH users nesta feature |
| Sem testes unitários / jest vazio falha | config jest | Gate Quick falha | Primeira task já entrega `*.spec.ts` |
| Sem validators de password no UserDto | `create-user.dto.ts` | Senha fraca no update | Fora de escopo; só hashear se presente |
| Throttler 5/60s | `app.module.ts` | e2e pode ser throttled | Sobrescrever ThrottlerGuard no e2e |

---

## Tech Decisions (only non-obvious ones)

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Claim JWT `sub` | UUID do usuário (`user.id`) | Comparar ownership em `:id` exige id no token; e-mail em `sub` bloqueia RF03 |
| Mecanismo de authz | `UpdateUserGuard` dedicado (admin OU self) | API atual de PoliciesHandler não recebe request/params; evita reescrever todas as policies |
| Restrição de perfil | Enforce no UsersService após o guard | Guard responde "quem pode tocar esta linha"; service responde "quais campos" |
| Unicidade de e-mail | Checagem no service excluindo o id atual | UniqueEmailPipe é orientado a create (sem id para excluir) |
| E2e obsoleto | Remover Hello World; adicionar e2e de PATCH users | Necessário para gates Full/Build |

> **Decisões de projeto:** JWT `sub` = id do usuário está em AD-003 no `.specs/STATE.md`.
