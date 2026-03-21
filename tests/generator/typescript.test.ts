import * as fs from 'fs';
import * as path from 'path';
import { TypeScriptGenerator } from '../../src/generator/typescript';
import { ParsedOpenAPI } from '../../src/types';

// Helper to create a temporary directory for tests
const createTempDir = (): string => {
  const tempDir = path.join(__dirname, 'temp-output-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
};

// Helper to clean up temporary directory
const cleanupTempDir = (dir: string): void => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

// Mock OpenAPI spec for testing
const mockParsedSpec: ParsedOpenAPI = {
  info: {
    title: 'Test API',
    description: 'A test API for unit testing',
    version: '1.0.0',
  },
  baseUrl: 'https://api.test.com/v1',
  servers: [
    { url: 'https://api.test.com/v1', description: 'Production' },
  ],
  securitySchemes: [
    {
      name: 'bearerAuth',
      type: 'bearer',
      description: 'Bearer token authentication',
      envVarName: 'BEARER_AUTH_TOKEN',
    },
    {
      name: 'apiKeyHeader',
      type: 'apiKey',
      in: 'header',
      paramName: 'X-API-Key',
      envVarName: 'API_KEY_HEADER_TOKEN',
    },
    {
      name: 'apiKeyQuery',
      type: 'apiKey',
      in: 'query',
      paramName: 'api_key',
      envVarName: 'API_KEY_QUERY_TOKEN',
    },
    {
      name: 'basicAuth',
      type: 'basic',
      envVarName: 'BASIC_AUTH_TOKEN',
    },
  ],
  paths: [
    {
      path: '/users',
      methods: [
        {
          method: 'get',
          operationId: 'listUsers',
          summary: 'List all users',
          description: 'Returns a list of users',
          tags: ['users'],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              required: false,
              description: 'Maximum number of results',
              type: 'integer',
            },
            {
              name: 'offset',
              in: 'query',
              required: false,
              description: 'Number of results to skip',
              type: 'integer',
            },
          ],
          responses: [
            { statusCode: '200', description: 'A list of users' },
          ],
        },
        {
          method: 'post',
          operationId: 'createUser',
          summary: 'Create a new user',
          tags: ['users'],
          parameters: [],
          requestBody: {
            required: true,
            contentType: 'application/json',
          },
          responses: [
            { statusCode: '201', description: 'User created' },
          ],
        },
      ],
    },
    {
      path: '/users/{userId}',
      methods: [
        {
          method: 'get',
          operationId: 'getUser',
          summary: 'Get a user by ID',
          tags: ['users'],
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              description: 'User ID',
              type: 'string',
            },
          ],
          responses: [
            { statusCode: '200', description: 'User details' },
            { statusCode: '404', description: 'User not found' },
          ],
        },
        {
          method: 'put',
          operationId: 'updateUser',
          summary: 'Update a user',
          tags: ['users'],
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              type: 'string',
            },
          ],
          requestBody: {
            required: true,
            contentType: 'application/json',
          },
          responses: [
            { statusCode: '200', description: 'User updated' },
          ],
        },
        {
          method: 'delete',
          operationId: 'deleteUser',
          summary: 'Delete a user',
          tags: ['users'],
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              type: 'string',
            },
          ],
          responses: [
            { statusCode: '204', description: 'User deleted' },
          ],
        },
      ],
    },
    {
      path: '/items/{itemId}/reviews/{reviewId}',
      methods: [
        {
          method: 'get',
          operationId: 'getReview',
          summary: 'Get a review',
          parameters: [
            { name: 'itemId', in: 'path', required: true, type: 'string' },
            { name: 'reviewId', in: 'path', required: true, type: 'string' },
          ],
          responses: [
            { statusCode: '200', description: 'Review details' },
          ],
        },
      ],
    },
  ],
};

const minimalSpec: ParsedOpenAPI = {
  info: {
    title: 'Minimal API',
    version: '1.0.0',
  },
  securitySchemes: [],
  paths: [
    {
      path: '/health',
      methods: [
        {
          method: 'get',
          operationId: 'healthCheck',
          parameters: [],
          responses: [
            { statusCode: '200', description: 'OK' },
          ],
        },
      ],
    },
  ],
};

