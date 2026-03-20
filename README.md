# openapi2cli

A CLI tool that converts OpenAPI specifications (JSON/YAML) into executable CLI tools.

## Features

- **Multiple input sources**: Local JSON files, YAML files, or URLs
- **TypeScript output**: Generates clean, type-safe TypeScript code
- **Auto authentication**: Automatically detects and configures security schemes (Bearer, API Key, Basic)
- **Command generation**: Creates CLI commands from OpenAPI paths and operations
- **Environment variable support**: Inject credentials via environment variables

## Installation

```bash
# Install globally
npm install -g openapi2cli

# Or use with npx
npx openapi2cli --help
```

## Usage

### Basic Usage

```bash
# Generate CLI from a local JSON file
openapi2cli ./api.json -o ./my-cli

# Generate CLI from a local YAML file
openapi2cli ./openapi.yaml -o ./my-cli

# Generate CLI from a URL
openapi2cli https://api.example.com/openapi.json -o ./my-cli
```

### Options

| Option | Description |
|--------|-------------|
| `<input>` | OpenAPI specification file (JSON/YAML) or URL |
| `-o, --output <dir>` | Output directory for generated CLI (required) |
| `--base-url <url>` | Override base URL for API requests |
| `--name <name>` | Name for the generated CLI (default: derived from API title) |
| `--env-prefix <prefix>` | Prefix for environment variables |
| `-h, --help` | Show help information |
| `-V, --version` | Show version number |

### Examples

```bash
# Generate a CLI named "petstore" from Petstore API
openapi2cli https://petstore.swagger.io/v2/swagger.json -o ./petstore-cli --name petstore

# Generate CLI with custom base URL
openapi2cli ./api.yaml -o ./my-api --base-url https://api.production.com

# Generate CLI with custom environment prefix
openapi2cli ./api.json -o ./my-cli --env-prefix MY_API
```

## Generated CLI Usage

After generating a CLI, you need to install dependencies and build:

```bash
cd ./my-cli
npm install
npm run build

# Optionally, install globally
npm link
```

### Setting Up Authentication

The generated CLI automatically detects authentication requirements from the OpenAPI spec and uses environment variables:

```bash
# For Bearer token authentication
export API_TOKEN="your-bearer-token"

# For API Key authentication
export API_KEY_TOKEN="your-api-key"

# For Basic authentication
export API_USERNAME="your-username"
export API_PASSWORD="your-password"
```

You can also override the base URL:

```bash
export API_BASE_URL="https://custom-api.example.com"
```

### Running Commands

```bash
# Show help
my-cli --help

# List available commands
my-cli --help

# Execute an API call
my-cli get-users --limit 10
my-cli get-user --user-id 123
my-cli create-user --name "John" --email "john@example.com"

# Override base URL for a single command
my-cli get-users --base-url https://staging.api.com

# Output in different formats
my-cli get-users --output json
```

## How It Works

1. **Parsing**: The tool parses the OpenAPI specification using `@apidevtools/swagger-parser`
2. **Analysis**: It extracts:
   - API info (title, version, description)
   - Servers (base URLs)
   - Security schemes (authentication methods)
   - Paths and operations (endpoints)
   - Parameters (path, query, header)
   - Request bodies
   - Responses

3. **Generation**: It generates:
   - `package.json` - Project configuration
   - `tsconfig.json` - TypeScript configuration
   - `src/index.ts` - CLI entry point
   - `src/client.ts` - API client with authentication
   - `src/commands/` - Individual command files
   - `src/types.ts` - Type definitions
   - `bin/cli.js` - Executable script

## Supported Authentication Types

| Type | Environment Variable | Description |
|------|---------------------|-------------|
| Bearer | `<SCHEME_NAME>_TOKEN` | HTTP Bearer token |
| API Key (Header) | `<SCHEME_NAME>_TOKEN` | API key in header |
| API Key (Query) | `<SCHEME_NAME>_TOKEN` | API key in query parameter |
| Basic | `<SCHEME_NAME>_USERNAME`, `<SCHEME_NAME>_PASSWORD` | HTTP Basic auth |

## Development

```bash
# Clone the repository
git clone https://github.com/your-org/openapi2cli.git
cd openapi2cli

# Install dependencies
npm install

# Build
npm run build

# Run locally
node bin/openapi2cli.js --help

# Run in development mode
npm run dev
```

## Project Structure

```
openapi2cli/
├── src/
│   ├── index.ts          # Library exports
│   ├── cli.ts            # CLI command handling
│   ├── parser.ts         # OpenAPI parsing logic
│   ├── types.ts          # Type definitions
│   └── generator/
│       └── typescript.ts # TypeScript code generator
├── bin/
│   └── openapi2cli.js    # CLI entry script
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT