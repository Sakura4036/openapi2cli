# CHANGELOG
 
## [0.1.7] - 2026-03-26

### Fixed
- **Version Reporting**: Dynamically read version from `package.json` in CLI help output instead of a hardcoded string.

## [0.1.6] - 2026-03-26

### Fixed
- **Publish Pipeline**: Added `prepublishOnly` script to ensure `npm run build` is automatically executed before publishing, fixing the issue where published NPM packages contained outdated `dist/` builds.

## [0.1.5] - 2026-03-26

### Fixed
- **Build Sync**: Ensured `dist/` is correctly synchronized with `src/` to resolve tag filtering discrepancy in NPM release.
- **Filtering Logic**: Verified robustness of case-insensitive tag and operation ID matching.

## [0.1.4] - 2026-03-26

### Added
- **Conversion Logs**: Added `--logs` flag to display key log outputs during the CLI generation process for better transparency and debugging.
- **Filtering Robustness**: 
  - Implemented case-insensitive matching for tags and operation IDs in include/exclude filters.
  - Added automatic whitespace trimming for comma-separated CLI filter values.
- **Validation**: Added a new test suite for filtering logic robustness.

## [0.1.3] - 2026-03-24

### Added
- **Standardized Environment Variables**: Implemented default `API_` prefix for environment variables if none provided.
- **Naming Convention**: Enforced uppercase and underscore-separated naming for all environment variable prefixes.
- **Auth Suffixes**: Standardized authentication variable suffixes to `_TOKEN` or `_KEY` for better predictability.

## [0.1.2] - 2026-03-23

### Added
- **OpenAPI V2/V3 Support**: Enhanced support for Swagger 2.0 and OpenAPI 3.0/3.1 robustly.
- **Advanced Filtering**: New `--exclude-tags` and `--exclude-ops` options to skip specific APIs.
- **Optimized Tools Export**: Simplified JSON schema for `export-tools-json` to save LLM context tokens and improve compatibility.

### Improved
- **Parser**: Better handling of path-level parameters and security scheme mapping.


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
