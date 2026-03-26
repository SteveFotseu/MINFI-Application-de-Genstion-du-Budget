# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GBE (Gestion Budgétaire de l'État) is a Spring Boot REST API for budget management at MINFI (Ministère des Finances du
Cameroun). It manages budget execution through a multi-role workflow: Ordonnateur → Contrôleur Financier → Comptable.

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

| Package        | Purpose                                                                                   |
|----------------|-------------------------------------------------------------------------------------------|
| `auth/`        | Login, MFA setup, token refresh — controller + service + DTOs                             |
| `admin/`       | User CRUD (create, activate, deactivate, delete) — requires `MANAGE_USERS` permission     |
| `affectation/` | Assign users to sections/programmes with a `RoleSysteme` — requires `MANAGE_AFFECTATIONS` |
| `user/`        | User profile, password change                                                             |
| `iam/role/`    | JPA `Role` entity + `RoleSysteme` enum + `Permission` enum                                |
| `security/`    | `JwtService`, `JwtFilter`, `SecurityConfig`                                               |
| `common/`      | `BaseEntity`, audit, config (`BeansConfig`, `DataInitializer`), exceptions                |
| `exercice/`    | Budget year (`Exercice`)                                                                  |
| `referentiel/` | Budget classification sub-packages (see below)                                            |

### Referentiel sub-packages

The budget classification domain is split into four packages:

- `referentiel/administratif/` — `Section`, `Chapitre`, `TypeSection`, `TypeAdministration`, `CategorieService`
- `referentiel/programmatique/` — `Programme`, `Action`, `Activite`, `Operation`, `Tache`
- `referentiel/economique/` — `TitreDepense`, `RubriqueDepense`, `ParagrapheDepense`, `ArticleDepense`,
  `SourceFinancement`, `TypeSource`
- `referentiel/fonctionnel/` — `ClasseFonctionnelle`, `DivisionFonctionnelle`, `GroupeFonctionnel`
- `referentiel/geo/` — `Region`, `Departement`, `Arrondissement`

### Key domain concepts

**UserAffectation** is the central authorization object. A user has zero or more affectations, each binding them to a
`Section` + optional `Programme` + `RoleSysteme`. The affectation carries a set of `Permission` values (defaulted from
the `RoleSysteme`, overridable by admins). On login, all active affectations are embedded in the JWT response as
`AffectationContext`.

**RoleSysteme** (enum, not DB-driven per affectation):
`ADMIN`, `ORDONNATEUR_PRINCIPAL`, `ORDONNATEUR_SECONDAIRE`, `ORDONNATEUR_DELEGUE`, `CONTROLEUR_FINANCIER`, `COMPTABLE`

**Permission** (enum): `ENGAGE_DEPENSE`, `REVISER_AE`, `REVISER_CP`, `REJETER_DEPENSE`, `VISA_CFI`, `REJETER_CFI`,
`LIQUIDER_DEPENSE`, `PAYER_DEPENSE`, `MANAGE_USERS`, `MANAGE_AFFECTATIONS`

**IAM Role** (`iam/role/Role`) is a separate JPA entity used by Spring Security (`ROLE_ADMIN`,
`ROLE_ORDONNATEUR_PRINCIPAL`, …). It is distinct from `RoleSysteme`. Method-level authorization uses
`@PreAuthorize("hasAuthority('PERMISSION_NAME')")`.

### Authentication flow

1. `POST /api/v1/auth/login` — authenticates credentials; if `firstLogin=true`, returns QR code URI for TOTP setup;
   otherwise signals that an OTP is required.
2. `POST /api/v1/auth/setup-mfa` — first-login path: validates the first TOTP code, activates MFA, returns full JWT +
   `UserContext`.
3. `POST /api/v1/auth/verify` — subsequent logins: validates TOTP code, returns full JWT + `UserContext`.
4. `POST /api/v1/auth/refresh` — rotates access token using a refresh token.

### Exception handling

Throw `BusinessException(ErrorCode, ...)` anywhere in service code. `ApplicationExceptionHandler` maps it to an
`ErrorResponse` with the correct HTTP status from `ErrorCode`.

### Data initializer

`DataInitializer` (`@Profile("!prod")`) seeds on startup:

- Roles for every `RoleSysteme` value
- Budget year 2026, section MINFI (code 20), two programmes
- Admin user: `admin@minfi.cm` / `Admin@1234` (`firstLogin=false`, MFA active)
- Test user: `jean.dupont@minfi.cm` / `Test@1234` (`firstLogin=true`, simulates first login)

### Service pattern

Each feature has an interface (e.g., `AdminService`) and one or more implementations in an `impl/` sub-package (e.g.,
`AdminServiceImpl`). Use `@Qualifier` if multiple implementations exist (see `AuthenticationServiceImpl` vs
`AuthenticationServiceV1Impl`).

### BaseEntity

Domain entities that are not `User` extend `BaseEntity`, which provides UUID primary key, `createdDate`,
`lastModifiedAt`, `createdBy`, `lastModifiedBy` (populated by `ApplicatorAuditoreAware`).

# CONTEXT ACTUEL DU PROJET

Project Context From: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe
Generated On: mer. 25 mars 2026 09:41:40 WAT
===============================================
Ignored Directory Patterns: .* node_modules vendor build dist target __pycache__ .next cache target venv storage
Ignored File Patterns: *.log *.jar *.pdf *.png *.jpg *.class *.sqlite *.csv project_context.txt package-lock.json
yarn.lock composer.lock *.ico pnpm-lock.yaml
===============================================

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/CLAUDE.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GBE (Gestion Budgétaire de l'État) is a Spring Boot REST API for budget management at MINFI (Ministère des Finances du
Cameroun). It manages budget execution through a multi-role workflow: Ordonnateur → Contrôleur Financier → Comptable.

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

| Package        | Purpose                                                                                   |
|----------------|-------------------------------------------------------------------------------------------|
| `auth/`        | Login, MFA setup, token refresh — controller + service + DTOs                             |
| `admin/`       | User CRUD (create, activate, deactivate, delete) — requires `MANAGE_USERS` permission     |
| `affectation/` | Assign users to sections/programmes with a `RoleSysteme` — requires `MANAGE_AFFECTATIONS` |
| `user/`        | User profile, password change                                                             |
| `iam/role/`    | JPA `Role` entity + `RoleSysteme` enum + `Permission` enum                                |
| `security/`    | `JwtService`, `JwtFilter`, `SecurityConfig`                                               |
| `common/`      | `BaseEntity`, audit, config (`BeansConfig`, `DataInitializer`), exceptions                |
| `exercice/`    | Budget year (`Exercice`)                                                                  |
| `referentiel/` | Budget classification sub-packages (see below)                                            |

### Referentiel sub-packages

The budget classification domain is split into four packages:

- `referentiel/administratif/` — `Section`, `Chapitre`, `TypeSection`, `TypeAdministration`, `CategorieService`
- `referentiel/programmatique/` — `Programme`, `Action`, `Activite`, `Operation`, `Tache`
- `referentiel/economique/` — `TitreDepense`, `RubriqueDepense`, `ParagrapheDepense`, `ArticleDepense`,
  `SourceFinancement`, `TypeSource`
- `referentiel/fonctionnel/` — `ClasseFonctionnelle`, `DivisionFonctionnelle`, `GroupeFonctionnel`
- `referentiel/geo/` — `Region`, `Departement`, `Arrondissement`

### Key domain concepts

**UserAffectation** is the central authorization object. A user has zero or more affectations, each binding them to a
`Section` + optional `Programme` + `RoleSysteme`. The affectation carries a set of `Permission` values (defaulted from
the `RoleSysteme`, overridable by admins). On login, all active affectations are embedded in the JWT response as
`AffectationContext`.

**RoleSysteme** (enum, not DB-driven per affectation):
`ADMIN`, `ORDONNATEUR_PRINCIPAL`, `ORDONNATEUR_SECONDAIRE`, `ORDONNATEUR_DELEGUE`, `CONTROLEUR_FINANCIER`, `COMPTABLE`

**Permission** (enum): `ENGAGE_DEPENSE`, `REVISER_AE`, `REVISER_CP`, `REJETER_DEPENSE`, `VISA_CFI`, `REJETER_CFI`,
`LIQUIDER_DEPENSE`, `PAYER_DEPENSE`, `MANAGE_USERS`, `MANAGE_AFFECTATIONS`

**IAM Role** (`iam/role/Role`) is a separate JPA entity used by Spring Security (`ROLE_ADMIN`,
`ROLE_ORDONNATEUR_PRINCIPAL`, …). It is distinct from `RoleSysteme`. Method-level authorization uses
`@PreAuthorize("hasAuthority('PERMISSION_NAME')")`.

### Authentication flow

1. `POST /api/v1/auth/login` — authenticates credentials; if `firstLogin=true`, returns QR code URI for TOTP setup;
   otherwise signals that an OTP is required.
2. `POST /api/v1/auth/setup-mfa` — first-login path: validates the first TOTP code, activates MFA, returns full JWT +
   `UserContext`.
3. `POST /api/v1/auth/verify` — subsequent logins: validates TOTP code, returns full JWT + `UserContext`.
4. `POST /api/v1/auth/refresh` — rotates access token using a refresh token.

### Exception handling

Throw `BusinessException(ErrorCode, ...)` anywhere in service code. `ApplicationExceptionHandler` maps it to an
`ErrorResponse` with the correct HTTP status from `ErrorCode`.

### Data initializer

`DataInitializer` (`@Profile("!prod")`) seeds on startup:

- Roles for every `RoleSysteme` value
- Budget year 2026, section MINFI (code 20), two programmes
- Admin user: `admin@minfi.cm` / `Admin@1234` (`firstLogin=false`, MFA active)
- Test user: `jean.dupont@minfi.cm` / `Test@1234` (`firstLogin=true`, simulates first login)

### Service pattern

Each feature has an interface (e.g., `AdminService`) and one or more implementations in an `impl/` sub-package (e.g.,
`AdminServiceImpl`). Use `@Qualifier` if multiple implementations exist (see `AuthenticationServiceImpl` vs
`AuthenticationServiceV1Impl`).

### BaseEntity

Domain entities that are not `User` extend `BaseEntity`, which provides UUID primary key, `createdDate`,
`lastModifiedAt`, `createdBy`, `lastModifiedBy` (populated by `ApplicatorAuditoreAware`).// END OF FILE: CLAUDE.md

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/docker-compose.yml

services:
postgres:
image: postgres:17.9
container_name: gbe
environment:
POSTGRES_USER: username
POSTGRES_PASSWORD: password
PGDATA: /data/postgres
POSTGRES_DB: gbe_db
volumes:

- postgres:/data/postgres
  ports:
- "5433:5432"
  restart: unless-stopped

volumes:
postgres:
// END OF FILE: docker-compose.yml

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/Dockerfile

# Build stage

FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]// END OF FILE: Dockerfile

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/.env

DB_URL=localhost
DB_PORT=5433
DB_NAME=gbe_db
DB_USERNAME=username
DB_PASSWORD=password// END OF FILE: .env

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/.env.example

BD_URL=your_value
DB_PORT=your_value
BD_NAME=your_value
DB_USERNAME=your_value
BD_PASSOWRD=your_value// END OF FILE: .env.example

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/.gitattributes

/mvnw text eol=lf
*.cmd text eol=crlf
// END OF FILE: .gitattributes

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/.gitignore

HELP.md
target/
.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

### STS ###

.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

### IntelliJ IDEA ###

.idea
*.iws
*.iml
*.ipr

### NetBeans ###

/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/
build/
!**/src/main/**/build/
!**/src/test/**/build/

### VS Code ###

.vscode/

.env
// END OF FILE: .gitignore

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/HELP.md

# Read Me First

The following was discovered as part of building this project:

* The original package name 'gov.cmr..minfi.db.gbe.app' is invalid and this project uses 'gov.cmr.minfi.db.gbe.app'
  instead.

# Getting Started

### Reference Documentation

For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/4.0.3/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/4.0.3/maven-plugin/build-image.html)
* [Spring Web](https://docs.spring.io/spring-boot/4.0.3/reference/web/servlet.html)
* [Spring Data JPA](https://docs.spring.io/spring-boot/4.0.3/reference/data/sql.html#data.sql.jpa-and-spring-data)
* [Spring Security](https://docs.spring.io/spring-boot/4.0.3/reference/web/spring-security.html)
* [Validation](https://docs.spring.io/spring-boot/4.0.3/reference/io/validation.html)

### Guides

The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
* [Securing a Web Application](https://spring.io/guides/gs/securing-web/)
* [Spring Boot and OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)
* [Authenticating a User with LDAP](https://spring.io/guides/gs/authenticating-ldap/)
* [Validation](https://spring.io/guides/gs/validating-form-input/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the
parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

// END OF FILE: HELP.md

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/mvnw

#!/bin/sh

# ----------------------------------------------------------------------------

# Licensed to the Apache Software Foundation (ASF) under one

# or more contributor license agreements. See the NOTICE file

# distributed with this work for additional information

# regarding copyright ownership. The ASF licenses this file

# to you under the Apache License, Version 2.0 (the

# "License"); you may not use this file except in compliance

# with the License. You may obtain a copy of the License at

#

# http://www.apache.org/licenses/LICENSE-2.0

#

# Unless required by applicable law or agreed to in writing,

# software distributed under the License is distributed on an

# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY

# KIND, either express or implied. See the License for the

# specific language governing permissions and limitations

# under the License.

# ----------------------------------------------------------------------------

# ----------------------------------------------------------------------------

# Apache Maven Wrapper startup batch script, version 3.3.4

#

# Optional ENV vars

# -----------------

# JAVA_HOME - location of a JDK home dir, required when download maven via java source

# MVNW_REPOURL - repo url base for downloading maven distribution

# MVNW_USERNAME/MVNW_PASSWORD - user and password for downloading maven

# MVNW_VERBOSE - true: enable verbose log; debug: trace the mvnw script; others: silence the output

# ----------------------------------------------------------------------------

set -euf
[ "${MVNW_VERBOSE-}" != debug ] || set -x

# OS specific support.

native_path() { printf %s\\n "$1"; }
case "$(uname)" in
CYGWIN* | MINGW*)
[ -z "${JAVA_HOME-}" ] || JAVA_HOME="$(cygpath --unix "$JAVA_HOME")"
native_path() { cygpath --path --windows "$1"; }
;;
esac

# set JAVACMD and JAVACCMD

set_java_home() {

# For Cygwin and MinGW, ensure paths are in Unix format before anything is touched

if [ -n "${JAVA_HOME-}" ]; then
if [ -x "$JAVA_HOME/jre/sh/java" ]; then

# IBM's JDK on AIX uses strange locations for the executables

JAVACMD="$JAVA_HOME/jre/sh/java"
JAVACCMD="$JAVA_HOME/jre/sh/javac"
else
JAVACMD="$JAVA_HOME/bin/java"
JAVACCMD="$JAVA_HOME/bin/javac"

      if [ ! -x "$JAVACMD" ] || [ ! -x "$JAVACCMD" ]; then
        echo "The JAVA_HOME environment variable is not defined correctly, so mvnw cannot run." >&2
        echo "JAVA_HOME is set to \"$JAVA_HOME\", but \"\$JAVA_HOME/bin/java\" or \"\$JAVA_HOME/bin/javac\" does not exist." >&2
        return 1
      fi
    fi

else
JAVACMD="$(
'set' +e
'unset' -f command 2>/dev/null
'command' -v java
)" || :
JAVACCMD="$(
'set' +e
'unset' -f command 2>/dev/null
'command' -v javac
)" || :

    if [ ! -x "${JAVACMD-}" ] || [ ! -x "${JAVACCMD-}" ]; then
      echo "The java/javac command does not exist in PATH nor is JAVA_HOME set, so mvnw cannot run." >&2
      return 1
    fi

fi
}

# hash string like Java String::hashCode

hash_string() {
str="${1:-}" h=0
while [ -n "$str" ]; do
char="${str%"${str#?}"}"
h=$(((h * 31 + $(LC_CTYPE=C printf %d "'$char")) % 4294967296))
str="${str#?}"
done
printf %x\\n $h
}

verbose() { :; }
[ "${MVNW_VERBOSE-}" != true ] || verbose() { printf %s\\n "${1-}"; }

die() {
printf %s\\n "$1" >&2
exit 1
}

trim() {

# MWRAPPER-139:

# Trims trailing and leading whitespace, carriage returns, tabs, and linefeeds.

# Needed for removing poorly interpreted newline sequences when running in more

# exotic environments such as mingw bash on Windows.

printf "%s" "${1}" | tr -d '[:space:]'
}

scriptDir="$(dirname "$0")"
scriptName="$(basename "$0")"

# parse distributionUrl and optional distributionSha256Sum, requires .mvn/wrapper/maven-wrapper.properties

while IFS="=" read -r key value; do
case "${key-}" in
distributionUrl) distributionUrl=$(trim "${value-}") ;;
distributionSha256Sum) distributionSha256Sum=$(trim "${value-}") ;;
esac
done <"$scriptDir/.mvn/wrapper/maven-wrapper.properties"
[ -n "${distributionUrl-}" ] || die "cannot read distributionUrl property in $
scriptDir/.mvn/wrapper/maven-wrapper.properties"

case "${distributionUrl##*/}" in
maven-mvnd-*bin.*)
MVN_CMD=mvnd.sh _MVNW_REPO_PATTERN=/maven/mvnd/
case "${PROCESSOR_ARCHITECTURE-}${PROCESSOR_ARCHITEW6432-}:$(uname -a)" in
*AMD64:CYGWIN* | *AMD64:MINGW*) distributionPlatform=windows-amd64 ;;
:Darwin*x86_64) distributionPlatform=darwin-amd64 ;;
:Darwin*arm64) distributionPlatform=darwin-aarch64 ;;
:Linux*x86_64*) distributionPlatform=linux-amd64 ;;
*)
echo "Cannot detect native platform for mvnd on $(uname)-$(uname -m), use pure java version" >&2
distributionPlatform=linux-amd64
;;
esac
distributionUrl="${distributionUrl%-bin.*}-$distributionPlatform.zip"
;;
maven-mvnd-*) MVN_CMD=mvnd.sh _MVNW_REPO_PATTERN=/maven/mvnd/ ;;
*) MVN_CMD="mvn${scriptName#mvnw}" _MVNW_REPO_PATTERN=/org/apache/maven/ ;;
esac

