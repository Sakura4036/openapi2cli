import * as fs from 'fs';
import * as nodePath from 'path';
import { camelCase, kebabCase, upperFirst, snakeCase } from 'lodash';
import { ParsedOpenAPI, GeneratorOptions, ParsedMethod, ParsedParameter } from '../types';

export class TypeScriptGenerator {
  private options: GeneratorOptions;
  private spec: ParsedOpenAPI | null = null;

  constructor(options: GeneratorOptions) {
    this.options = options;
  }

  async generate(spec: ParsedOpenAPI): Promise<void> {
    this.spec = spec;

    // Create output directory
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Generate package.json
    this.generatePackageJson();

    // Generate tsconfig.json
    this.generateTsConfig();

    // Generate main CLI entry point
    this.generateCliEntry();

    // Generate API client
    this.generateApiClient();

    // Generate commands
    this.generateCommands();

    // Generate types
    this.generateTypes();

    // Generate bin script
    this.generateBinScript();
  }

  private generatePackageJson(): void {
    if (!this.spec) return;

    const cliName = this.options.cliName || kebabCase(this.spec.info.title);
    const packageJson = {
      name: cliName,
      version: '1.0.0',
      description: this.spec.info.description || `CLI for ${this.spec.info.title}`,
      main: 'dist/index.js',
      bin: {
        [cliName]: './bin/cli.js',
      },
      scripts: {
        build: 'tsc',
        start: 'node dist/index.js',
      },
      dependencies: {
        commander: '^12.0.0',
        axios: '^1.6.0',
      },
      devDependencies: {
        '@types/node': '^20.10.0',
        typescript: '^5.3.0',
      },
    };

    fs.writeFileSync(
      nodePath.join(this.options.outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  private generateTsConfig(): void {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'commonjs',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    };

    fs.writeFileSync(
      nodePath.join(this.options.outputDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  private generateBinScript(): void {
    const binDir = nodePath.join(this.options.outputDir, 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    const binScript = `#!/usr/bin/env node
require('../dist/index.js');
`;

    fs.writeFileSync(nodePath.join(binDir, 'cli.js'), binScript);
    fs.chmodSync(nodePath.join(binDir, 'cli.js'), '755');
  }

  private generateCliEntry(): void {
    if (!this.spec) return;

    const srcDir = nodePath.join(this.options.outputDir, 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    const cliName = this.options.cliName || kebabCase(this.spec.info.title);

    const indexContent = `#!/usr/bin/env node
import { Command } from 'commander';
import { registerCommands } from './commands';
import { createApiClient } from './client';

const program = new Command();

program
  .name('${cliName}')
  .description('${this.spec.info.description || `CLI for ${this.spec.info.title}`}')
  .version('${this.spec.info.version}');

// Create API client with base URL and auth
const baseUrl = process.env.API_BASE_URL || '${this.options.baseUrl || this.spec.baseUrl || ''}';

// Register all commands
registerCommands(program, baseUrl);

program.parse();
`;

    fs.writeFileSync(nodePath.join(srcDir, 'index.ts'), indexContent);
  }

  private generateApiClient(): void {
    if (!this.spec) return;

    const srcDir = nodePath.join(this.options.outputDir, 'src');

    const securityConfig = this.generateSecurityConfig();
    const envPrefix = this.options.envPrefix || '';

    const clientContent = `import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

${securityConfig.interface}

export interface ApiClientConfig {
  baseUrl: string;
  ${securityConfig.configProps}
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add authentication interceptor
  client.interceptors.request.use((requestConfig) => {
    ${securityConfig.interceptor}
    return requestConfig;
  });

  return client;
}

// Helper to handle path parameters
export function buildPath(template: string, params: Record<string, any>): string {
  return template.replace(/\\{(\\w+)\\}/g, (_, key) => {
    if (params[key] === undefined) {
      throw new Error(\`Missing path parameter: \${key}\`);
    }
    return encodeURIComponent(String(params[key]));
  });
}

// Helper to build query string
export function buildQuery(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  }
  return searchParams.toString();
}
`;

    fs.writeFileSync(nodePath.join(srcDir, 'client.ts'), clientContent);
  }

  private generateSecurityConfig(): {
    interface: string;
    configProps: string;
    interceptor: string;
  } {
    if (!this.spec?.securitySchemes.length) {
      return {
        interface: '// No security schemes defined',
        configProps: '',
        interceptor: '// No authentication configured',
      };
    }

    const interfaces: string[] = [];
    const props: string[] = [];
    const interceptors: string[] = [];

    for (const scheme of this.spec.securitySchemes) {
      const envVar = scheme.envVarName;

      switch (scheme.type) {
        case 'bearer':
          interfaces.push(`// ${scheme.name}: Bearer token authentication`);
          interceptors.push(`
    // ${scheme.name}: Bearer token
    const ${scheme.name}Token = process.env.${envVar};
    if (${scheme.name}Token) {
      requestConfig.headers = requestConfig.headers || {};
      requestConfig.headers['Authorization'] = \`Bearer \${${scheme.name}Token}\`;
    }`);
          break;

        case 'apiKey':
          if (scheme.in === 'header' && scheme.paramName) {
            interfaces.push(`// ${scheme.name}: API Key in header (${scheme.paramName})`);
            interceptors.push(`
    // ${scheme.name}: API Key in header
    const ${scheme.name}Key = process.env.${envVar};
    if (${scheme.name}Key) {
      requestConfig.headers = requestConfig.headers || {};
      requestConfig.headers['${scheme.paramName}'] = ${scheme.name}Key;
    }`);
          } else if (scheme.in === 'query' && scheme.paramName) {
            interfaces.push(`// ${scheme.name}: API Key in query parameter (${scheme.paramName})`);
            interceptors.push(`
    // ${scheme.name}: API Key in query
    const ${scheme.name}Key = process.env.${envVar};
    if (${scheme.name}Key && requestConfig.params) {
      requestConfig.params['${scheme.paramName}'] = ${scheme.name}Key;
    } else if (${scheme.name}Key) {
      requestConfig.params = { '${scheme.paramName}': ${scheme.name}Key };
    }`);
          }
          break;

        case 'basic':
          interfaces.push(`// ${scheme.name}: Basic authentication`);
          interceptors.push(`
    // ${scheme.name}: Basic auth
    const ${scheme.name}Username = process.env.${envVar};
    const ${scheme.name}Password = process.env.${envVar.replace('_TOKEN', '_PASSWORD')};
    if (${scheme.name}Username && ${scheme.name}Password) {
      const credentials = Buffer.from(\`\${${scheme.name}Username}:\${${scheme.name}Password}\`).toString('base64');
      requestConfig.headers = requestConfig.headers || {};
      requestConfig.headers['Authorization'] = \`Basic \${credentials}\`;
    }`);
          break;
      }
    }

    return {
      interface: interfaces.join('\n'),
      configProps: props.join('\n  '),
      interceptor: interceptors.join('\n'),
    };
  }

  private generateCommands(): void {
    if (!this.spec) return;

    const srcDir = nodePath.join(this.options.outputDir, 'src');
    const commandsDir = nodePath.join(srcDir, 'commands');

    if (!fs.existsSync(commandsDir)) {
      fs.mkdirSync(commandsDir, { recursive: true });
    }

    // Generate index file for commands
    const commandImports: string[] = [];
    const commandRegistrations: string[] = [];

    for (const pathItem of this.spec.paths) {
      for (const method of pathItem.methods) {
        const commandName = this.getCommandName(method);
        const commandFile = commandName.replace(/-/g, '_');

        // Generate individual command file
        this.generateCommandFile(commandsDir, pathItem.path, method, commandName);

        commandImports.push(
          `import { register as register_${commandFile} } from './${commandFile}';`
        );
        commandRegistrations.push(`  register_${commandFile}(program, client);`);
      }
    }

    const indexContent = `import { Command } from 'commander';
import { createApiClient } from '../client';
${commandImports.join('\n')}

export function registerCommands(program: Command, baseUrl: string): void {
  const client = createApiClient({ baseUrl });

${commandRegistrations.join('\n')}
}
`;

    fs.writeFileSync(nodePath.join(commandsDir, 'index.ts'), indexContent);
  }

  private generateCommandFile(
    commandsDir: string,
    path: string,
    method: ParsedMethod,
    commandName: string
  ): void {
    const fileName = commandName.replace(/-/g, '_') + '.ts';
    const filePath = nodePath.join(commandsDir, fileName);

    const pathParams = method.parameters.filter((p) => p.in === 'path');
    const queryParams = method.parameters.filter((p) => p.in === 'query');
    const headerParams = method.parameters.filter((p) => p.in === 'header');

    // Build path with parameters
    const pathTemplate = path;
    let pathBuilder = '';

    if (pathParams.length > 0) {
      pathBuilder = `const pathParams = {
${pathParams.map((p) => `        ${camelCase(p.name)}: options.${camelCase(p.name)},`).join('\n')}
      };
      const path = buildPath('${pathTemplate}', pathParams);`;
    } else {
      pathBuilder = `const path = '${pathTemplate}';`;
    }

    // Build query parameters
    let queryBuilder = '';
    if (queryParams.length > 0) {
      queryBuilder = `
      const queryParams = {
${queryParams
  .map((p) => {
    const conditional = p.required ? '' : `if (options.${camelCase(p.name)} !== undefined) `;
    return `        ${conditional}['${p.name}']: options.${camelCase(p.name)},`;
  })
  .join('\n')}
      };
      const queryString = buildQuery(queryParams);
      const url = queryString ? \`\${path}?\${queryString}\` : path;`;
    } else {
      queryBuilder = 'const url = path;';
    }

    // Build headers
    let headerBuilder = '';
    if (headerParams.length > 0) {
      headerBuilder = `
      const customHeaders: Record<string, string> = {
${headerParams.map((p) => `        '${p.name}': options.${camelCase(p.name)},`).join('\n')}
      };`;
    }

    // Build request body
    let bodyBuilder = '';
    if (method.requestBody) {
      bodyBuilder = `
      const body = options.body ? JSON.parse(options.body) : undefined;`;
    }

    // Build the command options
    const options: string[] = [];
    for (const param of method.parameters) {
      const paramName = camelCase(param.name);
      const flagName = kebabCase(param.name);
      const required = param.required;

      if (param.in === 'path') {
        options.push(
          `  .requiredOption('--${flagName} <value>', '${param.description || param.name}')`
        );
      } else if (param.required) {
        options.push(
          `  .requiredOption('--${flagName} <value>', '${param.description || param.name}')`
        );
      } else {
        options.push(`  .option('--${flagName} <value>', '${param.description || param.name}')`);
      }
    }

    if (method.requestBody) {
      options.push(
        `  .option('--body <json>', 'Request body as JSON string', (value) => value)`
      );
    }

    // Common options
    options.push(`  .option('--base-url <url>', 'Override base URL')`);
    options.push(`  .option('--output <format>', 'Output format: json, table', 'json')`);

    const content = `import { Command } from 'commander';
import { AxiosInstance } from 'axios';
import { buildPath, buildQuery } from '../client';

export function register(program: Command, client: AxiosInstance): void {
  program
    .command('${commandName}')
    .description('${method.summary || `Execute ${method.method.toUpperCase()} on ${path}`}')
${options.join('\n')}
    .action(async (options) => {
      try {
${pathBuilder}
${queryBuilder}
${headerBuilder}
${bodyBuilder}

        const baseUrl = options.baseUrl || client.defaults.baseURL;
        const requestClient = options.baseUrl
          ? require('../client').createApiClient({ baseUrl })
          : client;

        const response = await requestClient.${method.method}(url${method.requestBody ? ', body' : ''}${headerBuilder ? ', { headers: customHeaders }' : ''});

        if (options.output === 'json') {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          console.log(response.data);
        }
      } catch (error: any) {
        if (error.response) {
          console.error('API Error:', error.response.status, error.response.statusText);
          console.error(JSON.stringify(error.response.data, null, 2));
        } else {
          console.error('Error:', error.message);
        }
        process.exit(1);
      }
    });
}
`;

    fs.writeFileSync(filePath, content);
  }

  private generateTypes(): void {
    if (!this.spec) return;

    const srcDir = nodePath.join(this.options.outputDir, 'src');

    // For MVP, generate basic types. In future versions, this could extract
    // types from the OpenAPI schema definitions
    const typesContent = `// Auto-generated types from OpenAPI specification
// This file contains type definitions for API responses and requests

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiError {
  message: string;
  status: number;
  statusText: string;
  data?: any;
}

// Placeholder for generated types from schemas
// In future versions, this will include types extracted from components.schemas
`;

    fs.writeFileSync(nodePath.join(srcDir, 'types.ts'), typesContent);
  }

  private getCommandName(method: ParsedMethod): string {
    if (method.operationId) {
      return kebabCase(method.operationId);
    }
    return `${method.method}-operation`;
  }
}