describe('TypeScriptGenerator', () => {
  let tempDir: string;
  let generator: TypeScriptGenerator;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('generate', () => {
    it('should create output directory', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      expect(fs.existsSync(tempDir)).toBe(true);
    });

    it('should generate package.json', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const packageJsonPath = path.join(tempDir, 'package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.name).toBe('test-api');
      expect(packageJson.version).toBe('1.0.0');
      expect(packageJson.description).toBe('A test API for unit testing');
      expect(packageJson.dependencies).toHaveProperty('commander');
      expect(packageJson.dependencies).toHaveProperty('axios');
    });

    it('should use custom CLI name in package.json', async () => {
      generator = new TypeScriptGenerator({
        outputDir: tempDir,
        cliName: 'my-custom-cli',
      });
      await generator.generate(mockParsedSpec);

      const packageJsonPath = path.join(tempDir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.name).toBe('my-custom-cli');
      expect(packageJson.bin).toHaveProperty('my-custom-cli');
    });

    it('should generate tsconfig.json', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const tsconfigPath = path.join(tempDir, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions.target).toBe('ES2022');
      expect(tsconfig.compilerOptions.module).toBe('commonjs');
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('should generate bin/cli.js', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const binPath = path.join(tempDir, 'bin', 'cli.js');
      expect(fs.existsSync(binPath)).toBe(true);

      const binContent = fs.readFileSync(binPath, 'utf-8');
      expect(binContent).toContain('#!/usr/bin/env node');
    });

    it('should generate src/index.ts', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const indexPath = path.join(tempDir, 'src', 'index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);

      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).toContain("import { Command } from 'commander'");
      expect(indexContent).toContain('.name(\'test-api\')');
    });

    it('should use custom base URL in generated code', async () => {
      generator = new TypeScriptGenerator({
        outputDir: tempDir,
        baseUrl: 'https://custom.api.com',
      });
      await generator.generate(mockParsedSpec);

      const indexPath = path.join(tempDir, 'src', 'index.ts');
      const indexContent = fs.readFileSync(indexPath, 'utf-8');

      expect(indexContent).toContain('https://custom.api.com');
    });

    it('should generate src/client.ts', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const clientPath = path.join(tempDir, 'src', 'client.ts');
      expect(fs.existsSync(clientPath)).toBe(true);

      const clientContent = fs.readFileSync(clientPath, 'utf-8');
      expect(clientContent).toContain('import axios');
      expect(clientContent).toContain('createApiClient');
      expect(clientContent).toContain('buildPath');
      expect(clientContent).toContain('buildQuery');
    });

    it('should include security configuration in client.ts', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const clientPath = path.join(tempDir, 'src', 'client.ts');
      const clientContent = fs.readFileSync(clientPath, 'utf-8');

      expect(clientContent).toContain('BEARER_AUTH_TOKEN');
      expect(clientContent).toContain('API_KEY_HEADER_TOKEN');
      expect(clientContent).toContain('Authorization');
      expect(clientContent).toContain('X-API-Key');
    });

    it('should generate src/types.ts', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const typesPath = path.join(tempDir, 'src', 'types.ts');
      expect(fs.existsSync(typesPath)).toBe(true);

      const typesContent = fs.readFileSync(typesPath, 'utf-8');
      expect(typesContent).toContain('ApiResponse');
      expect(typesContent).toContain('ApiError');
    });
  });

  describe('Command Generation', () => {
    it('should generate commands directory', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const commandsDir = path.join(tempDir, 'src', 'commands');
      expect(fs.existsSync(commandsDir)).toBe(true);
    });

    it('should generate commands/index.ts', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const commandsIndexPath = path.join(tempDir, 'src', 'commands', 'index.ts');
      expect(fs.existsSync(commandsIndexPath)).toBe(true);

      const content = fs.readFileSync(commandsIndexPath, 'utf-8');
      expect(content).toContain("import { Command } from 'commander'");
      expect(content).toContain('registerCommands');
    });

    it('should generate command files for each operation', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const commandsDir = path.join(tempDir, 'src', 'commands');

      // Check for generated command files (file names use underscores)
      expect(fs.existsSync(path.join(commandsDir, 'list_users.ts'))).toBe(true);
      expect(fs.existsSync(path.join(commandsDir, 'create_user.ts'))).toBe(true);
      expect(fs.existsSync(path.join(commandsDir, 'get_user.ts'))).toBe(true);
      expect(fs.existsSync(path.join(commandsDir, 'update_user.ts'))).toBe(true);
      expect(fs.existsSync(path.join(commandsDir, 'delete_user.ts'))).toBe(true);
      expect(fs.existsSync(path.join(commandsDir, 'get_review.ts'))).toBe(true);
    });

    it('should generate command with query parameters', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const commandPath = path.join(tempDir, 'src', 'commands', 'list_users.ts');
      const content = fs.readFileSync(commandPath, 'utf-8');

      expect(content).toContain('--limit <value>');
      expect(content).toContain('--offset <value>');
      expect(content).toContain('buildQuery');
    });

    it('should generate command with path parameters', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const commandPath = path.join(tempDir, 'src', 'commands', 'get_user.ts');
      const content = fs.readFileSync(commandPath, 'utf-8');

      expect(content).toContain('--user-id <value>');
      expect(content).toContain('buildPath');
    });

    it('should generate command with request body', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const commandPath = path.join(tempDir, 'src', 'commands', 'create_user.ts');
      const content = fs.readFileSync(commandPath, 'utf-8');

      expect(content).toContain('--body <json>');
      expect(content).toContain('JSON.parse');
    });

    it('should generate command with multiple path parameters', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const commandPath = path.join(tempDir, 'src', 'commands', 'get_review.ts');
      const content = fs.readFileSync(commandPath, 'utf-8');

      expect(content).toContain('--item-id');
      expect(content).toContain('--review-id');
    });

    it('should include common options in commands', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const commandPath = path.join(tempDir, 'src', 'commands', 'list_users.ts');
      const content = fs.readFileSync(commandPath, 'utf-8');

      expect(content).toContain('--base-url <url>');
      expect(content).toContain('--output <format>');
    });
  });

  describe('Minimal Spec', () => {
    it('should generate code for spec without security schemes', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(minimalSpec);

      const clientPath = path.join(tempDir, 'src', 'client.ts');
      const clientContent = fs.readFileSync(clientPath, 'utf-8');

      expect(clientContent).toContain('No security schemes defined');
      expect(clientContent).toContain('No authentication configured');
    });

    it('should generate code for spec without base URL', async () => {
      const noBaseUrlSpec: ParsedOpenAPI = {
        info: { title: 'No Base URL API', version: '1.0.0' },
        securitySchemes: [],
        paths: [],
      };

      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(noBaseUrlSpec);

      const indexPath = path.join(tempDir, 'src', 'index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
    });
  });

  describe('Security Generation', () => {
    it('should generate bearer token authentication', async () => {
      const bearerOnlySpec: ParsedOpenAPI = {
        info: { title: 'Bearer API', version: '1.0.0' },
        securitySchemes: [
          { name: 'token', type: 'bearer', envVarName: 'TOKEN_TOKEN' },
        ],
        paths: [],
      };

      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(bearerOnlySpec);

      const clientPath = path.join(tempDir, 'src', 'client.ts');
      const clientContent = fs.readFileSync(clientPath, 'utf-8');

      expect(clientContent).toContain('Bearer');
      expect(clientContent).toContain('Authorization');
    });

    it('should generate API key header authentication', async () => {
      const apiKeySpec: ParsedOpenAPI = {
        info: { title: 'API Key API', version: '1.0.0' },
        securitySchemes: [
          {
            name: 'key',
            type: 'apiKey',
            in: 'header',
            paramName: 'X-Custom-Key',
            envVarName: 'KEY_TOKEN',
          },
        ],
        paths: [],
      };

      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(apiKeySpec);

      const clientPath = path.join(tempDir, 'src', 'client.ts');
      const clientContent = fs.readFileSync(clientPath, 'utf-8');

      expect(clientContent).toContain('X-Custom-Key');
    });

    it('should generate API key query authentication', async () => {
      const apiKeySpec: ParsedOpenAPI = {
        info: { title: 'API Key API', version: '1.0.0' },
        securitySchemes: [
          {
            name: 'key',
            type: 'apiKey',
            in: 'query',
            paramName: 'key',
            envVarName: 'KEY_TOKEN',
          },
        ],
        paths: [],
      };

      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(apiKeySpec);

      const clientPath = path.join(tempDir, 'src', 'client.ts');
      const clientContent = fs.readFileSync(clientPath, 'utf-8');

      expect(clientContent).toContain('requestConfig.params');
    });

    it('should generate basic authentication', async () => {
      const basicSpec: ParsedOpenAPI = {
        info: { title: 'Basic Auth API', version: '1.0.0' },
        securitySchemes: [
          { name: 'basic', type: 'basic', envVarName: 'BASIC_TOKEN' },
        ],
        paths: [],
      };

      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(basicSpec);

      const clientPath = path.join(tempDir, 'src', 'client.ts');
      const clientContent = fs.readFileSync(clientPath, 'utf-8');

      expect(clientContent).toContain('Basic');
      expect(clientContent).toContain('BASIC_PASSWORD');
      expect(clientContent).toContain('Buffer.from');
      expect(clientContent).toContain('base64');
    });
  });

  describe('File Permissions', () => {
    it('should set executable permissions on bin script', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const binPath = path.join(tempDir, 'bin', 'cli.js');
      const stats = fs.statSync(binPath);
      const mode = stats.mode & 0o777;

      // Check if executable bit is set (at least for user)
      expect(mode & 0o111).not.toBe(0);
    });
  });
});