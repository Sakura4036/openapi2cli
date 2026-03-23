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

  private log(message: string): void {
    if (this.options.logs) {
      console.log(`[LOG] ${message}`);
    }
  }

  async generate(spec: ParsedOpenAPI): Promise<void> {
    this.log(`Output directory: ${this.options.outputDir}`);

    // Create output directory
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    this.log('Filtering API operations...');
    this.spec = this.filterSpec(spec);

    this.log('Generating package.json...');
    // Generate package.json
    this.generatePackageJson();

    this.log('Generating tsconfig.json...');
    // Generate tsconfig.json
    this.generateTsConfig();

    this.log('Generating main CLI entry point...');
    // Generate main CLI entry point
    this.generateCliEntry();

    this.log('Generating API client...');
    // Generate API client
    this.generateApiClient();

    this.log('Generating commands...');
    // Generate commands
    this.generateCommands();

    this.log('Generating types...');
    // Generate types
    this.generateTypes();

    this.log('Generating bin script...');
    // Generate bin script
    this.generateBinScript();

    this.log('Generation completed.');
  }

  private filterSpec(spec: ParsedOpenAPI): ParsedOpenAPI {
    const permissions = this.options.config?.permissions;
    const filteredPaths = [];

    for (const pathItem of spec.paths) {
      const filteredMethods = [];
      for (const method of pathItem.methods) {
        // 1. Readonly check
        if (permissions?.readonly && method.method.toLowerCase() !== 'get') {
          this.log(`Skipping ${method.method.toUpperCase()} ${pathItem.path} (readonly mode enabled)`);
          continue;
        }

        // 2. Block-list check (Absolute exclusion)
        // CLI options have priority over config
        const blockTags = this.options.excludeTags || permissions?.block?.tags || [];
        const blockOps = this.options.excludeOperationIds || permissions?.block?.operationIds || [];
        const methodTags = method.tags || [];
        
        if (blockTags.some(t => methodTags.includes(t)) || (method.operationId && blockOps.includes(method.operationId))) {
          this.log(`Skipping blocked operation: ${method.operationId || method.method} ${pathItem.path}`);
          continue;
        }

        // 3. Allow-list check (Union of tags and operation IDs)
        // CLI options have priority over config
        const includeTags = this.options.includeTags || permissions?.allow?.tags || [];
        const includeOps = this.options.includeOperationIds || permissions?.allow?.operationIds || [];
        
        const hasAllowList = includeTags.length > 0 || includeOps.length > 0;
        
        if (hasAllowList) {
          const matchesTag = includeTags.length > 0 && methodTags.some(t => includeTags.includes(t));
          const matchesOp = includeOps.length > 0 && method.operationId && includeOps.includes(method.operationId);
          
          if (!matchesTag && !matchesOp) {
            this.log(`Skipping operation not in allow list: ${method.operationId || method.method} ${pathItem.path}`);
            continue;
          }
        }

        this.log(`Including operation: ${method.operationId || method.method} ${pathItem.path}`);
        filteredMethods.push(method);
      }
      
      if (filteredMethods.length > 0) {
        filteredPaths.push({ ...pathItem, methods: filteredMethods });
      }
    }

    return { ...spec, paths: filteredPaths };
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

    const envPrefix = this.options.envPrefix || '';
    const baseUrlEnv = `${envPrefix}API_BASE_URL`;

    // Clone spec and inject command names for system commands
    const specWithCommandNames = {
      ...this.spec,
      paths: this.spec.paths.map(p => ({
        ...p,
        methods: p.methods.map(m => ({
          ...m,
          commandName: this.getCommandName(m)
        }))
      }))
    };
    const specJson = JSON.stringify(specWithCommandNames);

    const indexContent = `#!/usr/bin/env node
import { Command } from 'commander';
import { registerCommands } from './commands';

const program = new Command();

program
  .name('${cliName}')
  .description('${this.spec.info.description || `CLI for ${this.spec.info.title}`}')
  .version('${this.spec.info.version}');

// System command: Search API
program
  .command('search-api')
  .description('Search for API endpoints by keyword')
  .argument('<keyword>', 'Keyword to search for')
  .action((keyword) => {
    const spec = ${specJson};
    console.log(\`Searching for "\${keyword}" in API operations...\\n\`);
    let found = false;
    spec.paths.forEach((p: any) => {
      p.methods.forEach((m: any) => {
        const searchText = \`\${m.commandName} \${m.operationId} \${m.summary || ''} \${m.description || ''} \${(m.tags || []).join(' ')}\`.toLowerCase();
        if (searchText.includes(keyword.toLowerCase())) {
          console.log(\`- \${m.commandName.padEnd(30)} [\${m.method.toUpperCase()}] \${p.path}\`);
          if (m.summary) console.log(\`  Summary: \${m.summary}\`);
          found = true;
        }
      });
    });
    if (!found) console.log('No matching operations found.');
  });

// System command: Export Tools JSON (for LLM Function Calling)
program
  .command('export-tools-json')
  .description('Export API definitions as JSON for LLM tool calling')
  .action(() => {
    const spec = ${specJson};
    
    // Helper to simplify schema for LLM
    const simplifySchema = (schema: any): any => {
      if (!schema) return { type: 'string' };
      
      if (schema.type === 'object' && schema.properties) {
        const properties: any = {};
        for (const [key, prop] of Object.entries(schema.properties)) {
          properties[key] = simplifySchema(prop);
        }
        return {
          type: 'object',
          properties,
          required: schema.required,
          description: schema.description
        };
      }
      
      if (schema.type === 'array' && schema.items) {
        return {
          type: 'array',
          items: simplifySchema(schema.items),
          description: schema.description
        };
      }
      
      return {
        type: schema.type || 'string',
        description: schema.description,
        enum: schema.enum
      };
    };

    const tools = spec.paths.flatMap((p: any) => p.methods.map((m: any) => {
      const properties: any = {};
      const required: string[] = [];
      
      // Map parameters
      m.parameters.forEach((param: any) => {
        properties[param.name] = {
          type: param.type === 'number' ? 'number' : (param.type === 'boolean' ? 'boolean' : 'string'),
          description: param.description || '',
        };
        if (param.required) required.push(param.name);
      });
      
      // Map request body if present
      if (m.requestBody && m.requestBody.schema) {
        const bodySchema = simplifySchema(m.requestBody.schema);
        if (bodySchema.type === 'object' && bodySchema.properties) {
          // Flatten simple objects or keep as 'body'
          properties['body'] = bodySchema;
        } else {
          properties['body'] = bodySchema;
        }
      }

      return {
        type: 'function',
        function: {
          name: m.operationId,
          description: m.summary || m.description || \`Execute \${m.method.toUpperCase()} on \${p.path}\`,
          parameters: {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined,
          },
        },
      };
    }));
    console.log(JSON.stringify(tools, null, 2));
  });

// Create API client with base URL and auth
const baseUrl = process.env.${baseUrlEnv} || '${this.options.baseUrl || this.spec.baseUrl || ''}';

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

    const clientContent = `export interface ApiClientConfig {
  baseUrl: string;
}

export interface RequestOptions {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
  isBinary?: boolean;
}

export async function request(config: ApiClientConfig, options: RequestOptions): Promise<any> {
  const url = new URL(options.path, config.baseUrl.endsWith('/') ? config.baseUrl : config.baseUrl + '/');
  
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.method.toUpperCase() !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  // Add authentication from environment variables
  ${securityConfig.interceptor}

  const response = await fetch(url.toString(), {
    method: options.method.toUpperCase(),
    headers,
    body: (options.body instanceof FormData || options.body?.pipe) 
      ? options.body 
      : (options.body ? JSON.stringify(options.body) : undefined),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(\`API Error: \${response.status} \${response.statusText}\`);
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }

  if (options.isBinary) {
    return response.body;
  }

  return response.json();
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

    const envPrefix = this.options.envPrefix || '';

    for (const scheme of this.spec.securitySchemes) {
      const envVar = `${envPrefix}${scheme.envVarName}`;

      switch (scheme.type) {
        case 'bearer':
          interfaces.push(`// ${scheme.name}: Bearer token authentication`);
          interceptors.push(`
  // ${scheme.name}: Bearer token
  const ${scheme.name}Token = process.env.${envVar};
  if (${scheme.name}Token) {
    headers['Authorization'] = \`Bearer \${${scheme.name}Token}\`;
  }`);
          break;

        case 'apiKey':
          if (scheme.in === 'header' && scheme.paramName) {
            interfaces.push(`// ${scheme.name}: API Key in header (${scheme.paramName})`);
            interceptors.push(`
  // ${scheme.name}: API Key in header
  const ${scheme.name}Key = process.env.${envVar};
  if (${scheme.name}Key) {
    headers['${scheme.paramName}'] = ${scheme.name}Key;
  }`);
          } else if (scheme.in === 'query' && scheme.paramName) {
            interfaces.push(`// ${scheme.name}: API Key in query parameter (${scheme.paramName})`);
            interceptors.push(`
  // ${scheme.name}: API Key in query
  const ${scheme.name}Key = process.env.${envVar};
  if (${scheme.name}Key) {
    url.searchParams.set('${scheme.paramName}', ${scheme.name}Key);
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
    headers['Authorization'] = \`Basic \${credentials}\`;
  }`);
          break;

        case 'oauth2':
        case 'openIdConnect':
          interfaces.push(`// ${scheme.name}: ${scheme.type} authentication`);
          interceptors.push(`
  // ${scheme.name}: ${scheme.type}
  const ${scheme.name}Token = process.env.${envVar};
  if (${scheme.name}Token) {
    headers['Authorization'] = \`Bearer \${${scheme.name}Token}\`;
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

    const allMethods: { path: string; method: ParsedMethod }[] = [];

    for (const pathItem of this.spec.paths) {
      for (const method of pathItem.methods) {
        allMethods.push({ path: pathItem.path, method });
      }
    }

    // Generate index file for commands
    const commandImports: string[] = [];
    const commandRegistrations: string[] = [];

    if (this.options.groupByTag) {
      const tagGroups: Record<string, { path: string; method: ParsedMethod }[]> = {};
      const noTagMethods: { path: string; method: ParsedMethod }[] = [];

      for (const item of allMethods) {
        if (item.method.tags && item.method.tags.length > 0) {
          for (const tag of item.method.tags) {
            if (!tagGroups[tag]) tagGroups[tag] = [];
            tagGroups[tag].push(item);
          }
        } else {
          noTagMethods.push(item);
        }
      }

      for (const [tag, items] of Object.entries(tagGroups)) {
        const tagCmdName = kebabCase(tag);
        const tagVarName = camelCase(tag) + 'Cmd';
        commandRegistrations.push(`  const ${tagVarName} = program.command('${tagCmdName}').description('Commands for ${tag}');`);
        
        for (const item of items) {
          const commandName = this.getCommandName(item.method);
          const commandFile = `${tagCmdName}_${commandName.replace(/-/g, '_')}`;
          
          this.generateCommandFile(commandsDir, item.path, item.method, commandName, commandFile);

          commandImports.push(
            `import { register as register_${commandFile} } from './${commandFile}';`
          );
          commandRegistrations.push(`  register_${commandFile}(${tagVarName}, baseUrl);`);
        }
      }

      for (const item of noTagMethods) {
        const commandName = this.getCommandName(item.method);
        const commandFile = commandName.replace(/-/g, '_');
        this.generateCommandFile(commandsDir, item.path, item.method, commandName, commandFile);

        commandImports.push(
          `import { register as register_${commandFile} } from './${commandFile}';`
        );
        commandRegistrations.push(`  register_${commandFile}(program, baseUrl);`);
      }
    } else {
      for (const item of allMethods) {
        const commandName = this.getCommandName(item.method);
        const commandFile = commandName.replace(/-/g, '_');

        // Generate individual command file
        this.generateCommandFile(commandsDir, item.path, item.method, commandName, commandFile);

        commandImports.push(
          `import { register as register_${commandFile} } from './${commandFile}';`
        );
        commandRegistrations.push(`  register_${commandFile}(program, baseUrl);`);
      }
    }

    const indexContent = `import { Command } from 'commander';
${commandImports.join('\n')}

export function registerCommands(program: Command, baseUrl: string): void {
${commandRegistrations.join('\n')}
}
`;

    fs.writeFileSync(nodePath.join(commandsDir, 'index.ts'), indexContent);
  }

  private generateCommandFile(
    commandsDir: string,
    path: string,
    method: ParsedMethod,
    commandName: string,
    fileNamePrefix?: string
  ): void {
    const fileName = (fileNamePrefix || commandName.replace(/-/g, '_')) + '.ts';
    const filePath = nodePath.join(commandsDir, fileName);

    const pathParams = method.parameters.filter((p) => p.in === 'path');
    const queryParams = method.parameters.filter((p) => p.in === 'query');
    const headerParams = method.parameters.filter((p) => p.in === 'header');

    const isFileUpload = method.requestBody?.contentType === 'multipart/form-data';
    const isBinaryUpload = method.requestBody?.isBinary && !isFileUpload;
    const isBinaryDownload = method.responses.some(r => r.isBinary);

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
    const value = `options.${camelCase(p.name)}`;
    return `        ...(${value} !== undefined ? { ['${p.name}']: ${value} } : {} ),`;
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
${headerParams
  .map((p) => {
    const value = `options.${camelCase(p.name)}`;
    return `        ...(${value} !== undefined ? { ['${p.name}']: ${value} } : {} ),`;
  })
  .join('\n')}
      };`;
    }

    // Build request body
    let bodyBuilder = '';
    if (isFileUpload) {
      bodyBuilder = `
      const body = new FormData();
      if (options.body) {
        const bodyObj = JSON.parse(options.body);
        for (const [key, value] of Object.entries(bodyObj)) {
          body.append(key, value as any);
        }
      }
      if (options.file) {
        const fs = await import('fs');
        const { blob } = await import('node:stream/consumers');
        const fileStream = fs.createReadStream(options.file);
        // In Node 18+ fetch supports Blob/File in FormData
        body.append('file', await blob(fileStream) as any, options.file);
      }`;
    } else if (isBinaryUpload) {
      bodyBuilder = `
      const fs = await import('fs');
      const body = options.file ? fs.createReadStream(options.file) : (options.body ? JSON.parse(options.body) : undefined);`;
    } else if (method.requestBody) {
      bodyBuilder = `
      const body = options.body ? JSON.parse(options.body) : undefined;`;
    }

    // Build the command options
    const options: string[] = [];
    for (const param of method.parameters) {
      const flagName = kebabCase(param.name);

      if (param.in === 'path' || param.required) {
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
      if (isFileUpload || isBinaryUpload) {
        options.push(`  .option('--file <path>', 'File to upload')`);
      }
    }

    if (isBinaryDownload) {
      options.push(`  .option('--output-file <path>', 'Save response to file')`);
    }

    // Common options
    options.push(`  .option('--base-url <url>', 'Override base URL')`);
    options.push(`  .option('--output <format>', 'Output format: json, table', 'json')`);
    options.push(`  .option('--schema', 'Show API schema and exit')`);

    // Safety confirmation for high-risk operations
    const highRiskOps = this.options.config?.safety?.highRiskOperations || [];
    const isHighRisk = highRiskOps.includes(method.operationId || '') || highRiskOps.includes(commandName);
    const confirmationFlag = this.options.config?.safety?.confirmationFlag || 'force';
    if (isHighRisk) {
      options.push(`  .option('--${confirmationFlag}', 'Confirm execution of high-risk operation')`);
    }

    // Build examples for help text
    let helpText = '';
    if (this.options.config?.agent?.includeExamples) {
      const examples: string[] = [];
      if (method.example) examples.push(`Example response: ${JSON.stringify(method.example)}`);
      if (method.examples && method.examples.length > 0) {
        method.examples.forEach((ex, i) => examples.push(`Example ${i + 1}: ${JSON.stringify(ex)}`));
      }
      
      // Parameter examples
      const paramExamples = method.parameters
        .filter(p => p.example !== undefined)
        .map(p => `  --${kebabCase(p.name)} ${p.example}`);
      
      if (paramExamples.length > 0) {
        examples.push(`Usage example:\n  $ ${this.options.cliName || 'api'} ${commandName} ${paramExamples.join(' ')}`);
      }

      if (examples.length > 0) {
        helpText = `\n    .addHelpText('after', \`\\n\${${JSON.stringify(examples.join('\n'))}}\`)`;
      }
    }

    const content = `import { Command } from 'commander';
import { request, buildPath, buildQuery } from '../client';
${isBinaryDownload ? "import { Readable } from 'node:stream';" : ''}

export function register(program: Command, baseUrl: string): void {
  program
    .command('${commandName}')
    .description('${method.summary || `Execute ${method.method.toUpperCase()} on ${path}`}')${helpText}
${options.join('\n')}
    .action(async (options) => {
      if (options.schema) {
        console.log(JSON.stringify(${JSON.stringify(method, null, 2)}, null, 2));
        return;
      }

      ${isHighRisk ? `
      if (!options.${camelCase(confirmationFlag)}) {
        console.error('Error: This is a high-risk operation. Use --${confirmationFlag} to confirm.');
        process.exit(1);
      }
      ` : ''}

      try {
        const currentBaseUrl = options.baseUrl || baseUrl;
        const config = { baseUrl: currentBaseUrl };
${pathBuilder}
${queryBuilder}
${headerBuilder}
${bodyBuilder}
      
      const response = await request(config, {
        method: '${method.method}',
        path: url,
        headers: ${headerParams.length > 0 ? 'customHeaders' : 'undefined'},
        body: ${method.requestBody ? 'body' : 'undefined'},
        isBinary: ${isBinaryDownload ? 'true' : 'false'},
      });

      ${
        isBinaryDownload
          ? `if (options.outputFile) {
        const fs = await import('fs');
        const { finished } = await import('node:stream/promises');
        const fileStream = fs.createWriteStream(options.outputFile);
        await finished(Readable.fromWeb(response as any).pipe(fileStream));
        console.log(\`File saved to \${options.outputFile}\`);
        return;
      }`
          : ''
      }

      const data = response;
      if (options.output === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(data);
      }
    } catch (error: any) {
      if (error.status) {
        console.error('API Error:', error.status, error.message);
        if (error.data) {
          console.error(JSON.stringify(error.data, null, 2));
        }
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
    const reservedCommands = ['search-api', 'export-tools-json', 'help', 'version'];
    let name = '';
    if (method.operationId) {
      name = kebabCase(method.operationId);
    } else {
      name = `${method.method}-operation`;
    }

    if (reservedCommands.includes(name)) {
      return `${name}-api`;
    }
    return name;
  }
}