# apply MVNW_REPOURL and calculate MAVEN_HOME

# maven home pattern: ~/.m2/wrapper/dists/{apache-maven-<version>,maven-mvnd-<version>-<platform>}/<hash>

[ -z "${MVNW_REPOURL-}" ] || distributionUrl="$MVNW_REPOURL$_MVNW_REPO_PATTERN${distributionUrl#*"$_MVNW_REPO_PATTERN"}"
distributionUrlName="${distributionUrl##*/}"
distributionUrlNameMain="${distributionUrlName%.*}"
distributionUrlNameMain="${distributionUrlNameMain%-bin}"
MAVEN_USER_HOME="${MAVEN_USER_HOME:-${HOME}/.m2}"
MAVEN_HOME="${MAVEN_USER_HOME}/wrapper/dists/${distributionUrlNameMain-}/$(hash_string "$distributionUrl")"

exec_maven() {
unset MVNW_VERBOSE MVNW_USERNAME MVNW_PASSWORD MVNW_REPOURL || :
exec "$MAVEN_HOME/bin/$MVN_CMD" "$@" || die "cannot exec $MAVEN_HOME/bin/$MVN_CMD"
}

if [ -d "$MAVEN_HOME" ]; then
verbose "found existing MAVEN_HOME at $MAVEN_HOME"
exec_maven "$@"
fi

case "${distributionUrl-}" in
*?-bin.zip | *?maven-mvnd-?*-?*.zip) ;;
*) die "distributionUrl is not valid, must match *-bin.zip or maven-mvnd-*.zip, but found '${distributionUrl-}'" ;;
esac

# prepare tmp dir

if TMP_DOWNLOAD_DIR="$(mktemp -d)" && [ -d "$TMP_DOWNLOAD_DIR" ]; then
clean() { rm -rf -- "$TMP_DOWNLOAD_DIR"; }
trap clean HUP INT TERM EXIT
else
die "cannot create temp dir"
fi

mkdir -p -- "${MAVEN_HOME%/*}"

# Download and Install Apache Maven

verbose "Couldn't find MAVEN_HOME, downloading and installing it ..."
verbose "Downloading from: $distributionUrl"
verbose "Downloading to: $TMP_DOWNLOAD_DIR/$distributionUrlName"

# select .zip or .tar.gz

if ! command -v unzip >/dev/null; then
distributionUrl="${distributionUrl%.zip}.tar.gz"
distributionUrlName="${distributionUrl##*/}"
fi

# verbose opt

__MVNW_QUIET_WGET=--quiet __MVNW_QUIET_CURL=--silent __MVNW_QUIET_UNZIP=-q __MVNW_QUIET_TAR=''
[ "${MVNW_VERBOSE-}" != true ] || __MVNW_QUIET_WGET='' __MVNW_QUIET_CURL='' __MVNW_QUIET_UNZIP='' __MVNW_QUIET_TAR=v

# normalize http auth

case "${MVNW_PASSWORD:+has-password}" in
'') MVNW_USERNAME='' MVNW_PASSWORD='' ;;
has-password) [ -n "${MVNW_USERNAME-}" ] || MVNW_USERNAME='' MVNW_PASSWORD='' ;;
esac

if [ -z "${MVNW_USERNAME-}" ] && command -v wget >/dev/null; then
verbose "Found wget ... using wget"
wget ${__MVNW_QUIET_WGET:+"$__MVNW_QUIET_WGET"} "$distributionUrl" -O "$TMP_DOWNLOAD_DIR/$distributionUrlName" || die "wget: Failed to fetch $distributionUrl"
elif [ -z "${MVNW_USERNAME-}" ] && command -v curl >/dev/null; then
verbose "Found curl ... using curl"
curl ${__MVNW_QUIET_CURL:+"$__MVNW_QUIET_CURL"} -f -L -o "$TMP_DOWNLOAD_DIR/$
distributionUrlName" "$distributionUrl" || die "curl: Failed to fetch $distributionUrl"
elif set_java_home; then
verbose "Falling back to use Java to download"
javaSource="$TMP_DOWNLOAD_DIR/Downloader.java"
targetZip="$TMP_DOWNLOAD_DIR/$distributionUrlName"
cat >"$javaSource" <<-END
public class Downloader extends java.net.Authenticator
{
protected java.net.PasswordAuthentication getPasswordAuthentication()
{
return new java.net.PasswordAuthentication( System.getenv( "MVNW_USERNAME" ), System.getenv( "MVNW_PASSWORD" )
.toCharArray() );
}
public static void main( String[] args ) throws Exception
{
setDefault( new Downloader() );
java.nio.file.Files.copy( java.net.URI.create( args[0] ).toURL().openStream(), java.nio.file.Paths.get( args[1] )
.toAbsolutePath().normalize() );
}
}
END

# For Cygwin/MinGW, switch paths to Windows format before running javac and java

verbose " - Compiling Downloader.java ..."
"$(native_path "$JAVACCMD")" "$(native_path "$javaSource")" || die "Failed to compile Downloader.java"
verbose " - Running Downloader.java ..."
"$(native_path "$JAVACMD")" -cp "$(native_path "$TMP_DOWNLOAD_DIR")" Downloader "$distributionUrl" "$(native_path "$
targetZip")"
fi

# If specified, validate the SHA-256 sum of the Maven distribution zip file

if [ -n "${distributionSha256Sum-}" ]; then
distributionSha256Result=false
if [ "$MVN_CMD" = mvnd.sh ]; then
echo "Checksum validation is not supported for maven-mvnd." >&2
echo "Please disable validation by removing 'distributionSha256Sum' from your maven-wrapper.properties." >&2
exit 1
elif command -v sha256sum >/dev/null; then
if echo "$distributionSha256Sum  $TMP_DOWNLOAD_DIR/$distributionUrlName" | sha256sum -c - >/dev/null 2>&1; then
distributionSha256Result=true
fi
elif command -v shasum >/dev/null; then
if echo "$distributionSha256Sum  $TMP_DOWNLOAD_DIR/$distributionUrlName" | shasum -a 256 -c >/dev/null 2>&1; then
distributionSha256Result=true
fi
else
echo "Checksum validation was requested but neither 'sha256sum' or 'shasum' are available." >&2
echo "Please install either command, or disable validation by removing 'distributionSha256Sum' from your
maven-wrapper.properties." >&2
exit 1
fi
if [ $distributionSha256Result = false ]; then
echo "Error: Failed to validate Maven distribution SHA-256, your Maven distribution might be compromised." >&2
echo "If you updated your Maven version, you need to update the specified distributionSha256Sum property." >&2
exit 1
fi
fi

# unzip and move

if command -v unzip >/dev/null; then
unzip ${__MVNW_QUIET_UNZIP:+"$__MVNW_QUIET_UNZIP"} "$TMP_DOWNLOAD_DIR/$distributionUrlName"
-d "$TMP_DOWNLOAD_DIR" || die "failed to unzip"
else
tar xzf${__MVNW_QUIET_TAR:+"$__MVNW_QUIET_TAR"} "$TMP_DOWNLOAD_DIR/$distributionUrlName" -C "$TMP_DOWNLOAD_DIR" || die "
failed to untar"
fi

# Find the actual extracted directory name (handles snapshots where filename != directory name)

actualDistributionDir=""

# First try the expected directory name (for regular distributions)

if [ -d "$TMP_DOWNLOAD_DIR/$distributionUrlNameMain" ]; then
if [ -f "$TMP_DOWNLOAD_DIR/$distributionUrlNameMain/bin/$MVN_CMD" ]; then
actualDistributionDir="$distributionUrlNameMain"
fi
fi

# If not found, search for any directory with the Maven executable (for snapshots)

if [ -z "$actualDistributionDir" ]; then

# enable globbing to iterate over items

set +f
for dir in "$TMP_DOWNLOAD_DIR"/*; do
if [ -d "$dir" ]; then
if [ -f "$dir/bin/$MVN_CMD" ]; then
actualDistributionDir="$(basename "$dir")"
break
fi
fi
done
set -f
fi

if [ -z "$actualDistributionDir" ]; then
verbose "Contents of $TMP_DOWNLOAD_DIR:"
verbose "$(ls -la "$TMP_DOWNLOAD_DIR")"
die "Could not find Maven distribution directory in extracted archive"
fi

verbose "Found extracted Maven distribution directory: $actualDistributionDir"
printf %s\\n "$distributionUrl" >"$TMP_DOWNLOAD_DIR/$actualDistributionDir/mvnw.url"
mv -- "$TMP_DOWNLOAD_DIR/$actualDistributionDir" "$MAVEN_HOME" || [ -d "$MAVEN_HOME" ] || die "fail to move MAVEN_HOME"

clean || :
exec_maven "$@"
// END OF FILE: mvnw

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/mvnw.cmd

<# : batch portion
@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements. See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership. The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License. You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied. See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.3.4
@REM
@REM Optional ENV vars
@REM MVNW_REPOURL - repo url base for downloading maven distribution
@REM MVNW_USERNAME/MVNW_PASSWORD - user and password for downloading maven
@REM MVNW_VERBOSE - true: enable verbose log; others: silence the output
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_PSMODULEP_SAVE=%PSModulePath%
@SET PSModulePath=
@FOR /F "usebackq tokens=1* delims==" %%A IN (
`powershell -noprofile "& {$scriptDir='%~dp0'; $script='%__MVNW_ARG0_NAME__%'; icm -ScriptBlock ([Scriptblock]::Create((Get-Content -Raw '%~f0'))) -NoNewScope}"`)
DO @(
IF "%%A"=="MVN_CMD" (set __MVNW_CMD__=%%B) ELSE IF "%%B"=="" (echo %%A) ELSE (echo %%A=%%B)
)
@SET PSModulePath=%__MVNW_PSMODULEP_SAVE%
@SET __MVNW_PSMODULEP_SAVE=
@SET __MVNW_ARG0_NAME__=
@SET MVNW_USERNAME=
@SET MVNW_PASSWORD=
@IF NOT "%__MVNW_CMD__%"=="" ("%__MVNW_CMD__%" %*)
@echo Cannot start maven from wrapper >&2 && exit /b 1
@GOTO :EOF
: end batch / begin powershell #>

$ErrorActionPreference = "Stop"
if ($env:MVNW_VERBOSE -eq "true") {
$VerbosePreference = "Continue"
}

# calculate distributionUrl, requires .mvn/wrapper/maven-wrapper.properties

$distributionUrl = (Get-Content -Raw "$scriptDir/.mvn/wrapper/maven-wrapper.properties" | ConvertFrom-StringData)
.distributionUrl
if (!$distributionUrl) {
Write-Error "cannot read distributionUrl property in $scriptDir/.mvn/wrapper/maven-wrapper.properties"
}

switch -wildcard -casesensitive ( $($distributionUrl -replace '^.*/','') ) {
"maven-mvnd-*" {
$USE_MVND = $true
$distributionUrl = $distributionUrl -replace '-bin\.[^.]*$',"-windows-amd64.zip"
$MVN_CMD = "mvnd.cmd"
break
}
default {
$USE_MVND = $false
$MVN_CMD = $script -replace '^mvnw','mvn'
break
}
}

# apply MVNW_REPOURL and calculate MAVEN_HOME

# maven home pattern: ~/.m2/wrapper/dists/{apache-maven-<version>,maven-mvnd-<version>-<platform>}/<hash>

if ($env:MVNW_REPOURL) {
$MVNW_REPO_PATTERN = if ($USE_MVND -eq $False) { "/org/apache/maven/" } else { "/maven/mvnd/" }
$distributionUrl = "$env:MVNW_REPOURL$MVNW_REPO_PATTERN$($distributionUrl -replace "^.*$MVNW_REPO_PATTERN",'')"
}
$distributionUrlName = $distributionUrl -replace '^.*/',''
$distributionUrlNameMain = $distributionUrlName -replace '\.[^.]*$','' -replace '-bin$',''

$MAVEN_M2_PATH = "$HOME/.m2"
if ($env:MAVEN_USER_HOME) {
$MAVEN_M2_PATH = "$env:MAVEN_USER_HOME"
}

if (-not (Test-Path -Path $MAVEN_M2_PATH)) {
New-Item -Path $MAVEN_M2_PATH -ItemType Directory | Out-Null
}

$MAVEN_WRAPPER_DISTS = $null
if ((Get-Item $MAVEN_M2_PATH).Target[0] -eq $null) {
$MAVEN_WRAPPER_DISTS = "$MAVEN_M2_PATH/wrapper/dists"
} else {
$MAVEN_WRAPPER_DISTS = (Get-Item $MAVEN_M2_PATH).Target[0] + "/wrapper/dists"
}

$MAVEN_HOME_PARENT = "$MAVEN_WRAPPER_DISTS/$distributionUrlNameMain"
$MAVEN_HOME_NAME = ([System.Security.Cryptography.SHA256]::Create().ComputeHash([byte[]][
char[]]$distributionUrl) | ForEach-Object {$_.ToString("x2")}) -join ''
$MAVEN_HOME = "$MAVEN_HOME_PARENT/$MAVEN_HOME_NAME"

if (Test-Path -Path "$MAVEN_HOME" -PathType Container) {
Write-Verbose "found existing MAVEN_HOME at $MAVEN_HOME"
Write-Output "MVN_CMD=$MAVEN_HOME/bin/$MVN_CMD"
exit $?
}

if (! $distributionUrlNameMain -or ($distributionUrlName -eq $distributionUrlNameMain)) {
Write-Error "distributionUrl is not valid, must end with *-bin.zip, but found $distributionUrl"
}

# prepare tmp dir

$TMP_DOWNLOAD_DIR_HOLDER = New-TemporaryFile
$TMP_DOWNLOAD_DIR = New-Item -Itemtype Directory -Path "$TMP_DOWNLOAD_DIR_HOLDER.dir"
$TMP_DOWNLOAD_DIR_HOLDER.Delete() | Out-Null
trap {
if ($TMP_DOWNLOAD_DIR.Exists) {
try { Remove-Item $TMP_DOWNLOAD_DIR -Recurse -Force | Out-Null }
catch { Write-Warning "Cannot remove $TMP_DOWNLOAD_DIR" }
}
}

New-Item -Itemtype Directory -Path "$MAVEN_HOME_PARENT" -Force | Out-Null

# Download and Install Apache Maven

Write-Verbose "Couldn't find MAVEN_HOME, downloading and installing it ..."
Write-Verbose "Downloading from: $distributionUrl"
Write-Verbose "Downloading to: $TMP_DOWNLOAD_DIR/$distributionUrlName"

$webclient = New-Object System.Net.WebClient
if ($env:MVNW_USERNAME -and $env:MVNW_PASSWORD) {
$webclient.Credentials = New-Object System.Net.NetworkCredential($env:MVNW_USERNAME, $env:MVNW_PASSWORD)
}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$webclient.DownloadFile($distributionUrl, "$TMP_DOWNLOAD_DIR/$distributionUrlName") | Out-Null

