import * as fs from 'fs';
import * as path from 'path';
import { OpenAPIParser } from '../src/parser';
import { ParsedOpenAPI } from '../src/types';

// Helper to create temp files for testing
const createTempFile = (content: string, extension: string = 'json'): string => {
  const tempDir = path.join(__dirname, 'temp-specs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempFile = path.join(tempDir, `spec-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`);
  fs.writeFileSync(tempFile, content);
  return tempFile;
};

const cleanupTempFiles = (): void => {
  const tempDir = path.join(__dirname, 'temp-specs');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

// Mock OpenAPI specifications for testing
const minimalOpenAPI3Spec = JSON.stringify({
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  paths: {},
});

const fullOpenAPI3Spec = JSON.stringify({
  openapi: '3.0.0',
  info: {
    title: 'Pet Store API',
    description: 'A sample Pet Store API',
    version: '2.1.0',
  },
  servers: [
    {
      url: 'https://api.petstore.com/v2',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.petstore.com/v2',
      description: 'Staging server',
    },
  ],
  components: {
    schemas: {
      Pet: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          tag: { type: 'string' },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'JWT Authorization header using the Bearer scheme',
      },
      apiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key in header',
      },
      apiKeyQuery: {
        type: 'apiKey',
        in: 'query',
        name: 'api_key',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
      oauth2: {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              read: 'Read access',
              write: 'Write access',
            },
          },
        },
      },
      oidc: {
        type: 'openIdConnect',
        openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
      },
    },
  },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        summary: 'List all pets',
        description: 'Returns a list of all pets in the store',
        tags: ['pets'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'How many items to return at one time (max 100)',
            schema: {
              type: 'integer',
            },
          },
          {
            name: 'offset',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'A list of pets',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Pet',
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
          },
        },
      },
      post: {
        operationId: 'createPets',
        summary: 'Create a pet',
        tags: ['pets'],
        requestBody: {
          required: true,
          description: 'Pet to create',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  tag: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Pet created',
          },
        },
        security: [
          { bearerAuth: [] },
        ],
      },
    },
    '/pets/{petId}': {
      get: {
        operationId: 'showPetById',
        summary: 'Info for a specific pet',
        tags: ['pets'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            description: 'The id of the pet to retrieve',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Expected response to a valid request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
            },
          },
          '404': {
            description: 'Pet not found',
          },
        },
      },
      put: {
        operationId: 'updatePet',
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Pet updated',
          },
        },
      },
      delete: {
        operationId: 'deletePet',
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '204': {
            description: 'Pet deleted',
          },
        },
      },
    },
    '/users/{userId}/profile': {
      get: {
        summary: 'Get user profile',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Success',
          },
        },
      },
    },
  },
});

const swagger2Spec = JSON.stringify({
  swagger: '2.0',
  info: {
    title: 'Swagger 2 API',
    version: '1.0.0',
  },
  host: 'api.example.com',
  basePath: '/v1',
  schemes: ['https', 'http'],
  securityDefinitions: {
    apiKey: {
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
    },
    basic: {
      type: 'basic',
    },
  },
  paths: {
    '/items': {
      get: {
        operationId: 'getItems',
        produces: ['application/json'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            type: 'integer',
          },
        ],
        responses: {
          '200': {
            description: 'Success',
          },
        },
      },
    },
    '/items/{id}': {
      get: {
        operationId: 'getItem',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string',
          },
        ],
        responses: {
          '200': {
            description: 'Success',
          },
        },
      },
    },
  },
});

const openapiYaml = `
openapi: '3.0.0'
info:
  title: YAML API
  version: '1.0.0'
servers:
  - url: https://api.yaml.com/v1
paths:
  /test:
    get:
      operationId: testEndpoint
      responses:
        '200':
          description: Success
`;

