# openapi2cli

A CLI tool that converts OpenAPI specifications (JSON/YAML) into executable CLI tools.

[![npm version](https://img.shields.io/npm/v/openapi2cli.svg)](https://www.npmjs.com/package/openapi2cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Multiple input sources**: Local JSON files, YAML files, or URLs
- **OpenAPI V2/V3 Support**: Comprehensive support for Swagger 2.0 and OpenAPI 3.0/3.1
- **TypeScript output**: Generates clean, type-safe TypeScript code
- **Auto authentication**: Automatically detects and configures security schemes (Bearer, API Key, Basic, OAuth2)
- **Command generation**: Creates CLI commands from OpenAPI paths and operations
- **Tag-based hierarchy**: Organize commands by OpenAPI tags
- **Filtering & Exclusions**: Include or exclude specific APIs using tags or operation IDs
- **Environment variable support**: Inject credentials via environment variables
- **Binary support**: Optimizes file upload and download interfaces
- **Agent-Friendly**: Optimized LLM tool calling export with simplified schemas and semantic search
- **Developer Controls**: Declarative permissions (allow/block), read-only mode, and safety confirmations
- **Conversion Logging**: View key log outputs during the CLI conversion process with the `--logs` flag

## CLI Usage

```bash
Usage: openapi2cli [options] <input>

Convert OpenAPI specifications to executable CLI tools

Arguments:
  input                  OpenAPI specification file (JSON/YAML) or URL

Options:
  -V, --version          output the version number
  -o, --output <dir>     Output directory for generated CLI
  --base-url <url>       Override base URL for API requests
  --name <name>          Name for the generated CLI (default: derived from API title)
  --env-prefix <prefix>  Prefix for environment variables
  --include-tags <tags>  Comma-separated list of tags to include
  --include-ops <ids>    Comma-separated list of operation IDs to include
  --exclude-tags <tags>  Comma-separated list of tags to exclude
  --exclude-ops <ids>    Comma-separated list of operation IDs to exclude
  --group-by-tag         Enable tag-based subcommand hierarchy
  --logs                 Show key log outputs during conversion
  -c, --config <path>    Path to configuration file
  -h, --help             display help for command
```

## Configuration

You can use a `.openapi2cli.yaml` file to customize the generated CLI. Use the `-c, --config <path>` flag to specify your configuration.

```yaml
# Example .openapi2cli.yaml
cliName: my-service-cli
permissions:
  readonly: false
  allow:
    tags: ["users", "pets"]
  block:
    operationIds: ["deleteSensitiveData"]
safety:
  highRiskOperations: ["delete-user"]
  confirmationFlag: force
agent:
  includeExamples: true
```

## System Commands

Each generated CLI includes built-in system commands:

- `search-api <keyword>`: Search for API endpoints by keyword.
- `export-tools-json`: Export API definitions as JSON for LLM tool calling (OpenAI/Claude compatible).

## Installation

```bash
# Install globally
npm install -g openapi2cli

# Or use with npx
npx openapi2cli --help
```

## Quick Start

### 1. Generate CLI from a local JSON file

```bash
openapi2cli ./api.json -o ./my-cli
```

### 2. Set Up the generated CLI

```bash
cd ./my-cli
npm install
npm run build
npm link
```

### 3. Usage

```bash
# Set authentication (Default prefix is API_)
export API_TOKEN="your-token"

# Execute an API call
my-cli get-users --limit 10
```

## Document Menu

- [Architecture & How It Works](docs/architecture.md)
- [Development Guide](docs/development.md)
- [PRD (Product Requirements Document)](PRD.md)

## Contribution Guide

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.
4. Ensure all tests pass.

For more details on local development, see the [Development Guide](docs/development.md).

## License

MIT