# If specified, validate the SHA-256 sum of the Maven distribution zip file

$distributionSha256Sum = (Get-Content -Raw "$scriptDir/.mvn/wrapper/maven-wrapper.properties" | ConvertFrom-StringData)
.distributionSha256Sum
if ($distributionSha256Sum) {
if ($USE_MVND) {
Write-Error "Checksum validation is not supported for maven-mvnd. `nPlease disable validation by removing '
distributionSha256Sum' from your maven-wrapper.properties."
}
Import-Module $PSHOME\Modules\Microsoft.PowerShell.Utility -Function Get-FileHash
if ((Get-FileHash "$TMP_DOWNLOAD_DIR/$distributionUrlName" -Algorithm SHA256).Hash.ToLower() -ne $
distributionSha256Sum) {
Write-Error "Error: Failed to validate Maven distribution SHA-256, your Maven distribution might be compromised. If you
updated your Maven version, you need to update the specified distributionSha256Sum property."
}
}

# unzip and move

Expand-Archive "$TMP_DOWNLOAD_DIR/$distributionUrlName" -DestinationPath "$TMP_DOWNLOAD_DIR" | Out-Null

# Find the actual extracted directory name (handles snapshots where filename != directory name)

$actualDistributionDir = ""

# First try the expected directory name (for regular distributions)

$expectedPath = Join-Path "$TMP_DOWNLOAD_DIR" "$distributionUrlNameMain"
$expectedMvnPath = Join-Path "$expectedPath" "bin/$MVN_CMD"
if ((Test-Path -Path $expectedPath -PathType Container) -and (Test-Path -Path $expectedMvnPath -PathType Leaf)) {
$actualDistributionDir = $distributionUrlNameMain
}

# If not found, search for any directory with the Maven executable (for snapshots)

if (!$actualDistributionDir) {
Get-ChildItem -Path "$TMP_DOWNLOAD_DIR" -Directory | ForEach-Object {
$testPath = Join-Path $_.FullName "bin/$MVN_CMD"
if (Test-Path -Path $testPath -PathType Leaf) {
$actualDistributionDir = $_.Name
}
}
}

if (!$actualDistributionDir) {
Write-Error "Could not find Maven distribution directory in extracted archive"
}

Write-Verbose "Found extracted Maven distribution directory: $actualDistributionDir"
Rename-Item -Path "$TMP_DOWNLOAD_DIR/$actualDistributionDir" -NewName $MAVEN_HOME_NAME | Out-Null
try {
Move-Item -Path "$TMP_DOWNLOAD_DIR/$MAVEN_HOME_NAME" -Destination $MAVEN_HOME_PARENT | Out-Null
} catch {
if (! (Test-Path -Path "$MAVEN_HOME" -PathType Container)) {
Write-Error "fail to move MAVEN_HOME"
}
} finally {
try { Remove-Item $TMP_DOWNLOAD_DIR -Recurse -Force | Out-Null }
catch { Write-Warning "Cannot remove $TMP_DOWNLOAD_DIR" }
}

Write-Output "MVN_CMD=$MAVEN_HOME/bin/$MVN_CMD"
// END OF FILE: mvnw.cmd

//---> PATH: /home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/pom.xml

<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://maven.apache.org/POM/4.0.0"
xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
<modelVersion>4.0.0</modelVersion>
<parent>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-parent</artifactId>
<version>4.0.3</version>
<relativePath/> <!-- lookup parent from repository -->
</parent>
<groupId>gov.cmr.minfi.db</groupId>
<artifactId>gbe</artifactId>
<version>0.0.1-SNAPSHOT</version>
<name>gbe</name>
<description>GBE Backend</description>
<url/>
<licenses>
<license/>
</licenses>
<developers>
<developer/>
</developers>
<scm>
<connection/>
<developerConnection/>
<tag/>
<url/>
</scm>
<properties>
<java.version>17</java.version>
</properties>
<dependencies>
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-validation</artifactId>
</dependency>
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-webmvc</artifactId>
</dependency>
<!-- Source: https://mvnrepository.com/artifact/org.springdoc/springdoc-openapi-starter-webmvc-ui -->
<dependency>
<groupId>org.springdoc</groupId>
<artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
<version>3.0.1</version>
</dependency>
<!-- Source: https://mvnrepository.com/artifact/io.jsonwebtoken/jjwt-api -->
<dependency>
<groupId>io.jsonwebtoken</groupId>
<artifactId>jjwt-api</artifactId>
<version>0.13.0</version>
</dependency>
<!-- Source: https://mvnrepository.com/artifact/io.jsonwebtoken/jjwt-jackson -->
<dependency>
<groupId>io.jsonwebtoken</groupId>
<artifactId>jjwt-jackson</artifactId>
<version>0.13.0</version>
</dependency>
<!-- Source: https://mvnrepository.com/artifact/io.jsonwebtoken/jjwt-impl -->
<dependency>
<groupId>io.jsonwebtoken</groupId>
<artifactId>jjwt-impl</artifactId>
<version>0.13.0</version>
</dependency>

        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>dev.samstevens.totp</groupId>
            <artifactId>totp</artifactId>
            <version>1.7.1</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>
// END OF FILE: pom.xml

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/admin/AdminController.java

package gov.cmr.minfi.db.gbe.app.admin;

import gov.cmr.minfi.db.gbe.app.admin.dto.CreateUserRequest;
import gov.cmr.minfi.db.gbe.app.admin.dto.UserSummaryResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_USERS')")
@Tag(name = "Admin", description = "Admin API")
public class AdminController {
private final AdminService adminService;

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummaryResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return adminService.createUser(request);
    }

    @GetMapping("/users")
    @ResponseStatus(HttpStatus.OK)
    public List<UserSummaryResponse> getAllUsers() {
        return adminService.getAllUsers();
    }

    @GetMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.OK)
    public UserSummaryResponse getUser(
            @PathVariable String userId
    ) {
        return adminService.getUser(userId);
    }

    @PatchMapping("/users/{userId}/activate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void activateUserAccount(
            @PathVariable String userId
    ) {
        adminService.activeUserAccount(userId);
    }

    @PatchMapping("/users/{userId}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateUserAccount(
            @PathVariable String userId
    ) {
        adminService.deactivateUserAccount(userId);
    }

    @DeleteMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUserAccount(
            @PathVariable String userId
    ) {
        adminService.deleteUserAccount(userId);
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/admin/AdminController.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/admin/AdminService.java

package gov.cmr.minfi.db.gbe.app.admin;

import gov.cmr.minfi.db.gbe.app.admin.dto.CreateUserRequest;
import gov.cmr.minfi.db.gbe.app.admin.dto.UserSummaryResponse;

import java.util.List;

public interface AdminService {
UserSummaryResponse createUser(CreateUserRequest request);

    UserSummaryResponse getUser(String userId);

    List<UserSummaryResponse> getAllUsers();

    void activeUserAccount(String userId);

    void deactivateUserAccount(String userId);

    void deleteUserAccount(String userId);

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/admin/AdminService.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/admin/dto/AffectationSummary.java

package gov.cmr.minfi.db.gbe.app.admin.dto;

import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import lombok.Builder;

@Builder
public record AffectationSummary(
String affectationId,
RoleSysteme roleSysteme,
String sectionId,
String sectionLibelle,
String programmeId,
String programmeLibelle,
boolean actif
) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/admin/dto/AffectationSummary.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/admin/dto/CreateUserRequest.java

package gov.cmr.minfi.db.gbe.app.admin.dto;

import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public record CreateUserRequest(

        @NotBlank(message = "VALIDATION.USER.FIRSTNAME.NOT_BLANK")
        @Size(min = 1, max = 50, message = "VALIDATION.USER.FIRSTNAME.SIZE")
        @Schema(example = "Mbarga")
        String firstName,

        @NotBlank(message = "VALIDATION.USER.LASTNAME.NOT_BLANK")
        @Size(min = 1, max = 50, message = "VALIDATION.USER.LASTNAME.SIZE")
        @Schema(example = "Paul")
        String lastName,

        @NotBlank(message = "VALIDATION.USER.MATRICULE.NOT_BLANK")
        @Size(min = 9, max = 9, message = "VALIDATION.USER.MATRICULE.SIZE")
        @Schema(example = "1000000A")
        String matricule,

        @NotBlank(message = "VALIDATION.USER.EMAIL.NOT_BLANK")
        @Email(message = "VALIDATION.USER.EMAIL.FORMAT")
        @Schema(example = "monemail@gest.cm")
        String email,

        @Pattern(
                regexp = "^\\+?[0-9]{9,13}",
                message = "VALIDATION.USER.PHONE_NUMBER.FORMAT"
        )
        @Schema(example = "+2376555555")
        String phoneNumber,

        @NotBlank(message = "VALIDATION.USER.CNI_NUMBER.NOT_BLANK")
        String numeroCni,

        @NotBlank(message = "VALIDATION.USER.NUI.NOT_BLANK")
        String nui,

        @NotNull(message = "VALIDATION.USER.CNI.ISSUE.DATE.NOT_NULL")
        LocalDate cniIssueDate,

        @NotNull(message = "VALIDATION.USER.CNI.EXPIRY.DATE.NOT_NULL")
        LocalDate cniExpiryDate,

        @NotNull(message = "VALIDATION.USER.ROLE.NOT_NULL")
        RoleSysteme roleSysteme,

        @NotBlank(message = "VALIDATION.USER.SECTION.NOT_BLANK")
        @Schema(example = "uuid-de-la-section")
        String sectionId,

        @NotEmpty(message = "VALIDATION.USER.PROGRAMMES.NOT_EMPTY")
        @Schema(description = "Liste des IDs de programmes")
        List<String> programmeIds,

        @NotBlank(message = "VALIDATION.USER.PASSWORD.NOT_BLANK")
        @Size(min = 8, max = 72, message = "VALIDATION.USER.PASSWORD.SIZE")
        @Pattern(
                regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*\\W).*$",
                message = "VALIDATION.USER.PASSWORD.WEAK"
        )
        @Schema(example = "Temp@1234")
        String password

) {
}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/admin/dto/CreateUserRequest.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/admin/dto/UserSummaryResponse.java

package gov.cmr.minfi.db.gbe.app.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserSummaryResponse(
String id,
String firstName,
String lastName,
String phoneNumber,
boolean enabled,
boolean firstLogin,
String email,
boolean mfaEnabled,
LocalDate createdDate,
List<AffectationSummary> affectations

) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/admin/dto/UserSummaryResponse.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/admin/impl/AdminServiceImpl.java

package gov.cmr.minfi.db.gbe.app.admin.impl;

import gov.cmr.minfi.db.gbe.app.admin.AdminService;
import gov.cmr.minfi.db.gbe.app.admin.dto.AffectationSummary;
import gov.cmr.minfi.db.gbe.app.admin.dto.CreateUserRequest;
import gov.cmr.minfi.db.gbe.app.admin.dto.UserSummaryResponse;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectation;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectationRepository;
import gov.cmr.minfi.db.gbe.app.auth.tfa.TwoFactorAuthenticationService;
import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.SectionRepository;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Programme;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.ProgrammeRepository;
import gov.cmr.minfi.db.gbe.app.user.User;
import gov.cmr.minfi.db.gbe.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class AdminServiceImpl implements AdminService {
private final UserRepository userRepository;
private final SectionRepository sectionRepository;
private final TwoFactorAuthenticationService tfaService;
private final PasswordEncoder passwordEncoder;
private final ProgrammeRepository programmeRepository;
private final UserAffectationRepository userAffectationRepository;

    @Override
    @Transactional
    public UserSummaryResponse createUser(CreateUserRequest request) {
        // verifier l'existence de l'utilisateur en bd
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        if (userRepository.existsByPhoneNumberIgnoreCase(request.phoneNumber())) {
            throw new BusinessException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
        }

        if (userRepository.existsByNuiIgnoreCase(request.nui())) {
            throw new BusinessException(ErrorCode.NUI_ALREADY_EXISTS);
        }

        if (userRepository.existsByNumeroCniIgnoreCase(request.numeroCni())) {
            throw new BusinessException(ErrorCode.CNI_ALREADY_EXISTS);
        }

        if (userRepository.existsByMatriculeIgnoreCase(request.matricule())) {
            throw new BusinessException(ErrorCode.MATRICULE_ALREADY_EXISTS);
        }

        // recuperation de la section
        final Section section = sectionRepository.findById(request.sectionId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, request.sectionId()));

        // creation de l'utilisateur
        final User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .phoneNumber(request.phoneNumber())
                .password(passwordEncoder.encode(request.password()))
                .matricule(request.matricule())
                .nui(request.nui())
                .numeroCni(request.numeroCni())
                .cniIssueDate(request.cniIssueDate())
                .cniExpiryDate(request.cniExpiryDate())
                .enabled(true)
                .locked(false)
                .credentialsExpired(false)
                .emailVerified(false)
                .phoneVerified(false)
                .firstLogin(true)
                .secret(tfaService.generateNewSecret())
                .build();

        userRepository.save(user);
        log.info("Created user {}", user.getEmail());

        // creation des affectation
        final List<UserAffectation> affectations = request.programmeIds().stream()
                .map(programmeId -> {
                    final Programme programme = programmeRepository.findById(programmeId)
                            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "programmeId" + programmeId));

                    final UserAffectation affectation = UserAffectation.builder()
                            .user(user)
                            .section(section)
                            .programme(programme)
                            .roleSysteme(request.roleSysteme())
                            .actif(true)
                            .build();

                    affectation.initialiserPermissionsDepuisRole();
                    return affectation;
                })
                .toList();

        userAffectationRepository.saveAll(affectations);
        log.info("{} affectation(s) crée(s) pour {}", affectations.size(), user.getEmail());


        return toResponse(user, affectations);
    }

    @Override
    public UserSummaryResponse getUser(String userId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "user:" + userId));

        // charger les affectations de l'utilisateur
        final List<UserAffectation> affectations = userAffectationRepository.findByUserId(userId);
        return toResponse(user, affectations);
    }

    @Override
    public List<UserSummaryResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> {
                    final List<UserAffectation> affectations =
                            userAffectationRepository.findByUserId(user.getId());
                    return toResponse(user, affectations);
                }).toList();

    }

    @Override
    @Transactional
    public void activeUserAccount(String userId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));

        if (user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_ACTIVATED);
        }

        user.setEnabled(true);
        userRepository.save(user);

    }

    @Override
    @Transactional
    public void deactivateUserAccount(String userId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));

        if (!user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_DEACTIVATED);
        }

        user.setEnabled(false);
        userRepository.save(user);

    }

    @Override
    public void deleteUserAccount(String userId) {
        final User utilisateur = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));

        userAffectationRepository.deleteAll(userAffectationRepository.findByUserId(userId));

        userRepository.delete(utilisateur);
        log.debug("Utilisateur supprimé : {}", utilisateur.getEmail());

    }

    private UserSummaryResponse toResponse(User user, List<UserAffectation> affectations) {
        final List<AffectationSummary> affectationSummaries = affectations.stream()
                .map(affectation -> AffectationSummary.builder()
                        .affectationId(affectation.getId())
                        .roleSysteme(affectation.getRoleSysteme())
                        .sectionId(affectation.getSection().getId())
                        .sectionLibelle(affectation.getSection().getLibelleFr())
                        .programmeId(affectation.getProgramme() != null ? affectation.getProgramme().getId() : null)
                        .programmeLibelle(affectation.getProgramme() != null ? affectation.getProgramme().getLibelleFr() : null)
                        .actif(affectation.isActif())
                        .build()
                ).toList();

        return UserSummaryResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .enabled(user.isEnabled())
                .firstLogin(user.isFirstLogin())
                .mfaEnabled(user.isMfaEnabled())
                .createdDate(user.getCreatedDate())
                .affectations(affectationSummaries)
                .build();
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/admin/impl/AdminServiceImpl.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/affectation/AffectationController.java

package gov.cmr.minfi.db.gbe.app.affectation;

import gov.cmr.minfi.db.gbe.app.admin.dto.AffectationSummary;
import gov.cmr.minfi.db.gbe.app.affectation.dto.AffectationRequest;
import gov.cmr.minfi.db.gbe.app.affectation.dto.UpdateRoleRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users/{userId}/affectations")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_AFFECTATIONS')")
@Tag(name = "Affectations", description = "Gestion des affectations utilisateur")
public class AffectationController {

