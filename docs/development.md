# Development Guide

Guidelines for contributing to `openapi2cli` and setting up a local development environment.

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sakura4036/openapi2cli.git
   cd openapi2cli
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

## Project Structure

```
openapi2cli/
├── src/
│   ├── index.ts          # Library entry point
│   ├── cli.ts            # Main CLI logic for openapi2cli itself
│   ├── parser.ts         # OpenAPI parsing and metadata extraction
│   ├── types.ts          # Shared type definitions
│   └── generator/
│       └── typescript.ts # TypeScript code generator implementation
├── tests/                # Unit and integration tests
├── bin/
│   └── openapi2cli.js    # CLI entry script (compiled)
├── examples/             # Example OpenAPI specifications for testing
├── docs/                 # Documentation
├── package.json
└── tsconfig.json
```

## Development Commands

- `npm run dev`: Run the project in development mode using `ts-node`.
- `npm run watch`: Automatically recompile on changes.
- `npm test`: Run tests using Jest.
- `npm run lint`: Check code style.

## Adding New Features

1. If adding support for a new OpenAPI feature, update `src/types.ts` first.
2. Modify `src/parser.ts` to extract the necessary information.
3. Update `src/generator/typescript.ts` to generate the corresponding code in the target CLI.
4. Add a test case in `tests/` to verify the new functionality.
