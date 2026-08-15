# Análise de Aderência ao PRD — API de Cadastro de Usuários

Referência: PRD — API de Cadastro de Usuários (NestJS).  
Data da avaliação: 2026-08-15.  
Escopo: inventário factual do código atual; **nenhuma correção** foi aplicada nesta etapa.

---

## Resumo executivo

| Área | Status |
|------|--------|
| Modelo de dados (User) | Atendido (com campo extra `password`) |
| RF01 — Cadastro + unicidade de e-mail | Parcial — unicidade OK; auto-cadastro bloqueado |
| RF02 — Consulta | Parcial — só por e-mail |
| RF03 — Atualização | Não implementado (stub) |
| RF04 — Envio de e-mail | Não implementado |
| RF05 — Emissão de nota fiscal | Não implementado |
| RNF — Autenticação JWT | Atendido |
| RNF — Autorização RBAC/CASL | Parcial |
| RNF — Validação / auditoria | Parcial |

---

## Modelo de dados

Schema em `prisma/schema.prisma`:

| Campo PRD | Implementação | Status |
|-----------|---------------|--------|
| `id` UUID | `String @id @default(uuid())` | OK |
| `nome` | `name` | OK (nome em inglês) |
| `email` único | `email String @unique` | OK |
| `perfil` enum admin/normal | `enum Perfil { admin normal }` | OK |
| `endereco.bairro` | `neighborhood` | OK |
| `endereco.rua` | `street` | OK |
| `criadoEm` / `atualizadoEm` | `createdAt` / `updatedAt` | OK |
| — | `password` (não está no PRD) | Extra (necessário para JWT) |

Há também um model `Commercial` mínimo (`id`, `authorId`) sem campos fiscais e sem endpoints.

---

## Requisitos funcionais

### RF01 — Cadastro de Usuário — Parcial

**Atendido**

- DTO com nome, e-mail, bairro, rua e perfil (`UserDto` + `class-validator`).
- Unicidade: constraint Prisma `@unique` + `UniqueEmailPipe` → `ConflictException` 409 com mensagem amigável.
- Critério de aceite de e-mail duplicado: cumprido.

**Divergência crítica**

- O PRD diz que **qualquer pessoa** pode se cadastrar (matriz: Admin e Normal).
- `POST /users` está sob `AuthGuard` global **e** `PoliciesGuard` + `CreateUserPolicyHandler`, que exige perfil `admin`.
- Auto-cadastro é impossível: precisa de JWT de um admin já existente.
- Colide com a regra 5 (só admin altera perfil): falta decisão de produto (ex.: rota pública forçando `perfil = normal`).

### RF02 — Consulta de Usuário — Parcial

- Existe `GET /users/:email` (com `ParseEmailPipe`).
- Existe `GET /users` (lista todos).
- **Falta** consulta por ID.
- `getAllusers()` não omite `password` → `GET /users` pode expor hashes.

### RF03 — Atualização de Usuário — Não implementado

- `PATCH /users/:id` chama `UsersService.update()`, que retorna a string stub `"This action updates a #${id} user"`.
- `UsersRepository.updateUser()` existe mas não é usado.
- Sem política CASL e sem restrição de troca de perfil (regra 5).
- Coerção `+id` trata UUID como número — incorreto para o schema.

### RF04 — Envio de E-mail — Não implementado

- Sem nodemailer / `@nestjs-modules/mailer` / módulo de mail.
- Sem rota de envio.
- E-mail aparece só como campo do usuário e login.

### RF05 — Emissão de Nota Fiscal — Não implementado

- Sem rota, sem integração SEFAZ/NFe.
- `Commercial` no schema não tem dados fiscais.
- `commercial.service.ts` declara `PostsService`, não está no `ServiceModule` e não tem controller.

---

## Requisitos não funcionais

| RNF | Status | Notas |
|-----|--------|-------|
| Autenticação (token) | Atendido | JWT global; `/auth/login` é `@Public()`; expiração 600s |
| Autorização por perfil | Parcial | CASL só em `POST` e `DELETE` de users; GET/PATCH sem PoliciesGuard |
| Validação de dados | Parcial | nome/e-mail/bairro/rua OK; `password` sem validators; default `"changeme"` no schema |
| Unicidade de e-mail | Atendido | Schema + pipe |
| Auditoria created/updated | Atendido | Prisma `@default(now())` / `@updatedAt` |

---

## Matriz de permissões (PRD × código)

| Caso de Uso | PRD Admin | PRD Normal | Código atual |
|-------------|-----------|------------|--------------|
| Cadastrar usuário | Sim | Sim | Só Admin (e autenticado) |
| Consultar/editar próprio perfil | Sim | Sim | Qualquer autenticado lê todos; editar é stub; sem escopo “próprio” |
| Enviar e-mail | Sim | Sim | Inexistente |
| Emitir nota fiscal | Sim | Não | Inexistente |

CASL hoje:

- **admin:** Create/Delete/Update User + Read all
- **normal:** Read all apenas

---

## Riscos e débitos técnicos

1. **Bootstrap de admin:** sem rota pública de cadastro, o primeiro admin precisa ser criado fora da API (seed/SQL).
2. **Vazamento de password hash** em `GET /users`.
3. **Login com 404:** `signIn` usa `NotFoundException` em vez de 401.
4. **Throttler global** (5 req/60s) em toda a API; `@Throttle` no login está importado e não aplicado.
5. **Testes:** sem `*.spec.ts`; e2e padrão testa `GET /` inexistente.
6. **Entity `User` vazia** e classe `Article` de permissão não usadas.

---

## Priorização sugerida (próximos passos)

1. Decidir produto do RF01 (cadastro público vs. só admin) e alinhar guards.
2. Implementar RF03 de verdade + restrição de perfil (regra 5).
3. Consulta por ID; omitir `password` em listagens.
4. RF04 (módulo de e-mail stub ou provider real).
5. RF05 (módulo nota fiscal + policy só admin).
6. Corrigir login 401, validar `password`, seed do primeiro admin, testes.
