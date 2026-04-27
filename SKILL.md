---
name: openapi2cli
description: Convert OpenAPI specs (JSON/YAML) to executable CLI tools. This skill helps Claude parse API specifications, generate Commander.js-based CLI projects, and manage advanced features like filtering, tagging, and authentication. Always use this skill when the user mentions converting OpenAPI or Swagger to CLI, generating tools from API specs, or needs to provide a CLI interface for an API.
---

# openapi2cli Skill

A skill for converting OpenAPI specifications (JSON/YAML/URL) into robust, executable CLI tools using `@apidevtools/swagger-parser` and `commander`.

## Core Pipeline
1. **Input**: OpenAPI 2.0/3.0/3.1 (JSON/YAML/URL)
2. **Parser**: Resolves and validates the specification.
3. **Generator**: Scaffolds a TypeScript project with subcommands for each API operation.
4. **CLI Project**: A ready-to-use Command-line interface with authentication and Fetch-based client.

## Workflow

### 1. Generate CLI
Use the `openapi2cli` command to generate a new tool:
```bash
node bin/openapi2cli.js <input-spec> -o <output-dir> [options]
```

**Common Options:**
- `-o, --output <dir>`: (Required) Where to generate the CLI project.
- `--name <name>`: Custom CLI name.
- `--base-url <url>`: Override the API base URL.
- `--group-by-tag`: Organize commands by tag (recommended for larger APIs).
- `--include-tags <tags>` / `--include-ops <ids>`: Filter specifically which APIs to include.
- `--exclude-tags <tags>` / `--exclude-ops <ids>`: Exclude specific APIs.
- `-c, --config <path>`: Use a YAML config file for complex setups.

### 2. Set Up the Generated CLI
After generation, initialize the project:
```bash
cd <output-dir>
npm install
npm run build
npm link  # Optional: accessible globally
```

### 3. Authentication
The generated CLI uses environment variables for authentication. Prefix is `CLI_` by default (can be customized with `--env-prefix`), and authentication variables can be fully replaced with `--auth-env-name`.
- **Bearer/OAuth2**: `<PREFIX>_API_KEY`
- **API Key**: `<PREFIX>_API_KEY`
- **Basic**: `<PREFIX>_<SCHEME>_USERNAME` + `_PASSWORD`

### 4. Agent-Friendly Features
Generated CLIs include tools for better AI interaction:
- `search-api`: Search for specific endpoint functionality via keywords.
- `export-tools-json`: Export CLI commands as JSON for model tools.
- `schema`: View the detailed schema for any command.

## Project Structure (Generated)
- `bin/cli.js`: Entry point for execution.
- `src/index.ts`: Commander setup and subcommand registration.
- `src/client.ts`: Shared fetch client with authentication logic.
- `src/commands/*.ts`: One file per operation, simplifying maintenance.
- `src/types.ts`: TypeScript interfaces derived from OpenAPI schemas.

## Best Practices
- **Use Subcommands**: For APIs with many operations, suggest `--group-by-tag` to keep the CLI organized.
- **Config Files**: For complex filtering or custom naming, use the `.openapi2cli.yaml` format.
- **Verification**: Always run `npm run build` after generating or modifying the CLI code to ensure type safety.
- **File Handling**: For multipart/form-data or binary downloads, check the generated code matches expected file system interactions.