describe('OpenAPIParser', () => {
  let parser: OpenAPIParser;

  beforeEach(() => {
    parser = new OpenAPIParser();
  });

  afterAll(() => {
    cleanupTempFiles();
  });

  describe('parse', () => {
    it('should parse a minimal OpenAPI 3.x spec', async () => {
      const tempFile = createTempFile(minimalOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      expect(result.info.title).toBe('Test API');
      expect(result.info.version).toBe('1.0.0');
      expect(result.paths).toEqual([]);
      expect(result.securitySchemes).toEqual([]);

      fs.unlinkSync(tempFile);
    });

    it('should parse a full OpenAPI 3.x spec with all features', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      expect(result.info.title).toBe('Pet Store API');
      expect(result.info.description).toBe('A sample Pet Store API');
      expect(result.info.version).toBe('2.1.0');

      fs.unlinkSync(tempFile);
    });

    it('should extract base URL from servers', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      expect(result.baseUrl).toBe('https://api.petstore.com/v2');
      expect(result.servers).toHaveLength(2);
      expect(result.servers![0].url).toBe('https://api.petstore.com/v2');
      expect(result.servers![1].url).toBe('https://staging-api.petstore.com/v2');

      fs.unlinkSync(tempFile);
    });

    it('should extract paths and methods', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      expect(result.paths).toHaveLength(3);

      const petsPath = result.paths.find((p) => p.path === '/pets');
      expect(petsPath).toBeDefined();
      expect(petsPath!.methods).toHaveLength(2);

      const getMethod = petsPath!.methods.find((m) => m.method === 'get');
      expect(getMethod).toBeDefined();
      expect(getMethod!.operationId).toBe('listPets');
      expect(getMethod!.summary).toBe('List all pets');
      expect(getMethod!.tags).toContain('pets');

      fs.unlinkSync(tempFile);
    });

    it('should extract path parameters', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const petIdPath = result.paths.find((p) => p.path === '/pets/{petId}');
      expect(petIdPath).toBeDefined();

      const getMethod = petIdPath!.methods.find((m) => m.method === 'get');
      expect(getMethod).toBeDefined();

      const pathParam = getMethod!.parameters.find((p) => p.in === 'path');
      expect(pathParam).toBeDefined();
      expect(pathParam!.name).toBe('petId');
      expect(pathParam!.required).toBe(true);

      fs.unlinkSync(tempFile);
    });

    it('should extract query parameters', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const petsPath = result.paths.find((p) => p.path === '/pets');
      const getMethod = petsPath!.methods.find((m) => m.method === 'get');

      const queryParams = getMethod!.parameters.filter((p) => p.in === 'query');
      expect(queryParams).toHaveLength(2);

      const limitParam = queryParams.find((p) => p.name === 'limit');
      expect(limitParam).toBeDefined();
      expect(limitParam!.description).toBe('How many items to return at one time (max 100)');
      expect(limitParam!.required).toBe(false);

      fs.unlinkSync(tempFile);
    });

    it('should extract request body', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const petsPath = result.paths.find((p) => p.path === '/pets');
      const postMethod = petsPath!.methods.find((m) => m.method === 'post');

      expect(postMethod!.requestBody).toBeDefined();
      expect(postMethod!.requestBody!.required).toBe(true);
      expect(postMethod!.requestBody!.contentType).toBe('application/json');

      fs.unlinkSync(tempFile);
    });

    it('should extract responses', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const petsPath = result.paths.find((p) => p.path === '/pets');
      const getMethod = petsPath!.methods.find((m) => m.method === 'get');

      expect(getMethod!.responses).toHaveLength(2);

      const response200 = getMethod!.responses.find((r) => r.statusCode === '200');
      expect(response200).toBeDefined();
      expect(response200!.description).toBe('A list of pets');
      expect(response200!.contentType).toBe('application/json');

      fs.unlinkSync(tempFile);
    });

    it('should extract security from operations', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const petsPath = result.paths.find((p) => p.path === '/pets');
      const postMethod = petsPath!.methods.find((m) => m.method === 'post');

      expect(postMethod!.security).toContain('bearerAuth');

      fs.unlinkSync(tempFile);
    });

    it('should generate operationId if not provided', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const userProfilePath = result.paths.find((p) => p.path === '/users/{userId}/profile');
      expect(userProfilePath).toBeDefined();

      const getMethod = userProfilePath!.methods.find((m) => m.method === 'get');
      expect(getMethod!.operationId).toBe('get-users-userId-profile');

      fs.unlinkSync(tempFile);
    });
  });

  describe('Security Schemes', () => {
    it('should extract bearer security scheme', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const bearerAuth = result.securitySchemes.find((s) => s.name === 'bearerAuth');
      expect(bearerAuth).toBeDefined();
      expect(bearerAuth!.type).toBe('bearer');
      expect(bearerAuth!.description).toBe('JWT Authorization header using the Bearer scheme');

      fs.unlinkSync(tempFile);
    });

    it('should extract apiKey security scheme in header', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const apiKeyHeader = result.securitySchemes.find((s) => s.name === 'apiKeyHeader');
      expect(apiKeyHeader).toBeDefined();
      expect(apiKeyHeader!.type).toBe('apiKey');
      expect(apiKeyHeader!.in).toBe('header');
      expect(apiKeyHeader!.paramName).toBe('X-API-Key');

      fs.unlinkSync(tempFile);
    });

    it('should extract apiKey security scheme in query', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const apiKeyQuery = result.securitySchemes.find((s) => s.name === 'apiKeyQuery');
      expect(apiKeyQuery).toBeDefined();
      expect(apiKeyQuery!.type).toBe('apiKey');
      expect(apiKeyQuery!.in).toBe('query');
      expect(apiKeyQuery!.paramName).toBe('api_key');

      fs.unlinkSync(tempFile);
    });

    it('should extract basic auth security scheme', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const basicAuth = result.securitySchemes.find((s) => s.name === 'basicAuth');
      expect(basicAuth).toBeDefined();
      expect(basicAuth!.type).toBe('basic');

      fs.unlinkSync(tempFile);
    });

    it('should extract oauth2 security scheme', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const oauth2 = result.securitySchemes.find((s) => s.name === 'oauth2');
      expect(oauth2).toBeDefined();
      expect(oauth2!.type).toBe('oauth2');

      fs.unlinkSync(tempFile);
    });

    it('should extract openIdConnect security scheme', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const oidc = result.securitySchemes.find((s) => s.name === 'oidc');
      expect(oidc).toBeDefined();
      expect(oidc!.type).toBe('openIdConnect');

      fs.unlinkSync(tempFile);
    });

    it('should generate env var names from scheme names', async () => {
      const tempFile = createTempFile(fullOpenAPI3Spec);
      const result = await parser.parse(tempFile);

      const bearerAuth = result.securitySchemes.find((s) => s.name === 'bearerAuth');
      expect(bearerAuth!.envVarName).toBe('BEARER_AUTH');

      const apiKeyHeader = result.securitySchemes.find((s) => s.name === 'apiKeyHeader');
      expect(apiKeyHeader!.envVarName).toBe('API_KEY_HEADER');

      fs.unlinkSync(tempFile);
    });
  });

  describe('Swagger 2.x Support', () => {
    it('should parse Swagger 2.x spec', async () => {
      const tempFile = createTempFile(swagger2Spec);
      const result = await parser.parse(tempFile);

      expect(result.info.title).toBe('Swagger 2 API');
      expect(result.info.version).toBe('1.0.0');

      fs.unlinkSync(tempFile);
    });

    it('should construct base URL from host and basePath', async () => {
      const tempFile = createTempFile(swagger2Spec);
      const result = await parser.parse(tempFile);

      expect(result.baseUrl).toBe('https://api.example.com/v1');

      fs.unlinkSync(tempFile);
    });

    it('should extract security definitions from Swagger 2.x', async () => {
      const tempFile = createTempFile(swagger2Spec);
      const result = await parser.parse(tempFile);

      const apiKey = result.securitySchemes.find((s) => s.name === 'apiKey');
      expect(apiKey).toBeDefined();
      expect(apiKey!.type).toBe('apiKey');
      expect(apiKey!.in).toBe('header');
      expect(apiKey!.paramName).toBe('X-API-Key');

      const basic = result.securitySchemes.find((s) => s.name === 'basic');
      expect(basic).toBeDefined();
      expect(basic!.type).toBe('basic');

      fs.unlinkSync(tempFile);
    });

    it('should extract paths from Swagger 2.x', async () => {
      const tempFile = createTempFile(swagger2Spec);
      const result = await parser.parse(tempFile);

      expect(result.paths).toHaveLength(2);

      const itemsPath = result.paths.find((p) => p.path === '/items');
      expect(itemsPath).toBeDefined();
      expect(itemsPath!.methods).toHaveLength(1);
      expect(itemsPath!.methods[0].operationId).toBe('getItems');

      fs.unlinkSync(tempFile);
    });

    it('should extract parameters from Swagger 2.x', async () => {
      const tempFile = createTempFile(swagger2Spec);
      const result = await parser.parse(tempFile);

      const itemIdPath = result.paths.find((p) => p.path === '/items/{id}');
      const getMethod = itemIdPath!.methods.find((m) => m.method === 'get');

      const pathParam = getMethod!.parameters.find((p) => p.in === 'path');
      expect(pathParam).toBeDefined();
      expect(pathParam!.name).toBe('id');
      expect(pathParam!.required).toBe(true);

      fs.unlinkSync(tempFile);
    });
  });

  describe('YAML Support', () => {
    it('should parse YAML format', async () => {
      const tempFile = createTempFile(openapiYaml, 'yaml');
      const result = await parser.parse(tempFile);

      expect(result.info.title).toBe('YAML API');
      expect(result.info.version).toBe('1.0.0');
      expect(result.baseUrl).toBe('https://api.yaml.com/v1');

      fs.unlinkSync(tempFile);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid JSON', async () => {
      const tempFile = createTempFile('not valid json');
      await expect(parser.parse(tempFile)).rejects.toThrow();
      fs.unlinkSync(tempFile);
    });

    it('should throw error for invalid OpenAPI spec', async () => {
      const invalidSpec = JSON.stringify({
        notOpenapi: true,
      });
      const tempFile = createTempFile(invalidSpec);

      await expect(parser.parse(tempFile)).rejects.toThrow();
      fs.unlinkSync(tempFile);
    });
  });

  describe('Type Inference', () => {
    it('should infer string type', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              parameters: [
                { name: 'param', in: 'query', schema: { type: 'string' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });

      const tempFile = createTempFile(spec);
      const result = await parser.parse(tempFile);
      const param = result.paths[0].methods[0].parameters[0];
      expect(param.type).toBe('string');
      fs.unlinkSync(tempFile);
    });

    it('should infer number type for integer', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              parameters: [
                { name: 'param', in: 'query', schema: { type: 'integer' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });

      const tempFile = createTempFile(spec);
      const result = await parser.parse(tempFile);
      const param = result.paths[0].methods[0].parameters[0];
      expect(param.type).toBe('number');
      fs.unlinkSync(tempFile);
    });

    it('should infer number type for number', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              parameters: [
                { name: 'param', in: 'query', schema: { type: 'number' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });

      const tempFile = createTempFile(spec);
      const result = await parser.parse(tempFile);
      const param = result.paths[0].methods[0].parameters[0];
      expect(param.type).toBe('number');
      fs.unlinkSync(tempFile);
    });

    it('should infer boolean type', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              parameters: [
                { name: 'param', in: 'query', schema: { type: 'boolean' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });

      const tempFile = createTempFile(spec);
      const result = await parser.parse(tempFile);
      const param = result.paths[0].methods[0].parameters[0];
      expect(param.type).toBe('boolean');
      fs.unlinkSync(tempFile);
    });

    it('should infer array type', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              parameters: [
                { name: 'param', in: 'query', schema: { type: 'array' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });

      const tempFile = createTempFile(spec);
      const result = await parser.parse(tempFile);
      const param = result.paths[0].methods[0].parameters[0];
      expect(param.type).toBe('array');
      fs.unlinkSync(tempFile);
    });

    it('should default to string for unknown types', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              parameters: [
                { name: 'param', in: 'query', schema: {} },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });

      const tempFile = createTempFile(spec);
      const result = await parser.parse(tempFile);
      const param = result.paths[0].methods[0].parameters[0];
      expect(param.type).toBe('string');
      fs.unlinkSync(tempFile);
    });

    it('should infer type from array of types (OpenAPI 3.1)', async () => {
      const spec = JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'Test 3.1', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              parameters: [
                { name: 'param', in: 'query', schema: { type: ['string', 'null'] } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });

      const tempFile = createTempFile(spec);
      const result = await parser.parse(tempFile);
      const param = result.paths[0].methods[0].parameters[0];
      expect(param.type).toBe('string');
      fs.unlinkSync(tempFile);
    });

    it('should infer type from oneOf (OpenAPI 3.x)', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test OneOf', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              parameters: [
                {
                  name: 'param',
                  in: 'query',
                  schema: {
                    oneOf: [{ type: 'integer' }, { type: 'string' }],
                  },
                },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      });

      const tempFile = createTempFile(spec);
      const result = await parser.parse(tempFile);
      const param = result.paths[0].methods[0].parameters[0];
      expect(param.type).toBe('number');
      fs.unlinkSync(tempFile);
    });
  });

  describe('HTTP Methods', () => {
    it('should extract all HTTP methods', async () => {
      const spec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/resource': {
            get: { responses: { '200': { description: 'OK' } } },
            post: { responses: { '201': { description: 'Created' } } },
            put: { responses: { '200': { description: 'OK' } } },
            patch: { responses: { '200': { description: 'OK' } } },
            delete: { responses: { '204': { description: 'Deleted' } } },
            head: { responses: { '200': { description: 'OK' } } },
            options: { responses: { '200': { description: 'OK' } } },
            trace: { responses: { '200': { description: 'OK' } } },
          },
        },
      });

      const tempFile = createTempFile(spec);
      const result = await parser.parse(tempFile);
      const methods = result.paths[0].methods.map((m) => m.method);

      expect(methods).toContain('get');
      expect(methods).toContain('post');
      expect(methods).toContain('put');
      expect(methods).toContain('patch');
      expect(methods).toContain('delete');
      expect(methods).toContain('head');
      expect(methods).toContain('options');
      expect(methods).toContain('trace');
      expect(methods).toHaveLength(8);

      fs.unlinkSync(tempFile);
    });
  });
});