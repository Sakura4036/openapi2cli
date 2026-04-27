# Architecture

This document describes the technical architecture of `openapi2cli`.

## Overview

`openapi2cli` is a code generator that transforms OpenAPI specifications into a fully functional, type-safe TypeScript CLI tool.

## Key Components

### 1. Parser (`src/parser.ts`)
The parser is responsible for loading and validating the OpenAPI specification.
- Uses `@apidevtools/swagger-parser` for robust parsing of JSON/YAML and URL sources.
- Supports OpenAPI 2.0 (Swagger), 3.0, and 3.1.
- Extracts critical information:
  - **Servers**: Base URLs for API requests.
  - **Security Schemes**: Authentication methods (Bearer, API Key, Basic, OAuth2, OIDC).
  - **Operations**: Endpoints, HTTP methods, parameters (path, query, header), and request bodies.
  - **Schemas**: Data models for request/response validation and types.

### 2. Generator (`src/generator/typescript.ts`)
The generator takes the parsed metadata and produces the target CLI source code.
- **Project Structure**: Generates a complete Node.js project including `package.json`, `tsconfig.json`, and an executable entry point.
- **Commander.js**: Uses `commander` to handle CLI arguments, options, and help messages.
- **Client**: Generates a unified API client that handles authentication and network requests using native `fetch`.
- **Commands**: Creates separate command files or a hierarchical structure based on OpenAPI tags.

## Execution Flow

1. **Input**: User provides a path (local or URL) to an OpenAPI spec.
2. **Parsing**: `SwaggerParser` reads the spec.
3. **Internal Representation**: Metadata is transformed into `OpenAPIMetadata` and `OperationMetadata` structures.
4. **Code Generation**:
   - `package.json` and `tsconfig.json` are initialized.
   - The API client is generated with detected security schemes.
   - Command files are generated for each operation.
   - The CLI entry point bridges commands and the client.
5. **Output**: A complete, ready-to-install TypeScript project.

## Authentication Mechanism

The generated CLI uses environment variables for authentication, which are automatically mapped from the security schemes defined in the OpenAPI spec. By default, generated auth credential names use `<PREFIX>_API_KEY` and can be fully replaced with `--auth-env-name` or `authEnvName`. It supports:
- **Bearer Token**: `export <PREFIX>_API_KEY="..."`
- **API Key**: `export <PREFIX>_API_KEY="..."`
- **Basic Auth**: `export <PREFIX>_<SCHEME>_USERNAME="..."` and `export <PREFIX>_<SCHEME>_PASSWORD="..."`
- **OAuth2/OIDC**: Handled as Bearer tokens.