    private final AffectationService affectationService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AffectationSummary addAffectation(
            @PathVariable String userId,
            @Valid @RequestBody AffectationRequest request
    ) {
        return affectationService.addAffectation(userId, request);
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<AffectationSummary> getAffectations(
            @PathVariable String userId
    ) {
        return affectationService.getAffectations(userId);
    }

    @PatchMapping("/{affectationId}/role")
    @ResponseStatus(HttpStatus.OK)
    public AffectationSummary updateRole(
            @PathVariable String userId,
            @PathVariable String affectationId,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        return affectationService.updateRole(userId, affectationId, request.roleSysteme());
    }

    @PatchMapping("/{affectationId}/activate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void activateAffectation(
            @PathVariable String userId,
            @PathVariable String affectationId
    ) {
        affectationService.activateAffectation(userId, affectationId);
    }

    @PatchMapping("/{affectationId}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateAffectation(
            @PathVariable String userId,
            @PathVariable String affectationId
    ) {
        affectationService.deactivateAffectation(userId, affectationId);
    }

    @DeleteMapping("/{affectationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAffectation(
            @PathVariable String userId,
            @PathVariable String affectationId
    ) {
        affectationService.removeAffectation(userId, affectationId);
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/affectation/AffectationController.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/affectation/AffectationService.java

package gov.cmr.minfi.db.gbe.app.affectation;

import gov.cmr.minfi.db.gbe.app.admin.dto.AffectationSummary;
import gov.cmr.minfi.db.gbe.app.affectation.dto.AffectationRequest;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;

import java.util.List;

public interface AffectationService {
AffectationSummary addAffectation(String userId, AffectationRequest request);

    List<AffectationSummary> getAffectations(String userId);

    AffectationSummary updateRole(String userId, String affectationId, RoleSysteme roleSysteme);

    void activateAffectation(String userId, String affectationId);

    void deactivateAffectation(String userId, String affectationId);

    void removeAffectation(String userId, String affectationsId);

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/affectation/AffectationService.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/affectation/dto/AffectationRequest.java

package gov.cmr.minfi.db.gbe.app.affectation.dto;

import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AffectationRequest(
@NotBlank(message = "VALIDATION.AFFECTATION.PROGRAMME.NOT_BLANK")
@Schema(example = "uuid-du-programme")
String programmeId,

        @NotNull(message = "VALIDATION.AFFECTATION.ROLE.NOT_NULL")
        RoleSysteme roleSysteme

) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/affectation/dto/AffectationRequest.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/affectation/dto/UpdateRoleRequest.java

package gov.cmr.minfi.db.gbe.app.affectation.dto;

import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
@NotNull(message = "VALIDATION.AFFECTATION.ROLE.NOT_NULL")
RoleSysteme roleSysteme
) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/affectation/dto/UpdateRoleRequest.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/affectation/impl/AffectationServiceImpl.java

package gov.cmr.minfi.db.gbe.app.affectation.impl;

import gov.cmr.minfi.db.gbe.app.admin.dto.AffectationSummary;
import gov.cmr.minfi.db.gbe.app.affectation.AffectationService;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectation;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectationRepository;
import gov.cmr.minfi.db.gbe.app.affectation.dto.AffectationRequest;
import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Programme;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.ProgrammeRepository;
import gov.cmr.minfi.db.gbe.app.user.User;
import gov.cmr.minfi.db.gbe.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AffectationServiceImpl implements AffectationService {
private final UserRepository userRepository;
private final UserAffectationRepository userAffectationRepository;
private final ProgrammeRepository programmeRepository;

    @Override
    @Transactional
    public AffectationSummary addAffectation(String userId, AffectationRequest request) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));

        // verifier que l'affectation n'existe pas déjà
        if (userAffectationRepository.existsByUserIdAndProgrammeId(userId, request.programmeId())) {
            throw new BusinessException(ErrorCode.AFFECTATION_ALREADY_EXISTS);
        }

        // recuperer le programme
        final Programme programme = programmeRepository.findById(request.programmeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, request.programmeId()));

