# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GBE (Gestion Budgétaire de l'État) is a Spring Boot REST API for budget management at MINFI (Ministère des Finances du Cameroun). It manages budget execution through a multi-role workflow: Ordonnateur → Contrôleur Financier → Comptable.

## Tech Stack

- **Java 17**, Spring Boot 4.0.3
- **Database**: PostgreSQL (Hibernate DDL auto: `update`)
- **Auth**: JWT (jjwt 0.13.0) + TOTP-based 2FA (dev.samstevens.totp)
- **Docs**: SpringDoc OpenAPI 3 (`/swagger-ui/index.html`)
- **Lombok** for boilerplate reduction

## Commands

### Run the database
```bash
docker-compose up -d
```
The Docker Compose PostgreSQL runs on port **5433** (not 5432), database `gbe_db`.

### Configure environment
Create a `.env` file at the project root (loaded via `spring.config.import: optional:file:.env[.properties]`):
```
DB_URL=localhost
DB_PORT=5433
DB_NAME=gbe_db
DB_USERNAME=username
DB_PASSWORD=password
```

### Build
```bash
./mvnw clean package
```

### Run
```bash
./mvnw spring-boot:run
```

### Run tests
```bash
./mvnw test
# Single test class:
./mvnw test -Dtest=ClassName
```

## Architecture

### Package structure (`gov.cmr.minfi.db.gbe.app`)

| Package | Purpose |
|---|---|
| `auth/` | Login, MFA setup, token refresh — controller + service + DTOs |
| `admin/` | User CRUD (create, activate, deactivate, delete) — requires `MANAGE_USERS` permission |
| `affectation/` | Assign users to sections/programmes with a `RoleSysteme` — requires `MANAGE_AFFECTATIONS` |
| `user/` | User profile, password change |
| `iam/role/` | JPA `Role` entity + `RoleSysteme` enum + `Permission` enum |
| `security/` | `JwtService`, `JwtFilter`, `SecurityConfig` |
| `common/` | `BaseEntity`, audit, config (`BeansConfig`, `DataInitializer`), exceptions |
| `exercice/` | Budget year (`Exercice`) |
| `referentiel/` | Budget classification sub-packages (see below) |

### Referentiel sub-packages

The budget classification domain is split into four packages:
- `referentiel/administratif/` — `Section`, `Chapitre`, `TypeSection`, `TypeAdministration`, `CategorieService`
- `referentiel/programmatique/` — `Programme`, `Action`, `Activite`, `Operation`, `Tache`
- `referentiel/economique/` — `TitreDepense`, `RubriqueDepense`, `ParagrapheDepense`, `ArticleDepense`, `SourceFinancement`, `TypeSource`
- `referentiel/fonctionnel/` — `ClasseFonctionnelle`, `DivisionFonctionnelle`, `GroupeFonctionnel`
- `referentiel/geo/` — `Region`, `Departement`, `Arrondissement`

### Key domain concepts

**UserAffectation** is the central authorization object. A user has zero or more affectations, each binding them to a `Section` + optional `Programme` + `RoleSysteme`. The affectation carries a set of `Permission` values (defaulted from the `RoleSysteme`, overridable by admins). On login, all active affectations are embedded in the JWT response as `AffectationContext`.

**RoleSysteme** (enum, not DB-driven per affectation):
`ADMIN`, `ORDONNATEUR_PRINCIPAL`, `ORDONNATEUR_SECONDAIRE`, `ORDONNATEUR_DELEGUE`, `CONTROLEUR_FINANCIER`, `COMPTABLE`

**Permission** (enum): `ENGAGE_DEPENSE`, `REVISER_AE`, `REVISER_CP`, `REJETER_DEPENSE`, `VISA_CFI`, `REJETER_CFI`, `LIQUIDER_DEPENSE`, `PAYER_DEPENSE`, `MANAGE_USERS`, `MANAGE_AFFECTATIONS`

**IAM Role** (`iam/role/Role`) is a separate JPA entity used by Spring Security (`ROLE_ADMIN`, `ROLE_ORDONNATEUR_PRINCIPAL`, …). It is distinct from `RoleSysteme`. Method-level authorization uses `@PreAuthorize("hasAuthority('PERMISSION_NAME')")`.

### Authentication flow

1. `POST /api/v1/auth/login` — authenticates credentials; if `firstLogin=true`, returns QR code URI for TOTP setup; otherwise signals that an OTP is required.
2. `POST /api/v1/auth/setup-mfa` — first-login path: validates the first TOTP code, activates MFA, returns full JWT + `UserContext`.
3. `POST /api/v1/auth/verify` — subsequent logins: validates TOTP code, returns full JWT + `UserContext`.
4. `POST /api/v1/auth/refresh` — rotates access token using a refresh token.

### Exception handling

Throw `BusinessException(ErrorCode, ...)` anywhere in service code. `ApplicationExceptionHandler` maps it to an `ErrorResponse` with the correct HTTP status from `ErrorCode`.

### Data initializer

`DataInitializer` (`@Profile("!prod")`) seeds on startup:
- Roles for every `RoleSysteme` value
- Budget year 2026, section MINFI (code 20), two programmes
- Admin user: `admin@minfi.cm` / `Admin@1234` (`firstLogin=false`, MFA active)
- Test user: `jean.dupont@minfi.cm` / `Test@1234` (`firstLogin=true`, simulates first login)

### Service pattern

Each feature has an interface (e.g., `AdminService`) and one or more implementations in an `impl/` sub-package (e.g., `AdminServiceImpl`). Use `@Qualifier` if multiple implementations exist (see `AuthenticationServiceImpl` vs `AuthenticationServiceV1Impl`).

### BaseEntity

Domain entities that are not `User` extend `BaseEntity`, which provides UUID primary key, `createdDate`, `lastModifiedAt`, `createdBy`, `lastModifiedBy` (populated by `ApplicatorAuditoreAware`).