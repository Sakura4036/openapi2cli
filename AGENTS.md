# CLAUDE.md

openapi2cli - Convert OpenAPI specs (JSON/YAML) to executable CLI tools.

## Commands

```bash
npm run build        # Build
npm run dev          # Watch mode
npm test             # Run tests
node bin/openapi2cli.js --help
node bin/openapi2cli.js ./api.json -o ./my-cli
```

## Architecture

**Pipeline**: `Input (JSON/YAML/URL) → Parser → Generator → CLI Project`

### Core Files

| File | Purpose |
|------|---------|
| `src/parser.ts` | Parse OpenAPI 2.x/3.x specs using `@apidevtools/swagger-parser` |
| `src/types.ts` | TypeScript interfaces for parsed data and options |
| `src/generator/typescript.ts` | Generate Commander.js CLI project |
| `src/cli.ts` | CLI entry point with all options |
| `src/config.ts` | YAML config file loader |

### CLI Options

```
-o, --output <dir>       Output directory (required)
--base-url <url>         Override API base URL
--name <name>            CLI name (default: from API title)
--env-prefix <prefix>    Environment variable prefix
--include-tags <tags>    Comma-separated tags to include
--include-ops <ids>      Comma-separated operation IDs to include
--exclude-tags <tags>    Comma-separated tags to exclude
--exclude-ops <ids>      Comma-separated operation IDs to exclude
--group-by-tag           Organize commands by tag
--logs                   Show conversion logs
-c, --config <path>      Path to YAML config file
```

### Config File (YAML)

```yaml
cliName: my-api
baseUrl: https://api.example.com
envPrefix: MY_API_
permissions:
  allow:
    tags: [users, posts]
  block:
    operationIds: [deleteUser]
agent:
  includeExamples: true
  autoExportTools: true
```

### Generated CLI Structure

```
my-cli/
├── bin/cli.js           # Entry point
├── src/
│   ├── index.ts         # Commander setup
│   ├── client.ts        # Fetch client with auth
│   ├── commands/*.ts    # One file per operation
│   └── types.ts         # API types
├── package.json
└── tsconfig.json
```

### Authentication

Env vars are auto-generated from security schemes:
- `Bearer/OAuth2/OIDC`: `<PREFIX>_<SCHEME>_TOKEN`
- `API Key`: `<PREFIX>_<SCHEME>_TOKEN`
- `Basic`: `<PREFIX>_<SCHEME>_USERNAME` + `_PASSWORD`

## Tests

- `tests/parser.test.ts` - Parser tests
- `tests/generator/*.test.ts` - Generator and config tests
- `tests/integration/*.test.ts` - Full CLI generation tests

## Dependencies

- `@apidevtools/swagger-parser` - OpenAPI parsing
- `commander` - CLI framework
- `js-yaml` - YAML parsing
- `lodash` - String utilities

Generated CLIs use native `fetch` (Node.js 18+).