        // recuperer la section depuis les affectaion existantes de l'utilisateur
        final Section section = userAffectationRepository.findByUserId(userId)
                .stream()
                .findFirst()
                .map(UserAffectation::getSection)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "section introuvable pour cet utilisateur"));

        // creer la nouvelle affectation
        final UserAffectation affectation = UserAffectation.builder()
                .user(user)
                .section(section)
                .programme(programme)
                .roleSysteme(request.roleSysteme())
                .actif(true)
                .build();

        affectation.initialiserPermissionsDepuisRole();
        userAffectationRepository.save(affectation);
        log.info("Affectation ajoutée : user={} programme = {}", userId, request.programmeId());

        return toSummary(affectation);
    }

    @Override
    public List<AffectationSummary> getAffectations(String userId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));
        return userAffectationRepository.findByUserId(userId)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Override
    @Transactional
    public AffectationSummary updateRole(String userId, String affectationId, RoleSysteme roleSysteme) {
        final UserAffectation affectation = findAffectation(userId, affectationId);

        affectation.setRoleSysteme(roleSysteme);
        affectation.initialiserPermissionsDepuisRole();
        userAffectationRepository.save(affectation);

        log.info("Role modifié : affectation={} nouveauRole={}", affectationId, roleSysteme);

        return toSummary(affectation);
    }

    @Override
    @Transactional
    public void activateAffectation(String userId, String affectationId) {
        final UserAffectation affectation = findAffectation(userId, affectationId);

        if (affectation.isActif()) {
            throw new BusinessException(ErrorCode.AFFECTATION_ALREADY_ACTIVE);
        }

        affectation.setActif(true);
        userAffectationRepository.save(affectation);
        log.info("Affectation activée : {}", affectationId);
    }

    @Override
    public void deactivateAffectation(String userId, String affectationId) {
        final UserAffectation affectation = findAffectation(userId, affectationId);

        if (!affectation.isActif()) {
            throw new BusinessException(ErrorCode.AFFECTATION_ALREADY_INACTIVE);
        }

        affectation.setActif(false);
        userAffectationRepository.save(affectation);
        log.info("Affectation désactivée : {}", affectationId);
    }

    @Override
    @Transactional
    public void removeAffectation(String userId, String affectationId) {
        final UserAffectation affectation = findAffectation(userId, affectationId);
        userAffectationRepository.delete(affectation);
        log.info("Affectation supprimée : {}", affectationId);

    }

    private UserAffectation findAffectation(String userId, String affectationId) {
        final UserAffectation affectation = userAffectationRepository.findById(affectationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, affectationId));

        // verifier que l'affectation appartien bien à l'utilisateur

        if (!affectation.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.AFFECTATION_NOT_FOUND, userId);
        }

        return affectation;
    }

    private AffectationSummary toSummary(UserAffectation affectation) {
        return AffectationSummary.builder()
                .affectationId(affectation.getId())
                .roleSysteme(affectation.getRoleSysteme())
                .sectionId(affectation.getSection().getId())
                .sectionLibelle(affectation.getSection().getLibelleFr())
                .programmeId(affectation.getProgramme() != null ? affectation.getProgramme().getId() : null)
                .programmeLibelle(affectation.getProgramme() != null ? affectation.getProgramme().getLibelleFr() : null)
                .actif(affectation.isActif())
                .build();
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/affectation/impl/AffectationServiceImpl.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/affectation/UserAffectation.java

package gov.cmr.minfi.db.gbe.app.affectation;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.iam.permission.Permission;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Programme;
import gov.cmr.minfi.db.gbe.app.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(
name = "USER_AFFECTATIONS",
uniqueConstraints = @UniqueConstraint(
name = "uk_affectation_user_programme",
columnNames = {"USER_ID", "PROGRAMME_ID"}
)
)
public class UserAffectation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SECTION_ID", nullable = false)
    private Section section;

    // Nullable — un admin peut être affecté à toute une section
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROGRAMME_ID")
    private Programme programme;

    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE_SYSTEME", nullable = false)
    private RoleSysteme roleSysteme;

    // Permissions effectives sur ce programme
    // Peuvent être surchargées par l'admin
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "AFFECTATION_PERMISSIONS",
            joinColumns = @JoinColumn(name = "AFFECTATION_ID")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "PERMISSION")
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    @Column(name = "ACTIF", nullable = false)
    @Builder.Default
    private boolean actif = true;

    // Appelée par AdminService à la création
    public void initialiserPermissionsDepuisRole() {
        this.permissions = new HashSet<>(this.roleSysteme.getDefaultPermissions());
    }

    // Vérifie si cette affectation donne accès à une permission donnée
    public boolean hasPermission(Permission permission) {
        return this.actif && this.permissions.contains(permission);
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/affectation/UserAffectation.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/affectation/UserAffectationRepository.java

package gov.cmr.minfi.db.gbe.app.affectation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAffectationRepository extends JpaRepository<UserAffectation, String> {
List<UserAffectation> findByUserId(String userId);

    List<UserAffectation> findByUserIdAndActifTrue(String userId);

    boolean existsByUserIdAndProgrammeId(String userId, String programmeId);

    void deleteByUserIdAndProgrammeId(String userId, String programmeId);

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/affectation/UserAffectationRepository.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/AuthenticationController.java

package gov.cmr.minfi.db.gbe.app.auth;

import gov.cmr.minfi.db.gbe.app.auth.dto.request.AuthenticationRequest;
import gov.cmr.minfi.db.gbe.app.auth.dto.request.RefreshRequest;
import gov.cmr.minfi.db.gbe.app.auth.dto.request.SetupMfaRequest;
import gov.cmr.minfi.db.gbe.app.auth.dto.request.VerificationRequest;
import gov.cmr.minfi.db.gbe.app.auth.dto.response.AuthenticationResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication API")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse login(
            @Valid @RequestBody AuthenticationRequest request
    ) {
        return authenticationService.login(request);
    }

    @PostMapping("/setup-mfa")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse setupMfa(
            @Valid @RequestBody SetupMfaRequest request
    ) {
        return authenticationService.setupMfa(request);
    }

    @PostMapping("/verify")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse verify(
            @Valid @RequestBody VerificationRequest request
    ) {
        return authenticationService.verifyCode(request);
    }

    @PostMapping("/refresh")
    @ResponseStatus(HttpStatus.OK)
    public AuthenticationResponse refresh(
            @Valid @RequestBody RefreshRequest request
    ) {
        return authenticationService.refreshToken(request);
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/AuthenticationController.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/AuthenticationService.java

package gov.cmr.minfi.db.gbe.app.auth;

import gov.cmr.minfi.db.gbe.app.auth.dto.request.*;
import gov.cmr.minfi.db.gbe.app.auth.dto.response.AuthenticationResponse;

public interface AuthenticationService {
AuthenticationResponse verifyCode(VerificationRequest verificationRequest);

    AuthenticationResponse login(AuthenticationRequest request);

    AuthenticationResponse setupMfa(SetupMfaRequest request);

    AuthenticationResponse register(RegistrationRequest request);

    AuthenticationResponse refreshToken(RefreshRequest request);

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/AuthenticationService.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/request/AuthenticationRequest.java

package gov.cmr.minfi.db.gbe.app.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthenticationRequest(
@NotBlank(message = "VALIDATION.AUTHENTICATION.EMAIL.NOT_BLANK")
@Email(message = "VALIDATION.AUTHENTICATION.EMAIL.FORMAT")
@Schema(example = "ordor@gmail.com")
String email,
@NotBlank(message = "VALIDATION.AUTHENTICATION.PASSWORD.NOT_BLANK")
@Schema(example = "<PASSWORD>")
String password

) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/request/AuthenticationRequest.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/request/RefreshRequest.java

package gov.cmr.minfi.db.gbe.app.auth.dto.request;

public record RefreshRequest(String refreshToken) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/request/RefreshRequest.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/request/RegistrationRequest.java

package gov.cmr.minfi.db.gbe.app.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(
@NotBlank(message = "VALIDATION.REGISTRATION.FIRSTNAME.NOT_BLANK")
@Size(
min = 1,
max = 50,
message = "VALIDATION.REGISTRATION.FIRSTNAME.SIZE"
)
@Schema(example = "Ali")
String firstName,
@NotBlank(message = "VALIDATION.REGISTRATION.LASTNAME.NOT_BLANK")
@Size(
min = 1,
max = 50,
message = "VALIDATION.REGISTRATION.LASTNAME.SIZE"
)
@Schema(example = "Ali")
String lastName,
@NotBlank(message = "VALIDATION.REGISTRATION.EMAIL.NOT_BLANK")
@Email(message = "VALIDATION.REGISTRATION.EMAIL.FORMAT")
// @NonDisposableEmail(message = "VALIDATION.REGISTRATION.EMAIL.DISPOSABLE")
@Schema(example = "email@example.test")
String email,
@NotBlank(message = "VALIDATION.REGISTRATION.PASSWORD.NOT_BLANK")
@Size(
min = 8,
max = 72,
message = "VALIDATION.REGISTRATION.PASSWORD.SIZE"
)
@Pattern(
regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*\\W).*$",
message = " VALIDATION.REGISTRATION.CONFIRM_PASSWORD.WEAK"
)
@Schema(example = "P@ssw0rd")
String password,
@Pattern(
regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*\\W).*$",
message = " VALIDATION.REGISTRATION.CONFIRM_PASSWORD.WEAK"
)
@Schema(example = "minfi@email.com")
String confirmPassword,
@Pattern(
regexp = "^\\+?[0-9]{9,13}",
message = " VALIDATION.REGISTRATION.PHONE.FORMAT"
)
@Schema(example = "+237655555555")
String phoneNumber,
String dateOfBirth,
boolean mfaEnabled

) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/request/RegistrationRequest.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/request/SetupMfaRequest.java

package gov.cmr.minfi.db.gbe.app.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record SetupMfaRequest(
@NotBlank(message = "VALIDATION.SETUP_MFA.EMAIL.NOT_BLANK")
@Email(message = "VALIDATION.SETUP_MFA.EMAIL.FORMAT")
@Schema(example = "mon.nom@email.cm")
String email,

        @NotBlank(message = "VALIDATION.SETUP_MFA.CODE.NOT_BLANK")
        @Size(min = 6, max = 6, message = "VALIDATION.SETUP_MFA.CODE.SIZE")
        @Schema(example = "123456")
        String code

) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/request/SetupMfaRequest.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/request/VerificationRequest.java

package gov.cmr.minfi.db.gbe.app.auth.dto.request;

import lombok.Builder;

@Builder
public record VerificationRequest(String email, String code) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/request/VerificationRequest.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/response/AffectationContext.java

package gov.cmr.minfi.db.gbe.app.auth.dto.response;

import gov.cmr.minfi.db.gbe.app.iam.permission.Permission;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import lombok.Builder;

import java.util.Set;

@Builder
public record AffectationContext(
String affectationId,
RoleSysteme roleSysteme,
String sectionId,
String sectionLibelle,
String sectionCode,
String programmeId,
String programmeLibelle,
String programmeCode,
Set<Permission> permissions,
boolean actif
) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/response/AffectationContext.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/response/AuthenticationResponse.java

package gov.cmr.minfi.db.gbe.app.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record AuthenticationResponse(
String accessToken,
String refreshToken,
String tokenType,

        boolean mfaEnabled,
        boolean firstLogin,

        String secretImageUri,

        UserContext userContext

) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/response/AuthenticationResponse.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/response/UserContext.java

package gov.cmr.minfi.db.gbe.app.auth.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record UserContext(
String userId,
String firstName,
String lastName,
String email,
String matricule,
String nui,
String cni,
List<AffectationContext> affectations
) {

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/dto/response/UserContext.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/impl/AuthenticationServiceImpl.java

package gov.cmr.minfi.db.gbe.app.auth.impl;

import gov.cmr.minfi.db.gbe.app.affectation.UserAffectation;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectationRepository;
import gov.cmr.minfi.db.gbe.app.auth.AuthenticationService;
import gov.cmr.minfi.db.gbe.app.auth.dto.request.*;
import gov.cmr.minfi.db.gbe.app.auth.dto.response.AffectationContext;
import gov.cmr.minfi.db.gbe.app.auth.dto.response.AuthenticationResponse;
import gov.cmr.minfi.db.gbe.app.auth.dto.response.UserContext;
import gov.cmr.minfi.db.gbe.app.auth.tfa.TwoFactorAuthenticationService;
import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.security.JwtService;
import gov.cmr.minfi.db.gbe.app.user.User;
import gov.cmr.minfi.db.gbe.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
@Slf4j
@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final TwoFactorAuthenticationService tfaService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final UserAffectationRepository userAffectationRepository;


    @Override
    public AuthenticationResponse login(AuthenticationRequest request) {
        final Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        final User user = (User) auth.getPrincipal();
        if (user == null) {
            throw new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "user not found" + request.email());
        }

        // retourner le QR code si premiere connexion
        if (user.isFirstLogin()) {
            final String secretImageUri = tfaService.generateQrCodeImageUri(
                    user.getSecret());

            return AuthenticationResponse.builder()
                    .firstLogin(true)
                    .mfaEnabled(false)
                    .secretImageUri(secretImageUri)
                    .build();
        }

        // connexion suivantes  - code requis
        return AuthenticationResponse.builder()
                .firstLogin(false)
                .mfaEnabled(true)
                .build();
    }


    @Override
    public AuthenticationResponse verifyCode(VerificationRequest request) {
        final User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, request.email()));

        if (tfaService.isNonOtpValid(user.getSecret(), request.code())) {
            throw new BusinessException(ErrorCode.BAD_CREDENTIALS);
        }
        return buildResponse(user);
    }

    @Override
    @Transactional
    public AuthenticationResponse setupMfa(SetupMfaRequest request) {
        final User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, request.email()));

        // verifier si c'est la premiere connexion
        if (!user.isFirstLogin()) {
            throw new BusinessException(ErrorCode.MFA_ALREADY_CONFIRMED);
        }

        // Valider le code saisi après le code
        if (tfaService.isNonOtpValid(user.getSecret(), request.code())) {
            throw new BusinessException(ErrorCode.BAD_CREDENTIALS);
        }

        // Activer le 2FA et marquer la première connexion
        user.setMfaEnabled(true);
        user.setFirstLogin(false);
        userRepository.save(user);
        log.info("MFA activated for use {}", user.getEmail());
        return buildResponse(user);
    }

    @Override
    public AuthenticationResponse register(RegistrationRequest request) {
        return null;
    }

    @Override
    public AuthenticationResponse refreshToken(RefreshRequest request) {
        final String newSecretToken = jwtService.refreshAccessToken(request.refreshToken());


        return AuthenticationResponse.builder()
                .accessToken(newSecretToken)
                .refreshToken(request.refreshToken())
                .tokenType("Bearer")
                .build();

    }

    private AuthenticationResponse buildResponse(User user) {
        final List<UserAffectation> affectations = userAffectationRepository.findByUserIdAndActifTrue(user.getId());

        return AuthenticationResponse.builder()
                .accessToken(jwtService.generateAccessToken(user.getUsername()))
                .refreshToken(jwtService.generateRefreshToken(user.getUsername()))
                .tokenType("Bearer")
                .firstLogin(false)
                .mfaEnabled(true)
                .userContext(buildUserContext(user, affectations))
                .build();
    }

    private UserContext buildUserContext(User user, List<UserAffectation> affectations) {
        final List<AffectationContext> affectationsContext = affectations.stream()
                .map(affectation -> AffectationContext.builder()
                        .affectationId(affectation.getId())
                        .roleSysteme(affectation.getRoleSysteme())
                        .sectionId(affectation.getSection().getId())
                        .sectionLibelle(affectation.getSection().getLibelleFr())
                        .sectionCode(affectation.getSection().getCodeSection())
                        .programmeId(affectation.getProgramme() != null ? affectation.getProgramme().getId() : null)
                        .programmeLibelle(affectation.getProgramme() != null ? affectation.getProgramme().getLibelleFr() : null)
                        .programmeCode(affectation.getProgramme() != null ? affectation.getProgramme().getCode() : null)
                        .permissions(affectation.getPermissions())
                        .actif(affectation.isActif())
                        .build()
                ).toList();
        return UserContext.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .affectations(affectationsContext)
                .build();
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/impl/AuthenticationServiceImpl.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/impl/AuthenticationServiceV1Impl.java

//package gov.cmr.minfi.db.gbe.app.auth.impl;
//
//import gov.cmr.minfi.db.gbe.app.auth.AuthenticationService;
//import gov.cmr.minfi.db.gbe.app.auth.dto.request.AuthenticationRequest;
//import gov.cmr.minfi.db.gbe.app.auth.dto.request.RefreshRequest;
//import gov.cmr.minfi.db.gbe.app.auth.dto.request.RegistrationRequest;
//import gov.cmr.minfi.db.gbe.app.auth.dto.request.VerificationRequest;
//import gov.cmr.minfi.db.gbe.app.auth.dto.response.AuthenticationResponse;
//import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
//import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
//import gov.cmr.minfi.db.gbe.app.iam.role.Role;
//import gov.cmr.minfi.db.gbe.app.iam.role.RoleRepository;
//import gov.cmr.minfi.db.gbe.app.security.JwtService;
//import gov.cmr.minfi.db.gbe.app.auth.tfa.TwoFactorAuthenticationService;
//import gov.cmr.minfi.db.gbe.app.user.User;
//import gov.cmr.minfi.db.gbe.app.user.UserMapper;
//import gov.cmr.minfi.db.gbe.app.user.UserRepository;
//import jakarta.persistence.EntityNotFoundException;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.ArrayList;
//import java.util.List;
//
//@Service
//@Slf4j
//@RequiredArgsConstructor
//public class AuthenticationServiceV1Impl implements AuthenticationService {
// private final AuthenticationManager authenticationManager;
// private final PasswordEncoder passwordEncoder;
// private final JwtService jwtService;
// private final UserRepository userRepository;
// private final RoleRepository roleRepository;
// private final UserMapper userMapper;
// private final TwoFactorAuthenticationService tfaService;
//
//
// @Override
// public AuthenticationResponse login(AuthenticationRequest request) {
// final Authentication auth = authenticationManager.authenticate(
// new UsernamePasswordAuthenticationToken(
// request.email(),
// request.password()
//                )
//        );
//
// final User user = (User) auth.getPrincipal();
// if (user == null) {
// throw new EntityNotFoundException("User not found");
// }
//
// // Cas du 2FA ACTIF
// if (user.isMfaEnabled()) {
// return AuthenticationResponse.builder()
// .mfaEnabled(true)
// .build();
// }
// final String accessToken = this.jwtService.generateAccessToken(user.getUsername());
// final String refreshToken = this.jwtService.generateRefreshToken(user.getUsername());
// final String tokenType = "Bearer";
//
// return AuthenticationResponse.builder()
// .accessToken(accessToken)
// .refreshToken(refreshToken)
// .tokenType(tokenType)
// .mfaEnabled(false)
// .build();
// }
//
// @Override
// @Transactional
// public AuthenticationResponse register(RegistrationRequest request) {
// checkValidity(request);
//
// final Role userRole = this.roleRepository.findByName("ROLE_USER")
// .orElseThrow(() -> new EntityNotFoundException("Role user does not exists"));
//
// final List<Role> roles = new ArrayList<>();
// roles.add(userRole);
// final User user = this.userMapper.toUser(request);
// user.setPassword(passwordEncoder.encode(request.password()));
// user.setRoles(roles);
//
// log.debug("Saving user {}", user);
//
// // Gestion du cas 2FA actif, generer le secret
// if (request.mfaEnabled()) {
// String secret = tfaService.generateNewSecret();
// user.setSecret(secret);
// user.setMfaEnabled(true);
// }
//
// this.userRepository.save(user);
//
// if (request.mfaEnabled()) {
// String secret = user.getSecret();
// String secretImageUri = tfaService.generateQrCodeImageUri(secret);
//
// return AuthenticationResponse.builder()
// .mfaEnabled(true)
// .secretImageUri(secretImageUri)
// .build();
// }
//
// // Cas du 2FA INACTIF
// String accessToken = jwtService.generateAccessToken(user.getUsername());
// String refreshToken = jwtService.generateRefreshToken(user.getUsername());
//
// return AuthenticationResponse.builder()
// .accessToken(accessToken)
// .refreshToken(refreshToken)
// .tokenType("Bearer")
// .mfaEnabled(false)
// .build();
// }
//
//
// @Override
// public AuthenticationResponse refreshToken(RefreshRequest request) {
// final String newAccesToken = this.jwtService.refreshAccessToken(request.refreshToken());
// final String tokenType = "Bearer";
//
// return AuthenticationResponse.builder()
// .accessToken(newAccesToken)
// .refreshToken(request.refreshToken())
// .tokenType(tokenType)
// .build();
//
// }
//
// @Override
// public AuthenticationResponse verifyCode(VerificationRequest request) {
// User user = this.userRepository.findByEmailIgnoreCase(request.email())
// .orElseThrow(() -> new EntityNotFoundException("User not found"));
// if (tfaService.isNonOtpValid(user.getSecret(), request.code())) {
// throw new BusinessException(ErrorCode.BAD_CREDENTIALS, "Code is not correct");
// }
// String accessToken = this.jwtService.generateAccessToken(user.getUsername());
// String refreshToken = this.jwtService.generateRefreshToken(user.getUsername());
// return AuthenticationResponse.builder()
// .accessToken(accessToken)
// .refreshToken(refreshToken)
// .tokenType("Bearer")
// .mfaEnabled(user.isMfaEnabled())
// .build();
// }
//
//
// private void checkPasswords(String password, String confirmPassword) {
// if (password == null || !confirmPassword.equals(password)) {
// throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
// }
// }
//
// private void checkUserPhoneNumber(String phoneNumber) {
// final boolean phoneNumberExists = this.userRepository.existsByPhoneNumberIgnoreCase(phoneNumber);
// if (phoneNumberExists) {
// throw new BusinessException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
// }
// }
//
// private void checkUserEmail(String email) {
// final boolean emailExists = this.userRepository.existsByEmailIgnoreCase(email);
// if (emailExists) {
// throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
// }
// }
//
// private void checkValidity(RegistrationRequest request) {
// checkUserEmail(request.email());
// checkUserPhoneNumber(request.phoneNumber());
// checkPasswords(request.password(), request.confirmPassword());
// }
//}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/impl/AuthenticationServiceV1Impl.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/auth/tfa/TwoFactorAuthenticationService.java

package gov.cmr.minfi.db.gbe.app.auth.tfa;

import dev.samstevens.totp.code.*;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import static dev.samstevens.totp.util.Utils.getDataUriForImage;

@Service
@Slf4j
public class TwoFactorAuthenticationService {

    public String generateNewSecret() {
        return new DefaultSecretGenerator().generate();
    }

    public String generateQrCodeImageUri(String secret) {
        QrData data = new QrData.Builder()
                .label("GBE-MINFI")
                .secret(secret)
                .issuer("GBE-MINFI")
                .algorithm(HashingAlgorithm.SHA256)
                .digits(6)
                .period(30)
                .build();

        QrGenerator generator = new ZxingPngQrGenerator();
        byte[] imageData = new byte[0];
        try {
            imageData = generator.generate(data);
        } catch (QrGenerationException e) {
            e.printStackTrace();
            log.error("Error generating QR code image");
        }

        return getDataUriForImage(imageData, generator.getImageMimeType());


    }

    public boolean isOtpValid(String secret, String code) {
        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator();
        CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        return verifier.isValidCode(secret, code);
    }

    public boolean isNonOtpValid(String secret, String code) {
        return !isOtpValid(secret, code);
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/auth/tfa/TwoFactorAuthenticationService.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/common/audit/ApplicatorAuditoreAware.java

package gov.cmr.minfi.db.gbe.app.common.audit;

import gov.cmr.minfi.db.gbe.app.user.User;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public class ApplicatorAuditoreAware implements AuditorAware<String> {
@Override
public Optional<String> getCurrentAuditor() {
final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {
            return Optional.of("SYSTEM");
        }
        final User user = (User) authentication.getPrincipal();
        //assert user != null;
        return Optional.ofNullable(user.getId());
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/common/audit/ApplicatorAuditoreAware.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/common/audit/BaseEntity.java

package gov.cmr.minfi.db.gbe.app.common.audit;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@EntityListeners(AuditingEntityListener.class)
public class BaseEntity {
@Id
@GeneratedValue(strategy = GenerationType.UUID)
private String id;

    @CreatedDate
    @Column(name = "CREATED_DATE", updatable = false, nullable = false)
    private LocalDate createdDate;

    @LastModifiedDate
    @Column(name = "LAST_MODIFIED_DATE", insertable = false)
    private LocalDateTime lastModifiedAt;

    @CreatedBy
    @Column(name = "CREATED_BY", nullable = false, updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "LAST_MIDIFIED_BY", insertable = false)
    private String lastModifiedBy;

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/common/audit/BaseEntity.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/common/config/BeansConfig.java

package gov.cmr.minfi.db.gbe.app.common.config;

import gov.cmr.minfi.db.gbe.app.common.audit.ApplicatorAuditoreAware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class BeansConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(final AuthenticationConfiguration config) {
        return config.getAuthenticationManager();
    }


    @Bean
    public CorsFilter corsFilter() {
        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        final CorsConfiguration config = new CorsConfiguration();

        // 1. Autoriser les origines spécifiques (Frontend, Swagger, etc.)
        config.setAllowedOrigins(List.of("http://localhost:3000", "https://minfi-application-de-genstion-du-bu.vercel.app/"));

        // 2. Autoriser les headers
        config.setAllowedHeaders(Arrays.asList(
                "Origin",
                "Content-Type",
                "Accept",
                "Authorization",
                "Access-Control-Allow-Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers",
                "X-Requested-With"
        ));

        // 3. Exposer les headers (utile pour que le front lise certains headers de réponse)
        config.setExposedHeaders(Arrays.asList(
                "Origin",
                "Content-Type",
                "Accept",
                "Authorization",
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials",
                "Content-Disposition" // Utile pour les téléchargements de fichiers
        ));

        // 4. Autoriser les méthodes HTTP
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));


        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Cache la réponse preflight pendant 1h (3600s)

        // Appliquer cette configuration à toutes les routes
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }

    @Bean
    public AuditorAware<String> auditorAware() {
        return new ApplicatorAuditoreAware();
    }

}

// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/common/config/BeansConfig.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/common/config/DataInitializer.java

package gov.cmr.minfi.db.gbe.app.common.config;

import gov.cmr.minfi.db.gbe.app.affectation.UserAffectation;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectationRepository;
import gov.cmr.minfi.db.gbe.app.auth.tfa.TwoFactorAuthenticationService;
import gov.cmr.minfi.db.gbe.app.exercice.Exercice;
import gov.cmr.minfi.db.gbe.app.exercice.ExerciceRepository;
import gov.cmr.minfi.db.gbe.app.iam.role.Role;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleRepository;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.SectionRepository;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.TypeSection;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Programme;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.ProgrammeRepository;
import gov.cmr.minfi.db.gbe.app.user.User;
import gov.cmr.minfi.db.gbe.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final ProgrammeRepository programmeRepository;
    private final ExerciceRepository exerciceRepository;
    private final UserAffectationRepository affectationRepository;
    private final TwoFactorAuthenticationService tfaService;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile("!prod")
    public CommandLineRunner init() {
        return args -> {

            // ================================================
            // ETAPE 1 — Initialisation des rôles du système
            // ================================================
            for (RoleSysteme roleSysteme : RoleSysteme.values()) {
                final String roleName = "ROLE_" + roleSysteme.name();
                if (roleRepository.findByName(roleName).isEmpty()) {
                    final Role role = new Role();
                    role.setName(roleName);
                    role.setCreatedBy("SYSTEM");
                    roleRepository.save(role);
                    log.info("Role initialisé : {}", roleName);
                }
            }

            // Si les données de test existent déjà on s'arrête ici
            if (userRepository.existsByEmailIgnoreCase("admin@minfi.cm")) {
                log.info("Données de test déjà présentes — initialisation ignorée");
                return;
            }

            // ================================================
            // ETAPE 2 — Exercice budgétaire
            // ================================================
            final Exercice exercice = exerciceRepository.save(
                    Exercice.builder()
                            .annee(2026)
                            .libelleFr("Exercice budgétaire 2026")
                            .libelleEn("Budget exercise 2026")
                            .actif(true)
                            .build()
            );
            log.info("Exercice créé : {}", exercice.getAnnee());

            // ================================================
            // ETAPE 3 — Section
            // ================================================
            final Section section = sectionRepository.save(
                    Section.builder()
                            .codeSection("20")
                            .sigle("MINFI")
                            .libelleFr("Ministère des Finances")
                            .libelleEn("Ministry of Finance")
                            .typeSection(TypeSection.MINISTERE)
                            .exercice(exercice)
                            .build()
            );
            log.info("Section créée : {}", section.getSigle());

            // ================================================
            // ETAPE 4 — Programmes
            // ================================================
            final Programme prog1 = programmeRepository.save(
                    Programme.builder()
                            .section(section)
                            .exercice(exercice)
                            .code("001")
                            .codeMille("60")
                            .libelleFr("Pilotage et coordination")
                            .libelleEn("Steering and coordination")
                            .actif(true)
                            .build()
            );

            final Programme prog2 = programmeRepository.save(
                    Programme.builder()
                            .section(section)
                            .exercice(exercice)
                            .code("002")
                            .codeMille("60")
                            .libelleFr("Mobilisation des ressources")
                            .libelleEn("Resource mobilization")
                            .actif(true)
                            .build()
            );
            log.info("Programmes créés : {}, {}", prog1.getCode(), prog2.getCode());

            // ================================================
            // ETAPE 5 — Utilisateur Admin
            // firstLogin=false car c'est un compte bootstrappé
            // mfaEnabled=true car le 2FA est déjà configuré
            // ================================================
            final Role roleAdmin = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow();

            final User admin = User.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .email("admin@minfi.cm")
                    .phoneNumber("+237600000000")
                    .password(passwordEncoder.encode("Admin@1234"))
                    .numeroCni("123456789")
                    .nui("NUI123456")
                    .cniIssueDate(LocalDate.of(2020, 1, 1))
                    .cniExpiryDate(LocalDate.of(2030, 1, 1))
                    .enabled(true)
                    .locked(false)
                    .credentialsExpired(false)
                    .emailVerified(true)
                    .phoneVerified(true)
                    .firstLogin(false)
                    .mfaEnabled(true)
                    .secret(tfaService.generateNewSecret())
                    .roles(List.of(roleAdmin))
                    .build();

            userRepository.saveAndFlush(admin);
            log.info("Admin créé : {}", admin.getEmail());

            // Affectation admin
            final UserAffectation affectationAdmin = UserAffectation.builder()
                    .user(admin)
                    .section(section)
                    .programme(prog1)
                    .roleSysteme(RoleSysteme.ADMIN)
                    .actif(true)
                    .build();
            affectationAdmin.initialiserPermissionsDepuisRole();
            affectationRepository.save(affectationAdmin);

            // ================================================
            // ETAPE 6 — Utilisateur test
            // firstLogin=true — simule une première connexion
            // mfaEnabled=false — QR code pas encore scanné
            // ================================================
            final Role roleOrdonnateur = roleRepository.findByName("ROLE_ORDONNATEUR_PRINCIPAL")
                    .orElseThrow();

            final User userTest = User.builder()
                    .firstName("Jean")
                    .lastName("Dupont")
                    .email("jean.dupont@minfi.cm")
                    .phoneNumber("+237611111111")
                    .password(passwordEncoder.encode("Test@1234"))
                    .numeroCni("987654321")
                    .nui("NUI654321")
                    .cniIssueDate(LocalDate.of(2021, 6, 1))
                    .cniExpiryDate(LocalDate.of(2031, 6, 1))
                    .enabled(true)
                    .locked(false)
                    .credentialsExpired(false)
                    .emailVerified(false)
                    .phoneVerified(false)
                    .firstLogin(true)
                    .mfaEnabled(false)
                    .secret(tfaService.generateNewSecret())
                    .roles(List.of(roleOrdonnateur))
                    .build();

            userRepository.saveAndFlush(userTest);
            log.info("User test créé : {}", userTest.getEmail());

            // Affectation user test
            final UserAffectation affectationTest = UserAffectation.builder()
                    .user(userTest)
                    .section(section)
                    .programme(prog2)
                    .roleSysteme(RoleSysteme.ORDONNATEUR_PRINCIPAL)
                    .actif(true)
                    .build();
            affectationTest.initialiserPermissionsDepuisRole();
            affectationRepository.save(affectationTest);

            // ================================================
            log.info("================================================");
            log.info("Initialisation terminée");
            log.info("Admin    : admin@minfi.cm       / Admin@1234");
            log.info("Test     : jean.dupont@minfi.cm / Test@1234");
            log.info("================================================");
        };
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/common/config/DataInitializer.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/common/config/JpaConfig.java

package gov.cmr.minfi.db.gbe.app.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaConfig {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/common/config/JpaConfig.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/common/config/OpenApiConfig.java

package gov.cmr.minfi.db.gbe.app.common.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;

@OpenAPIDefinition(
info = @Info(
contact = @Contact(
name = "DGB",
email = "dge.cellule.informatique"
),
description = "OpenApi documentation for gbe",
version = "1.0",
license = @License(
name = "Proprietaire"
),
termsOfService = "ras"

        ),
        servers = {
                @Server(
                        url = "https://gbe-8clf.onrender.com",
                        description = "Production server"
                ),
                @Server(
                        url = "http://localhost:8080",
                        description = "Development server"
                )
        },
        security = {
                @SecurityRequirement(
                        name = "bearerAuth"
                )
        }

)
@SecurityScheme(
name = "bearerAuth",
description = "JWT auth description",
scheme = "bearer",
type = SecuritySchemeType.HTTP,
bearerFormat = "JWT",
in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/common/config/OpenApiConfig.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/common/exception/BusinessException.java

package gov.cmr.minfi.db.gbe.app.common.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private  final ErrorCode errorCode;
    private final Object[] args;

    public BusinessException(final ErrorCode errorCode, final  Object...args){
        super(getFormatterMessage(errorCode, args));
        this.errorCode = errorCode;
        this.args = args;
    }

    private static String getFormatterMessage(final ErrorCode errorCode, final Object[] args) {
        if(args == null || args.length > 0){
            return String.format(errorCode.getDefaultMessage(), args);
        }
        return errorCode.getDefaultMessage();
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/common/exception/BusinessException.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/common/exception/ErrorCode.java

package gov.cmr.minfi.db.gbe.app.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import static org.springframework.http.HttpStatus.*;

@Getter
public enum ErrorCode {
USER_NOT_FOUND("USER_NOT_FOUND", "User not found with id %s", NOT_FOUND),
CHANGE_PASSWORD_MISMATCH("CHANGE_PASSWORD_MISMATCH", "The new password and his confirmed are differents", BAD_REQUEST),
INVALID_CURRENT_PASSWORD("INVALID_CURRENT_PASSWORD", "The current password is invalid", BAD_REQUEST),
ACCOUNT_ALREADY_DEACTIVATED("ACCOUNT_ALREADY_DEACTIVATED", "The account is already deactivated", BAD_REQUEST),
EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", "Email already exists", BAD_REQUEST),
PHONE_NUMBER_ALREADY_EXISTS("PHONE_NUMBER_ALREADY_EXISTS", "Phone number already exists", BAD_REQUEST),
PASSWORD_MISMATCH("PASSWORD_MISMATCH", "passwords does not match", BAD_REQUEST),
ERR_USER_DISABLED("ERR_USER_DISABLED", "user is disabled", UNAUTHORIZED),
BAD_CREDENTIALS("BAD_CREDENTIALS", "Bad credentials", UNAUTHORIZED),
USERNAME_NOT_FOUND("USERNAME_NOT_FOUND", "User not found with username %s", NOT_FOUND),
INTERNAL_EXCEPTION("INTERNAL_EXCEPTION", "Internal exception", INTERNAL_SERVER_ERROR),
ENTITY_NOT_FOUND("ENTITY_NOT_FOUND", "Entity not found with id %s", NOT_FOUND),
METHODE_ARGUMENT_NOT_VALID("METHODE_ARGUMENT_NOT_VALID", "Method argument not valid", BAD_REQUEST),
NUI_ALREADY_EXISTS("NUI_ALREADY_EXISTS", "this nui is already use", BAD_REQUEST),
CNI_ALREADY_EXISTS("CNI_ALREADY_EXISTS", "this cni is already use", BAD_REQUEST),
ACCOUNT_ALREADY_ACTIVATED("ACCOUNT_ALREADY_ACTIVATED", "this account is already activated", BAD_REQUEST),
MATRICULE_ALREADY_EXISTS("MATRICULE_ALREADY_EXISTS", "this matricule is already use", BAD_REQUEST),
MFA_ALREADY_CONFIRMED("MFA_ALREADY_CONFIRMED", "mfa is already confirmed for this user", BAD_REQUEST),
AFFECTATION_ALREADY_EXISTS("AFFECTATION_ALREADY_EXISTS", "Affectation already exists for this user and programme",
BAD_REQUEST),
AFFECTATION_ALREADY_ACTIVE("AFFECTATION_ALREADY_ACTIVE", "Affectation is already active", BAD_REQUEST),
AFFECTATION_ALREADY_INACTIVE("AFFECTATION_ALREADY_INACTIVE", "Affectation is already inactive", BAD_REQUEST),
AFFECTATION_NOT_FOUND("AFFECTATION_NOT_FOUND", "Affectation not found for this user", NOT_FOUND);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;

    ErrorCode(final String code, final String defaultMessage, final HttpStatus httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/common/exception/ErrorCode.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/common/exception/ErrorResponse.java

package gov.cmr.minfi.db.gbe.app.common.exception;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ErrorResponse {
private String message;
private String code;
private List<ValidationError> validationsErros;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @ToString
    public static class ValidationError {
        private String field;
        private String code;
        private String message;

    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/common/exception/ErrorResponse.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/common/handler/ApplicationExceptionHandler.java

package gov.cmr.minfi.db.gbe.app.common.handler;

import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;

import static gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode.BAD_CREDENTIALS;
import static gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode.ERR_USER_DISABLED;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class ApplicationExceptionHandler {
@ExceptionHandler(BusinessException.class)
public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
final ErrorResponse body = ErrorResponse.builder()
.code(ex.getErrorCode().getCode())
.message(ex.getMessage())
.build();

        log.info("Business exception  {}", ex.getMessage());
        log.debug(ex.getMessage(), ex);

        return ResponseEntity.status(
                ex.getErrorCode().getHttpStatus() != null ? ex.getErrorCode().getHttpStatus() : BAD_REQUEST
        ).body(body);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponse> handleDisabledException(DisabledException ex) {
        final ErrorResponse body = ErrorResponse.builder()
                .code(ERR_USER_DISABLED.getCode())
                .message(ERR_USER_DISABLED.getDefaultMessage())
                .build();
        return ResponseEntity.status(ERR_USER_DISABLED.getHttpStatus()).body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(BadCredentialsException ex) {
        log.debug(ex.getMessage(), ex);
        final ErrorResponse body = ErrorResponse.builder()
                .message(BAD_CREDENTIALS.getDefaultMessage())
                .code(BAD_CREDENTIALS.getCode())
                .build();
        return ResponseEntity.status(BAD_CREDENTIALS.getHttpStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        log.debug(ex.getMessage(), ex);

        final List<ErrorResponse.ValidationError> errors = new ArrayList<>();
        ex.getBindingResult()
                .getAllErrors()
                .forEach(
                        error -> {
                            final String fieldName = ((FieldError) error).getField();
                            final String errorCode = error.getDefaultMessage();

                            errors.add(ErrorResponse.ValidationError.builder()
                                    .field(fieldName)
                                    .code(errorCode)
                                    .message(errorCode)
                                    .build()
                            );
                        });
        final ErrorResponse errorResponse = ErrorResponse.builder()
                .validationsErros(errors)
                .build();
        return ResponseEntity.status(BAD_REQUEST)
                .body(errorResponse);

    }

// @ExceptionHandler(EntityNotFoundException.class)
// public ResponseEntity<ErrorResponse> handleEntityNotFoundException(EntityNotFoundException ex) {
// log.debug(ex.getMessage(), ex);
// final ErrorResponse body = ErrorResponse.builder()
// .message(ENTITY_NOT_FOUND.getDefaultMessage())
// .code(ENTITY_NOT_FOUND.getCode())
// .build();
// return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
// }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUsernameNotFoundException(UsernameNotFoundException ex) {
        log.debug(ex.getMessage(), ex);
        final ErrorResponse body = ErrorResponse.builder()
                .message(ErrorCode.USERNAME_NOT_FOUND.getDefaultMessage())
                .code(ErrorCode.USERNAME_NOT_FOUND.getCode())
                .build();
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        log.error(ex.getMessage(), ex);
        final ErrorResponse response = ErrorResponse.builder()
                .code(ErrorCode.INTERNAL_EXCEPTION.getCode())
                .message(ex.getMessage())
                .build();

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/common/handler/ApplicationExceptionHandler.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/exercice/Exercice.java

package gov.cmr.minfi.db.gbe.app.exercice;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "EXERCICE")
public class Exercice extends BaseEntity {

    @Column(name = "ANNEE", nullable = false, unique = true)
    private Integer annee;

    @Column(name = "CODE_EXERCICE", nullable = false)
    private Integer codeExercice;

    @Column(name = "LIBELLE_FR")
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;

    @Column(name = "ACTIF")
    private boolean actif;

    @PrePersist
    @PreUpdate
    private void calculerCode() {
        if (this.annee != null) {
            this.codeExercice = 47 + (this.annee - 2013);
        }
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/exercice/Exercice.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/exercice/ExerciceRepository.java

package gov.cmr.minfi.db.gbe.app.exercice;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciceRepository extends JpaRepository<Exercice, String> {

    boolean existsByAnnee(Integer annee);

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/exercice/ExerciceRepository.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/GbeApplication.java

package gov.cmr.minfi.db.gbe.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GbeApplication {

    public static void main(String[] args) {
        SpringApplication.run(GbeApplication.class, args);

    }

// @Bean
// public CommandLineRunner commandLineRunner(final RoleRepository roleRepository) {
// return args -> {
// final Optional<Role> userRole = roleRepository.findByName("ROLE_USER");
// if (userRole.isEmpty()) {
// Role role = new Role();
// role.setName("ROLE_USER");
// role.setCreatedBy("APP");
// roleRepository.save(role);
// }
// };
// }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/GbeApplication.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/iam/permission/Permission.java

package gov.cmr.minfi.db.gbe.app.iam.permission;

public enum Permission {
// Ordonateur
ENGAGE_DEPENSE("Engager une dépense"),
REVISER_AE("Rèviser les AE"),
REVISER_CP("Réviser les CP"),
REJETER_DEPENSE("Rejeter une dépense"),

    // Controleur financier
    VISA_CFI("Viser une dépense"),
    REJETER_CFI("Rejeter au niveau CFI"),

    // Comptable
    LIQUIDER_DEPENSE("Liquider une depense"),
    PAYER_DEPENSE("Payer une dépense"),

    // Admin
    MANAGE_USERS("Gérer les utilisateurs"),
    MANAGE_AFFECTATIONS("Gérer les affectations");

    private  final String libelle;

    Permission(String libelle){
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/iam/permission/Permission.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/iam/role/Role.java

package gov.cmr.minfi.db.gbe.app.iam.role;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "ROLES")
public class Role extends BaseEntity {

    private String name;

    @ManyToMany(mappedBy = "roles")
    private List<User> users;

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/iam/role/Role.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/iam/role/RoleRepository.java

package gov.cmr.minfi.db.gbe.app.iam.role;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, String> {
Optional<Role> findByName(String name);
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/iam/role/RoleRepository.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/iam/role/RoleSysteme.java

package gov.cmr.minfi.db.gbe.app.iam.role;

import gov.cmr.minfi.db.gbe.app.iam.permission.Permission;

import java.util.Set;

public enum RoleSysteme {

    ADMIN("Administrateur") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.MANAGE_USERS,
                    Permission.MANAGE_AFFECTATIONS
            );
        }
    },
    ORDONNATEUR_PRINCIPAL("Ordonnateur principal") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.ENGAGE_DEPENSE,
                    Permission.REVISER_AE,
                    Permission.REVISER_CP,
                    Permission.REJETER_DEPENSE
            );
        }
    },
    ORDONNATEUR_SECONDAIRE("Ordonnateur secondaire") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.ENGAGE_DEPENSE,
                    Permission.REVISER_AE,
                    Permission.REVISER_CP,
                    Permission.REJETER_DEPENSE
            );
        }
    },
    ORDONNATEUR_DELEGUE("Ordonnateur délégué") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.ENGAGE_DEPENSE,
                    Permission.REJETER_DEPENSE
            );
        }
    },
    CONTROLEUR_FINANCIER("Contrôleur financier") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.VISA_CFI,
                    Permission.REJETER_CFI
            );
        }
    },
    COMPTABLE("Comptable") {
        @Override
        public Set<Permission> getDefaultPermissions() {
            return Set.of(
                    Permission.LIQUIDER_DEPENSE,
                    Permission.PAYER_DEPENSE
            );
        }
    };

    private final String libelle;

    RoleSysteme(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }

    public abstract Set<Permission> getDefaultPermissions();

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/iam/role/RoleSysteme.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/CategorieService.java

package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "CATEGORIE_SERVICE")
public class CategorieService extends BaseEntity {

    // 2 caractères — ex: "52", "33", "44"
    @Column(name = "CODE", nullable = false, unique = true, length = 2)
    private String code;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @Enumerated(EnumType.STRING)
    @Column(name = "TYPE_ADMINISTRATION", nullable = false)
    private TypeAdministration typeAdministration;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/CategorieService.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/Chapitre.java

package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.referentiel.geo.Arrondissement;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "CHAPITRE")
public class Chapitre extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SECTION_ID", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CATEGORIE_SERVICE_ID", nullable = false)
    private CategorieService categorieService;

    // Nullable — services centraux n'ont pas de localisation géographique
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ARRONDISSEMENT_ID")
    private Arrondissement arrondissement;

    // Numéro d'ordre sur 2 caractères — ex: "01", "02"
    @Column(name = "NUM_ORDRE", nullable = false, length = 2)
    private String numOrdre;

    // Code complet 8 car = codeService(2) + codeGeo(4) + numOrdre(2)
    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 8)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.categorieService == null || this.numOrdre == null) return;

        String codeService = this.categorieService.getCode();

        // Services centraux → codeGeo = "0000"
        String codeGeo = (this.arrondissement != null)
                ? this.arrondissement.getCodeComplet()
                : "0000";

        this.codeComplet = codeService + codeGeo + this.numOrdre;
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/Chapitre.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/Section.java

package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.exercice.Exercice;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(
name = "SECTION",
uniqueConstraints = @UniqueConstraint(
name = "uk_section_code_exercice",
columnNames = {"CODE_SECTION", "EXERCICE_ID"}
)
)
public class Section extends BaseEntity {

    // Code sur 2 caractères — ex: "20", "53", "58", "60"
    @Column(name = "CODE_SECTION", nullable = false, length = 2)
    private String codeSection;

    // Sigle — ex: "MINFI", "PRC", "AN", "MINESEC"
    @Column(name = "SIGLE", length = 20)
    private String sigle;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @Enumerated(EnumType.STRING)
    @Column(name = "TYPE_SECTION")
    private TypeSection typeSection;

    // Une section est toujours dans le contexte d'un exercice budgétaire
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EXERCICE_ID", nullable = false)
    private Exercice exercice;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/Section.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/SectionRepository.java

package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SectionRepository extends JpaRepository<Section, String> {
boolean existsByCodeSectionAndExerciceId(String codeSection, String exerciceId);
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/SectionRepository.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/TypeAdministration.java

package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

public enum TypeAdministration {
ADMINISTRATION_CENTRALE("Administration centrale", "Central administration"),
SERVICE_DECONCENTRE("Service déconcentré", "Deconcentrated service"),
SERVICE_DECENTRALISE("Service décentralisé autonome", "Autonomous decentralized service"),
SANS_EXISTENCE_ORGANIQUE("Sans existence organique", "Without organic existence");

    private final String libelleFr;
    private final String libelleEn;

    TypeAdministration(String libelleFr, String libelleEn) {
        this.libelleFr = libelleFr;
        this.libelleEn = libelleEn;
    }

    public String getLibelleFr() { return libelleFr; }
    public String getLibelleEn() { return libelleEn; }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/TypeAdministration.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/TypeSection.java

package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

public enum TypeSection {

    MINISTERE(
            "M",
            "Ministère",
            "Ministry"
    ),
    INSTITUTION_CONSTITUTIONNELLE(
            "C",
            "Institution constitutionnelle",
            "Constitutional institution"
    ),
    BUDGET_ANNEXE(
            "A",
            "Budget annexe",
            "Annexed budget"
    );

    private final String code;
    private final String libelleFr;
    private final String libelleEn;

    TypeSection(String code, String libelleFr, String libelleEn) {
        this.code = code;
        this.libelleFr = libelleFr;
        this.libelleEn = libelleEn;
    }

    public String getCode() { return code; }
    public String getLibelleFr() { return libelleFr; }
    public String getLibelleEn() { return libelleEn; }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/administratif/TypeSection.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/ArticleDepense.java

package gov.cmr.minfi.db.gbe.app.referentiel.economique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "ARTICLE_DEPENSE")
public class ArticleDepense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TITRE_ID", nullable = false)
    private TitreDepense titre;

    // 2 caractères — compte principal PCE — ex: "61", "62", "63", "66"
    @Column(name = "CODE_ARTICLE", nullable = false, length = 2)
    private String codeArticle;

    // Calculé : codeTitre(1) + codeArticle(2) = 3 car — ex: "661", "631"
    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 3)
    private String codeComplet;

    // Numéro de compte principal du Plan Comptable de l'État
    @Column(name = "NUM_COMPTE_PCE")
    private Integer numComptePce;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.titre != null && this.codeArticle != null) {
            this.codeComplet = this.titre.getCodeTitre() + this.codeArticle;
        }
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/ArticleDepense.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/ParagrapheDepense.java

package gov.cmr.minfi.db.gbe.app.referentiel.economique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "PARAGRAPHE_DEPENSE")
public class ParagrapheDepense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ARTICLE_ID", nullable = false)
    private ArticleDepense article;

    @Column(name = "CODE_PARAGRAPHE", nullable = false, length = 1)
    private String codeParagraphe;

    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 4)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.article != null && this.codeParagraphe != null) {
            this.codeComplet = this.article.getCodeComplet() + this.codeParagraphe;
        }
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/ParagrapheDepense.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/RubriqueDepense.java

