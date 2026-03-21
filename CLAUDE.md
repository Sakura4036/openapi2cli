# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

openapi2cli is a CLI tool that converts OpenAPI specifications (JSON/YAML) into executable CLI tools. It parses OpenAPI specs and generates TypeScript CLI code based on Commander.js, enabling AI agents and developers to interact with APIs through simple command-line interfaces.

## Commands

```bash
# Build the project
npm run build

# Watch mode for development
npm run dev

# Run tests
npm test

# Run a specific test file
npx jest tests/parser.test.ts

# Run the CLI locally
node bin/openapi2cli.js --help

# Run with an OpenAPI spec
node bin/openapi2cli.js ./api.json -o ./my-cli
```

## Architecture

The codebase follows a pipeline architecture: **Parse → Generate → Execute**

```
Input (JSON/YAML/URL)
        ↓
   OpenAPIParser (src/parser.ts)
        ↓
   ParsedOpenAPI (src/types.ts)
        ↓
   TypeScriptGenerator (src/generator/typescript.ts)
        ↓
   Generated CLI Project
```

### Core Components

1. **`src/parser.ts`** - OpenAPIParser class that parses OpenAPI 2.x (Swagger) and 3.x specs using `@apidevtools/swagger-parser`. Extracts:
   - API info (title, version, description)
   - Base URLs from `servers` (OpenAPI 3.x) or `host`/`basePath` (Swagger 2.x)
   - Security schemes (Bearer, API Key, Basic, OAuth2, OpenID Connect)
   - Paths and operations with parameters, request bodies, and responses

2. **`src/types.ts`** - TypeScript interfaces defining the internal representation:
   - `ParsedOpenAPI` - The normalized API structure
   - `ParsedPath` / `ParsedMethod` - Endpoint definitions
   - `ParsedParameter` - Path/query/header parameters
   - `SecurityScheme` - Authentication configuration

3. **`src/generator/typescript.ts`** - TypeScriptGenerator that outputs a complete CLI project:
   - `package.json` with dependencies (commander, axios)
   - `src/index.ts` - CLI entry point
   - `src/client.ts` - Axios client with auth interceptors
   - `src/commands/*.ts` - One file per operation
   - `src/types.ts` - Type definitions

4. **`src/cli.ts`** - Commander.js CLI that accepts input spec, output directory, and options like `--base-url`, `--name`, `--env-prefix`.

### Generated CLI Structure

The generated CLI projects follow this pattern:
```
my-cli/
├── bin/cli.js           # Shebang entry point
├── src/
│   ├── index.ts         # Commander program setup
│   ├── client.ts        # Axios instance with auth
│   ├── commands/        # One file per operation
│   │   ├── index.ts     # Registers all commands
│   │   └── *.ts         # Individual commands
│   └── types.ts         # API types
├── package.json
└── tsconfig.json
```

### Authentication Flow

Security schemes are extracted and converted to environment variable based authentication:
- Bearer: `<SCHEME_NAME>_TOKEN` env var → `Authorization: Bearer <token>`
- API Key (header): `<SCHEME_NAME>_TOKEN` → custom header
- API Key (query): `<SCHEME_NAME>_TOKEN` → query parameter
- Basic: `<SCHEME_NAME>_USERNAME` + `<SCHEME_NAME>_PASSWORD` → Base64 encoded

## Testing

Tests use Jest with ts-jest. Test files are in `tests/` directory:
- `tests/parser.test.ts` - Parser unit tests with mock OpenAPI specs
- `tests/generator/typescript.test.ts` - Generator tests
- `tests/types.test.ts` - Type definition tests

Tests create temporary spec files in `tests/temp-specs/` which are cleaned up after runs.

## Key Dependencies

- `@apidevtools/swagger-parser` - OpenAPI parsing and validation
- `commander` - CLI framework for both the tool and generated CLIs
- `js-yaml` - YAML parsing
- `lodash` - String utilities (kebabCase, camelCase, etc.)
- `axios` - HTTP client in generated CLIs