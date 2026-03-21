# openapi2cli

A CLI tool that converts OpenAPI specifications (JSON/YAML) into executable CLI tools.

[![npm version](https://img.shields.io/npm/v/openapi2cli.svg)](https://www.npmjs.com/package/openapi2cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Multiple input sources**: Local JSON files, YAML files, or URLs
- **TypeScript output**: Generates clean, type-safe TypeScript code
- **Auto authentication**: Automatically detects and configures security schemes (Bearer, API Key, Basic, OAuth2)
- **Command generation**: Creates CLI commands from OpenAPI paths and operations
- **Tag-based hierarchy**: Organize commands by OpenAPI tags
- **Environment variable support**: Inject credentials via environment variables
- **Binary support**: Optimizes file upload and download interfaces
- **Agent-Friendly**: Built-in support for LLM tool calling export and semantic search
- **Developer Controls**: Declarative permissions (allow/block), read-only mode, and safety confirmations

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
# Set authentication
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