package gov.cmr.minfi.db.gbe.app.referentiel.economique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "RUBRIQUE_DEPENSE")
public class RubriqueDepense extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PARAGRAPHE_ID", nullable = false)
    private ParagrapheDepense paragraphe;

    // 1 ou 2 caractères selon les données réelles DGB
    @Column(name = "CODE_RUBRIQUE", nullable = false, length = 2)
    private String codeRubrique;

    // On garde 6 pour couvrir tous les cas — ex: "6227", "61210"
    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 6)
    private String codeComplet;

    @Column(name = "NUM_COMPTE_PCE")
    private Integer numComptePce;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.paragraphe != null && this.codeRubrique != null) {
            this.codeComplet = this.paragraphe.getCodeComplet() + this.codeRubrique;
        }
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/RubriqueDepense.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/SourceFinancement.java

package gov.cmr.minfi.db.gbe.app.referentiel.economique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "SOURCE_FINANCEMENT")
public class SourceFinancement extends BaseEntity {

    // 3 caractères — ex: "001", "010"
    @Column(name = "CODE", nullable = false, unique = true, length = 3)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "TYPE_SOURCE", nullable = false)
    private TypeSource typeSource;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/SourceFinancement.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/TitreDepense.java

package gov.cmr.minfi.db.gbe.app.referentiel.economique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "TITRE_DEPENSE")
public class TitreDepense extends BaseEntity {

