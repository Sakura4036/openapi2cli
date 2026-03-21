# CHANGELOG

## [0.1.1] - 2026-03-22

### Added
- **Configuration Support**: Added support for `.openapi2cli.yaml` to customize CLI generation.
- **Agent-Friendly Features**: New `search-api` and `export-tools-json` commands for better LLM integration.
- **Developer Controls**: Implemented `allow`/`block` permission lists and `readonly` mode.
- **Safety**: Added confirmation flags (`--force`) for high-risk operations.
- **Examples**: Automatically extract and display `example` fields from OpenAPI specs in help text.

### Fixed
- **Name Collisions**: Protected built-in system commands from being overwritten by API operations.

## [0.1.0] - 2026-03-21

### Added
- **Core Functionality**: Full support for parsing OpenAPI 3.0 and 3.1 specifications (JSON/YAML/URL).
- **CLI Generation**: Automatically generate feature-rich CLI tools using TypeScript and Commander.js.
- **Tag-based Hierarchy**: Support for organizing commands into subcommands based on OpenAPI tags.
- **Authentication**: Built-in support for Bearer Token, API Key, Basic Auth, OAuth2, and OpenID Connect.
- **Parameter Handling**: Automatic parsing of query, path, and header parameters with environment variable injection support.
- **Binary Support**: Optimized handling for file uploads (multipart/form-data) and file downloads.
- **Advanced Filtering**: Enable/disable specific APIs using tag or operation ID filters.
- **Schema Inspection**: View detailed request and response schemas directly from the generated CLI.
- **Developer Tools**: Includes examples for Petstore and modern OpenAPI 3.1 features, plus a basic test suite.
