# ESTADO

## Decisions

### AD-001
- **Decision**: `.specs/` é a fonte da verdade das features; toda feature nova segue o fluxo do harness tlc-spec-driven (Specify → Design/Tasks conforme necessário → Execute → Verify).
- **Reason**: Rastreabilidade requisito→teste e gates determinísticos evitam deriva silenciosa entre intenção e código.
- **Trade-off**: Mais cerimônia por feature em troca de critérios de aceite auditáveis e commits atômicos.
- **Scope**: Todas as features deste projeto NestJS user-registration-api
- **Date**: 2026-08-15
- **Status**: active

### AD-002
- **Decision**: O gate de Build roda `npx eslint "{src,test}/**/*.ts"` sem `--fix`.
- **Reason**: O script `npm run lint` usa `--fix` e mutaria arquivos durante a verificação, contaminando o commit atômico da task.
- **Trade-off**: O comando do gate difere do script `lint` do package.json; o lint manual continua auto-corrigindo.
- **Scope**: Gate Check Commands em todo `tasks.md` de feature
- **Date**: 2026-08-15
- **Status**: active

### AD-003
- **Decision**: A claim JWT `sub` é o UUID do usuário (`User.id`), não o e-mail.
- **Reason**: O self-update em `PATCH /users/:id` compara o subject do token com o id da rota; e-mail como `sub` não casa com o parâmetro UUID.
- **Trade-off**: Tokens antigos com e-mail em `sub` ficam inconsistentes para ownership até o cliente fazer login de novo; o formato da resposta de login permanece o mesmo.
- **Scope**: Payload do AuthService e qualquer checagem futura de ownership
- **Date**: 2026-08-15
- **Status**: active

### AD-004
- **Decision**: Conteúdo narrativo em `.specs/` é escrito em português (Brasil); títulos de seção exigidos pelos scripts de validação e palavras-chave EARS (`WHEN`/`WHILE`/`WHERE`/`IF`/`SHALL`) permanecem em inglês.
- **Reason**: Os gates `validate_spec.py` / `validate_tasks.py` batem em nomes de seção e padrões EARS em inglês; traduzir esses títulos quebraria os gates.
- **Trade-off**: Artefatos bilingues (estrutura em inglês, prosa em pt-BR) em vez de 100% português.
- **Scope**: Todos os artefatos sob `.specs/`
- **Date**: 2026-08-15
- **Status**: active

## Handoff

- **Feature**: user-profile-update
- **Phase / Task**: Execute concluído — Verifier PASS
- **Completed**: T1–T5, correção (USR-12/401/P2025), validation.md PASS; artefatos traduzidos para pt-BR
- **In-progress**: none
- **Next step**: nenhuma — feature pronta; push só com autorização explícita
- **Blockers**: none
- **Uncommitted files**: nenhum
- **Branch**: feat/001
