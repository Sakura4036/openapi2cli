import * as fs from 'fs';
import * as path from 'path';
import { TypeScriptGenerator } from '../../src/generator/typescript';
import { ParsedOpenAPI } from '../../src/types';

// Helper to create a temporary directory for tests
const createTempDir = (): string => {
  const tempDir = path.join(__dirname, 'temp-output-' + Date.now());
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
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
      envVarName: 'BEARER_AUTH',
    },
    {
      name: 'apiKeyHeader',
      type: 'apiKey',
      in: 'header',
      paramName: 'X-API-Key',
      envVarName: 'API_KEY_HEADER',
    },
    {
      name: 'apiKeyQuery',
      type: 'apiKey',
      in: 'query',
      paramName: 'api_key',
      envVarName: 'API_KEY_QUERY',
    },
    {
      name: 'basicAuth',
      type: 'basic',
      envVarName: 'BASIC_AUTH',
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
              type: 'number',
            },
          ],
          responses: [
            { statusCode: '200', description: 'A list of users' },
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
      expect(packageJson.dependencies).toHaveProperty('commander');
    });

    it('should generate src/client.ts with fetch-based request', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const clientPath = path.join(tempDir, 'src', 'client.ts');
      expect(fs.existsSync(clientPath)).toBe(true);

      const clientContent = fs.readFileSync(clientPath, 'utf-8');
      expect(clientContent).toContain('export async function request');
      expect(clientContent).toContain('fetch(url.toString()');
      expect(clientContent).toContain('buildPath');
      expect(clientContent).toContain('buildQuery');
    });

    it('should include security configuration in client.ts', async () => {
      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(mockParsedSpec);

      const clientPath = path.join(tempDir, 'src', 'client.ts');
      const clientContent = fs.readFileSync(clientPath, 'utf-8');

      expect(clientContent).toContain('BEARER_AUTH');
      expect(clientContent).toContain('API_KEY_HEADER');
      expect(clientContent).toContain('Authorization');
      expect(clientContent).toContain('X-API-Key');
    });
  });

  describe('Security Generation', () => {
    it('should generate bearer token authentication', async () => {
      const bearerOnlySpec: ParsedOpenAPI = {
        info: { title: 'Bearer API', version: '1.0.0' },
        securitySchemes: [
          { name: 'token', type: 'bearer', envVarName: 'TOKEN' },
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

    it('should generate API key query authentication', async () => {
      const apiKeySpec: ParsedOpenAPI = {
        info: { title: 'API Key API', version: '1.0.0' },
        securitySchemes: [
          {
            name: 'key',
            type: 'apiKey',
            in: 'query',
            paramName: 'api_key',
            envVarName: 'KEY',
          },
        ],
        paths: [],
      };

      generator = new TypeScriptGenerator({ outputDir: tempDir });
      await generator.generate(apiKeySpec);

      const clientPath = path.join(tempDir, 'src', 'client.ts');
      const clientContent = fs.readFileSync(clientPath, 'utf-8');

      expect(clientContent).toContain('url.searchParams.set(\'api_key\', keyKey)');
    });
  });
});