    // Titre 6 : Autres dépenses
    @Column(name = "CODE_TITRE", nullable = false, unique = true, length = 1)
    private String codeTitre;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/TitreDepense.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/TypeSource.java

package gov.cmr.minfi.db.gbe.app.referentiel.economique;

public enum TypeSource {

    FONDS_PROPRES(
            "Fonds propres",
            "Own funds"
    ),
    DON_INTERIEUR(
            "Don intérieur",
            "Domestic grant"
    ),
    DON_EXTERIEUR(
            "Don extérieur",
            "External grant"
    ),
    PRET_INTERIEUR(
            "Prêt intérieur",
            "Domestic loan"
    ),
    PRET_EXTERIEUR(
            "Prêt extérieur",
            "External loan"
    );

    private final String libelleFr;
    private final String libelleEn;

    TypeSource(String libelleFr, String libelleEn) {
        this.libelleFr = libelleFr;
        this.libelleEn = libelleEn;
    }

    public String getLibelleFr() { return libelleFr; }
    public String getLibelleEn() { return libelleEn; }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/economique/TypeSource.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/fonctionnel/ClasseFonctionnelle.java

package gov.cmr.minfi.db.gbe.app.referentiel.fonctionnel;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "CLASSE_FONCTIONNELLE")
public class ClasseFonctionnelle extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "GROUPE_ID", nullable = false)
    private GroupeFonctionnel groupe;

    // 1 caractère — ex: "1", "2"
    @Column(name = "CODE_CLASSE", nullable = false, length = 1)
    private String codeClasse;

    // Calculé : codeDivision(2) + codeGroupe(1) + codeClasse(1) = 4 caractères
    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 4)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.groupe != null && this.codeClasse != null) {
            this.codeComplet = this.groupe.getCodeComplet() + this.codeClasse;
        }
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/fonctionnel/ClasseFonctionnelle.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/fonctionnel/DivisionFonctionnelle.java

package gov.cmr.minfi.db.gbe.app.referentiel.fonctionnel;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "DIVISION")
public class DivisionFonctionnelle extends BaseEntity {

    // 2 caractères — "01" à "10" selon NBE Art.15
    @Column(name = "CODE_DIVISION", nullable = false, unique = true, length = 2)
    private String codeDivision;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/fonctionnel/DivisionFonctionnelle.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/fonctionnel/GroupeFonctionnel.java

package gov.cmr.minfi.db.gbe.app.referentiel.fonctionnel;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "GROUPE_FONCTIONNEL")
public class GroupeFonctionnel extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DIVISION_ID", nullable = false)
    private DivisionFonctionnelle division;

    // 1 caractère — ex: "1", "2"
    @Column(name = "CODE_GROUPE", nullable = false, length = 1)
    private String codeGroupe;

    // Calculé : codeDivision(2) + codeGroupe(1) = 3 caractères
    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 3)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.division != null && this.codeGroupe != null) {
            this.codeComplet = this.division.getCodeDivision() + this.codeGroupe;
        }
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/fonctionnel/GroupeFonctionnel.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/geo/Arrondissement.java

package gov.cmr.minfi.db.gbe.app.referentiel.geo;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "ARRONDISSEMENT")
public class Arrondissement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DEPARTEMENT_ID", nullable = false)
    private Departement departement;

    @Column(name = "CODE_ARRONDISSEMENT", nullable = false, length = 1)
    private String codeArrondissement;

    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 4)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.departement != null && this.codeArrondissement != null) {
            this.codeComplet = this.departement.getCodeComplet()
                    + this.codeArrondissement;
        }
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/geo/Arrondissement.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/geo/Departement.java

package gov.cmr.minfi.db.gbe.app.referentiel.geo;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "DEPARTEMENT")
public class Departement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "REGION_ID", nullable = false)
    private Region region;

    @Column(name = "CODE_DEPARTEMENT", nullable = false, length = 1)
    private String codeDepartement;

    @Column(name = "CODE_COMPLET", nullable = false, unique = true, length = 3)
    private String codeComplet;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @PrePersist
    @PreUpdate
    private void calculerCodeComplet() {
        if (this.region != null && this.codeDepartement != null) {
            this.codeComplet = this.region.getCodeRegion() + this.codeDepartement;
        }
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/geo/Departement.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/geo/Region.java

package gov.cmr.minfi.db.gbe.app.referentiel.geo;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "REGION")
public class Region extends BaseEntity {

    @Column(name = "CODE_REGION", nullable = false, unique = true, length = 2)
    private String codeRegion;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/geo/Region.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/Action.java

package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "ACTION")
public class Action extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROGRAMME_ID", nullable = false)
    private Programme programme;

    // 2 caractères dans la pratique — ex: "01", "02"... "09"
    @Column(name = "CODE_ACTION", nullable = false, length = 2)
    private String codeAction;

    // Code composite — ex: "58.112.01"
    @Column(name = "AUTRE_CODE", length = 50)
    private String autreCode;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/Action.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/Activite.java

package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "ACTIVITE")
public class Activite extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ACTION_ID", nullable = false)
    private Action action;

    @Column(name = "CODE_ACTIVITE", nullable = false)
    private String codeActivite;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/Activite.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/Operation.java

package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "OPERATION")
public class Operation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TACHE_ID", nullable = false)
    private Tache tache;

    @Column(name = "CODE_OPERATION", nullable = false)
    private String codeOperation;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/Operation.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/Programme.java

package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.exercice.Exercice;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(
name = "PROGRAMME",
uniqueConstraints = @UniqueConstraint(
name = "uk_programme_code_exercice",
columnNames = {"CODE", "EXERCICE_ID"}
)
)
public class Programme extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SECTION_ID", nullable = false)
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "EXERCICE_ID", nullable = false)
    private Exercice exercice;

    // 3 caractères séquentiels — ex: "001", "016", "112"
    @Column(name = "CODE", nullable = false, length = 3)
    private String code;

    // Code composite complet — ex: "58.112", "53.52.01.1"
    @Column(name = "AUTRE_CODE", length = 50)
    private String autreCode;

    // Code de l'exercice — ex: "58" pour 2024, "60" pour 2026
    @Column(name = "CODE_MILLE", length = 5)
    private String codeMille;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;

    @Column(name = "ACTIF")
    @Builder.Default
    private boolean actif = true;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/Programme.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/ProgrammeRepository.java

package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProgrammeRepository extends JpaRepository<Programme, String> {
List<Programme> findBySectionId(String sectionId);

    List<Programme> findBySectionIdAndActifTrue(String sectionId);

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/ProgrammeRepository.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/Tache.java

package gov.cmr.minfi.db.gbe.app.referentiel.programmatique;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "TACHE")
public class Tache extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ACTIVITE_ID", nullable = false)
    private Activite activite;

    @Column(name = "CODE_TACHE", nullable = false)
    private String codeTache;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN")
    private String libelleEn;

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/referentiel/programmatique/Tache.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/security/JwtFilter.java

package gov.cmr.minfi.db.gbe.app.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull final HttpServletRequest request,
            @NonNull final HttpServletResponse response,
            @NonNull final FilterChain filterChain) throws ServletException, IOException {
        if (request.getServletPath().contains("/api/v1/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        final String jwt;
        final String username;

        if ((authHeader == null) || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = Objects.requireNonNull(authHeader).substring(7);
        username = this.jwtService.extractUsername(jwt);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            final UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            if (this.jwtService.isTokenValid(jwt, userDetails.getUsername())) {
                final UsernamePasswordAuthenticationToken autheToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                autheToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(autheToken);

            }
        }
        filterChain.doFilter(request, response);
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/security/JwtFilter.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/security/JwtService.java

package gov.cmr.minfi.db.gbe.app.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Date;
import java.util.Map;

@Service
@Getter
@Setter
public class JwtService {

    private static final String TOKEN_TYPE = "token_type";
    private final PrivateKey privateKey;
    private final PublicKey publicKey;

    @Value("${app.security.jwt.access-token-expiration}")
    private long accesTokenExpiration;

    @Value("${app.security.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public JwtService() throws Exception {
        this.privateKey = KeyUtils.loadPrivateKey("/keys/local-only/private_key.pem");
        this.publicKey = KeyUtils.loadPublicKey("/keys/local-only/public_key.pem");
    }

    public String generateAccessToken(final String username) {
        final Map<String, Object> claims = Map.of(TOKEN_TYPE, "ACCES_TOKEN");
        return buildToken(username, claims, this.accesTokenExpiration);
    }

    public String generateRefreshToken(final String username) {
        final Map<String, Object> claims = Map.of(TOKEN_TYPE, "REFRESH_TOKEN");
        return buildToken(username, claims, this.refreshTokenExpiration);
    }

    private String buildToken(final String username, final Map<String, Object> claims, long expiration) {
        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(this.privateKey)
                .compact();
    }

    public boolean isTokenValid(final String token, final String expectedUsername) {
        final String username = extractUsername(token);
        return username.equals(expectedUsername) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    private Claims extractClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(this.publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (final JwtException e) {
            throw new RuntimeException("Invalid JWT token", e);
        }
    }

    public String refreshAccessToken(final String refreshToken) {
        final Claims claims = extractClaims(refreshToken);
        if (!"REFRESH_TOKEN".equals(claims.get(TOKEN_TYPE))) {
            throw new RuntimeException("Invalid  token type");
        }

        if (isTokenExpired(refreshToken)) {
            throw new RuntimeException("Refresh Token  expired");
        }
        final String username = claims.getSubject();

        return generateAccessToken(username);
    }

}

// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/security/JwtService.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/security/KeyUtils.java

package gov.cmr.minfi.db.gbe.app.security;

import java.io.InputStream;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public class KeyUtils {
private KeyUtils() {
}

    public static PrivateKey loadPrivateKey(final String pemPath) throws Exception {
        final String key = readKeyFromResource(pemPath)
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");

        final byte[] decoded = Base64.getDecoder().decode(key);
        final PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
        return KeyFactory.getInstance("RSA").generatePrivate(spec);

    }

    public static PublicKey loadPublicKey(final String pemPath) throws Exception {
        final String key = readKeyFromResource(pemPath)
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        final byte[] decoded = Base64.getDecoder().decode(key);
        final X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
        return KeyFactory.getInstance("RSA").generatePublic(spec);

    }

    private static String readKeyFromResource(String pemPath) throws Exception {
        try (final InputStream is = KeyUtils.class.getResourceAsStream(pemPath)) {
            if (is == null) {
                throw new IllegalArgumentException("Could not find key file: " + pemPath);
            }
            return new String((is.readAllBytes()));
        }
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/security/KeyUtils.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/security/SecurityConfig.java

package gov.cmr.minfi.db.gbe.app.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] PUBLIC_URLS = {
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/verify",
            "/api/v1/auth/setup-mfa",
            "/v2/api-docs",
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/swagger-resources",
            "/swagger-resources/**",
            "/configuration/ui",
            "/configuration/security",
            "/swagger-ui/**",
            "/webjars/**",
            "/swagger-ui.html",
    };
    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(final HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.requestMatchers(
                                        PUBLIC_URLS
                                )
                                .permitAll()
                                .anyRequest()
                                .authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(this.jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/security/SecurityConfig.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/user/impl/UserServiceImpl.java

package gov.cmr.minfi.db.gbe.app.user.impl;

import gov.cmr.minfi.db.gbe.app.affectation.UserAffectationRepository;
import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.iam.permission.Permission;
import gov.cmr.minfi.db.gbe.app.user.User;
import gov.cmr.minfi.db.gbe.app.user.UserMapper;
import gov.cmr.minfi.db.gbe.app.user.UserRepository;
import gov.cmr.minfi.db.gbe.app.user.UserServices;
import gov.cmr.minfi.db.gbe.app.user.request.ChangePasswordRequest;
import gov.cmr.minfi.db.gbe.app.user.request.ProfileUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserServices, UserDetailsService {

    private final UserRepository userRepository;
    private final UserAffectationRepository affectationRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    public UserDetails loadUserByUsername(final String userEmail) throws UsernameNotFoundException {
        final User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found : " + userEmail
                ));

        // Charger les permissions actives depuis les affectations
        final Set<Permission> permissions = affectationRepository
                .findByUserIdAndActifTrue(user.getId())
                .stream()
                .flatMap(affectation -> affectation.getPermissions().stream())
                .collect(Collectors.toSet());

        user.setGrantedPermissions(permissions);
        log.debug("User {} loaded with {} permission(s)", userEmail, permissions.size());

        return user;
    }

    @Override
    public void updateProfileInfo(ProfileUpdateRequest request, String userId) {
        User savedUser = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));
        this.userMapper.mergeUserInfo(savedUser, request);
        this.userRepository.save(savedUser);
    }

    @Override
    public void changePassword(ChangePasswordRequest request, String userId) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BusinessException(ErrorCode.CHANGE_PASSWORD_MISMATCH);
        }
        User savedUser = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));
        if (!this.passwordEncoder.matches(request.currentPassword(), savedUser.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CURRENT_PASSWORD);
        }
        savedUser.setPassword(passwordEncoder.encode(request.newPassword()));
        this.userRepository.save(savedUser);
    }

    @Override
    public void deactivateAccount(String userId) {
        final User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));
        if (!user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_DEACTIVATED, userId);
        }
        user.setEnabled(false);
        this.userRepository.save(user);
    }

    @Override
    public void reactivateAccount(String userId) {
        final User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));
        if (user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_ACTIVATED);
        }
        user.setEnabled(true);
        this.userRepository.save(user);
    }

    @Override
    public void deleteAccount(String userId) {
        // TODO: implémenter
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/user/impl/UserServiceImpl.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/user/request/ChangePasswordRequest.java

package gov.cmr.minfi.db.gbe.app.user.request;

public record ChangePasswordRequest(
String currentPassword,
String newPassword,
String confirmPassword
) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/user/request/ChangePasswordRequest.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/user/request/ProfileUpdateRequest.java

package gov.cmr.minfi.db.gbe.app.user.request;

import java.time.LocalDate;

public record ProfileUpdateRequest(
String firstName,
String lastName,
LocalDate dateOfBirth
) {
}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/user/request/ProfileUpdateRequest.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/user/UserController.java

package gov.cmr.minfi.db.gbe.app.user;

import gov.cmr.minfi.db.gbe.app.user.request.ChangePasswordRequest;
import gov.cmr.minfi.db.gbe.app.user.request.ProfileUpdateRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name="User", description ="User API")
public class UserController {
private final UserServices userServices;

    @PatchMapping("/me")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    public  void updateProfileInfo(
            @RequestBody
            @Valid
            ProfileUpdateRequest request,
            final Authentication principal
            ){
        this.userServices.updateProfileInfo(request, getUserId(principal));
    }

    @PostMapping("/me/password")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    public  void changePassword(
            @RequestBody @Valid ChangePasswordRequest request,
            final Authentication principal
            ){
        this.userServices.changePassword(request, getUserId(principal));
    }

    @PatchMapping("/me/deactivate")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    public  void deactivateAccount( final Authentication principal){
        this.userServices.deactivateAccount(getUserId(principal));
    }

    @PatchMapping("/me/reactivate")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    public  void reactivateAccount( final Authentication principal){
        this.userServices.reactivateAccount(getUserId(principal));
    }

    @DeleteMapping("/me")
    @ResponseStatus(code = HttpStatus.NO_CONTENT)
    public  void deleteAccount( final Authentication principal){
        this.userServices.deleteAccount(getUserId(principal));
    }




    private String getUserId(final Authentication principal) {
        return  ((User) Objects.requireNonNull(principal.getPrincipal())).getId();
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/user/UserController.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/user/User.java

package gov.cmr.minfi.db.gbe.app.user;

import gov.cmr.minfi.db.gbe.app.iam.permission.Permission;
import gov.cmr.minfi.db.gbe.app.iam.role.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "USERS")
@EntityListeners(AuditingEntityListener.class)
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "FIRST_NAME", nullable = false)
    private String firstName;

    @Column(name = "LAST_NAME", nullable = false)
    private String lastName;

    @Column(name = "EMAIL", nullable = false, unique = true)
    private String email;

    @Column(name = "PHONE_NUMBER", nullable = false, unique = true)
    private String phoneNumber;

    @Column(name = "PASSWORD", nullable = false)
    private String password;

    @Column(name = "DATE_OF_BIRTH")
    private LocalDate dateOfBirth;

    @Column(name = "MATRICULE")
    private String matricule;

    @Column(name = "NUMERO_CNI")
    private String numeroCni;

    @Column(name = "CNI_ISSUE_DATE")
    private LocalDate cniIssueDate;       // date de délivrance

    @Column(name = "CNI_EXPIRY_DATE")
    private LocalDate cniExpiryDate;      // date d'expiration

    @Column(name = "NUI")
    private String nui;

    // Statut du compte
    @Column(name = "IS_ENABLED")
    private boolean enabled;

    @Column(name = "IS_ACCOUNT_LOCKED")
    private boolean locked;

    @Column(name = "IS_EMAIL_VERIFIED")
    private boolean emailVerified;

    @Column(name = "PHONE_VERIFIED")
    private boolean phoneVerified;

    @Column(name = "CREDENTIALS_EXPIRED")
    private boolean credentialsExpired;

    @Column(name = "FIRST_LOGIN")
    @Builder.Default
    private boolean firstLogin = true;

    // 2FA
    @Column(name = "MFA_ENABLED")
    private boolean mfaEnabled;

    @Column(name = "MFA_SECRET")
    private String secret;

    // Audit
    @CreatedDate
    @Column(name = "CREATED_DATE", updatable = false, nullable = false)
    private LocalDate createdDate;

    @LastModifiedDate
    @Column(name = "LAST_MODIFIED_DATE", insertable = false)
    private LocalDateTime lastModifiedAt;

    @ManyToMany(
            cascade = {CascadeType.MERGE},
            fetch = FetchType.EAGER
    )
    @JoinTable(
            name = "USERS_ROLES",
            joinColumns = {@JoinColumn(name = "USERS_ID")},
            inverseJoinColumns = {@JoinColumn(name = "ROLES_ID")}
    )
    private List<Role> roles;

    @Transient
    private Set<Permission> grantedPermissions = new HashSet<>();


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        final List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        if (!CollectionUtils.isEmpty(this.roles)) {
            this.roles.forEach(role ->
                    authorities.add(new SimpleGrantedAuthority(role.getName()))
            );
        }

        if (!CollectionUtils.isEmpty(this.grantedPermissions)) {
            this.grantedPermissions.forEach(permission ->
                    authorities.add(new SimpleGrantedAuthority(permission.name()))
            );
        }

        return authorities;
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !this.locked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return !this.credentialsExpired;
    }

}// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/user/User.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/user/UserMapper.java

package gov.cmr.minfi.db.gbe.app.user;

import gov.cmr.minfi.db.gbe.app.auth.dto.request.RegistrationRequest;
import gov.cmr.minfi.db.gbe.app.user.request.ProfileUpdateRequest;
import io.micrometer.common.util.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class UserMapper {
public void mergeUserInfo(User user, ProfileUpdateRequest request) {
if (StringUtils.isNotBlank(request.firstName())
&& !user.getFirstName().equals(request.firstName())) {
user.setFirstName(request.firstName());
}

        if (StringUtils.isNotBlank(request.lastName())
                && !user.getLastName().equals(request.lastName())) {
            user.setLastName(request.lastName());
        }

        if (request.dateOfBirth() != null && !request.dateOfBirth().equals(user.getDateOfBirth())) {
            user.setDateOfBirth(request.dateOfBirth());
        }

    }

    public User toUser(RegistrationRequest request) {
        return User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .phoneNumber(request.phoneNumber())
                .email(request.email())
                .enabled(true)
                .locked(false)
                .credentialsExpired(false)
                .emailVerified(false)
                .phoneVerified(false)
                .password(request.password())
                .build();
    }

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/user/UserMapper.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/user/UserRepository.java

package gov.cmr.minfi.db.gbe.app.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
boolean existsByEmailIgnoreCase(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByPhoneNumberIgnoreCase(String phoneNumber);

    boolean existsByNuiIgnoreCase(String nui);

    boolean existsByNumeroCniIgnoreCase(String numeroCni);

    boolean existsByMatriculeIgnoreCase(String matricule);

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/user/UserRepository.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/java/gov/cmr/minfi/db/gbe/app/user/UserServices.java

package gov.cmr.minfi.db.gbe.app.user;

import gov.cmr.minfi.db.gbe.app.user.request.ChangePasswordRequest;
import gov.cmr.minfi.db.gbe.app.user.request.ProfileUpdateRequest;

public interface UserServices {
void updateProfileInfo(ProfileUpdateRequest request, String userId);

    void changePassword(ChangePasswordRequest request, String userId);

    void deactivateAccount(String userId);

    void reactivateAccount(String userId);

    void deleteAccount(String userId);

}
// END OF FILE: src/main/java/gov/cmr/minfi/db/gbe/app/user/UserServices.java

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/resources/application.yaml

spring:
application:
name: gbe
profiles:
active: dev
config:
import: optional:file:.env[.properties]
datasource:
url: jdbc:postgresql://${DB_URL}:${DB_PORT}/${DB_NAME}
username: ${DB_USERNAME}
password: ${DB_PASSWORD}
driver-class-name: org.postgresql.Driver
jpa:
hibernate:
ddl-auto: update
database: postgresql
show-sql: false
properties:
hibernate:
format_sql: true

app:
security:
jwt:
access-token-expiration: 8640000 # For local testing
refresh-token-expiration: 604800000

// END OF FILE: src/main/resources/application.yaml

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/resources/keys/local-only/private_key.pem

-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1atfy0a9noYCh
t0F5+w/LZvdmXYuaDuxTPZAEgZFpUmHzGg7Xil6zYDuU2vo0vkFnqzGVpdVMD1+C
uRbsrVKfAguvX68mf9U1M4GY5rWvWjNYBzNd2ZMDmv8o4EXIIG5iLmzLqOZ2Yahy
LvNa6OVYGUIehelXpaoZnf9M/+zsHymXmzoalKYPyCG8vSl+Ry07cR6IISyzrgk/
rMIBREROdiFZcUFHl5fSof+gTLh9W9WxmvQx4TOb3vZTwtozjR5L+w6zpLX+Ijyx
nJEMist8n5ut0NF0ylnQ8MiC3e6sYtazXWn0HKe4RSoYaIFjZSqd0V9c6/q8M36I
hXzthbwLAgMBAAECggEAAP6kTyPbLwRHAkamSJbvJTxb9ZG5vDnXYzVz3rJ0gPv/
UX0+a5bJ93h68HwANzMmhKepo+++1aXtQ3g5qfPhVMHcHTVhw8zw9v5got1Q+F8p
kj1SiMcynn3GZwujwPnR4R6ZYMcnoaqIvpIx/2Obg6TPz1Rd99RkCbPrZxlYITX1
f/zFBzXHo+jSwKV5nF0DLLyCPUvI2TChuz0pRD8GKW38eTKH22V+RqPAvhtfLYj8
LGx0vZmM/wKDhkbNiJ0SJlP3yzLwikROdXbnJbJEEPmZUUefl+28QeFr6hGgX1z9
flGCPDShQXo638zmVsZP3y6fSjGopO1RwmgsboY78QKBgQDbtS9RRxADOrt/3yDs
IFuFUpde0JSP5UH5pMGNevNfwwaSbNsmWLnwfCDyw9BNLGW0FYurYvzvdsVTgiuV
xLg64WPKVcPFu6ImbMtlUi11RdlsAx1WyXVPCmlet0xlnRtqJ7HrqtOOYRx5M9ux
Hs+zLukiV5ihns07uGSC7470hQKBgQDTYneI5mph/CPoiWGjH0Hzmy8FMwUl2T3P
GoU0eM9qKIo5igfRXf4vFHcKlhyDXiTiYxd6o3aaL+X12PT35/0wyX9uwZJIN3K/
CmClXTeCc1TwWNBN3ifJ+wCsLULahYWB76VmRGUHsNEMiYUdcT2dUKIVfjznLv+o
LFFMnJlbTwKBgAlXAHXyEWoxuvrKn3mqPnnCcxDiyQ387vsP1/KNwX7WqZbb7c0J
hI4GmNf5HwfI1WH8cH2OrbX4VJciN3wcasCGCFn3n2TufwwnH9Zk0e3kVEPVNhAU
bFo51RTjsem37gxrN5MPJgMteaplW/eBmc7CNcLx+lkUiSD6y7sNOASJAoGBAMgN
wKNHrhbd0f4ZRtZilsA+ddmt14lieCSxLK/kRihqBac/AvcaxZ04+RCD0KhjSPUY
YvgmC/EQs8pgcjbMz8qEaJ4hhJfkIiy7XYwjFI3ZKOHuq/WF8pItgw1wKH03MIsw
ipCm2hbVOINtAxZCPdXMohlFR85jpIE8sBSZgGnxAoGARedyGJdHJYY3a5oLI+BO
kJuiI3ykC2zb/WMrhrivO28dw0hVAD5vJjRl8jjb6b5tTDj3jOIhFkC5EQZ6SuuE
PZkT+hF43nc/9mY6LryKRhm5gAZmOW8qC8dVxRQ8lE2GIYferqJnlgLtO/Fn0hMd
fdmCUph3IFhmzrbAZagRXDQ=
-----END PRIVATE KEY-----
// END OF FILE: src/main/resources/keys/local-only/private_key.pem

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/main/resources/keys/local-only/public_key.pem

-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtWrX8tGvZ6GAobdBefsP
y2b3Zl2Lmg7sUz2QBIGRaVJh8xoO14pes2A7lNr6NL5BZ6sxlaXVTA9fgrkW7K1S
nwILr1+vJn/VNTOBmOa1r1ozWAczXdmTA5r/KOBFyCBuYi5sy6jmdmGoci7zWujl
WBlCHoXpV6WqGZ3/TP/s7B8pl5s6GpSmD8ghvL0pfkctO3EeiCEss64JP6zCAURE
TnYhWXFBR5eX0qH/oEy4fVvVsZr0MeEzm972U8LaM40eS/sOs6S1/iI8sZyRDIrL
fJ+brdDRdMpZ0PDIgt3urGLWs11p9BynuEUqGGiBY2UqndFfXOv6vDN+iIV87YW8
CwIDAQAB
-----END PUBLIC KEY-----
// END OF FILE: src/main/resources/keys/local-only/public_key.pem

//---> PATH:
/home/therooster/Documents/FORMATIONS/MINFI-Application-de-Genstion-du-Budget/api/gbe/src/test/java/gov/cmr/minfi/db/gbe/app/GbeApplicationTests.java

package gov.cmr.minfi.db.gbe.app;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class GbeApplicationTests {

	@Test
	void contextLoads() {
	}

}
// END OF FILE: src/test/java/gov/cmr/minfi/db/gbe/app/GbeApplicationTests.java


