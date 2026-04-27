import {
  ParsedOpenAPI,
  SecurityScheme,
  ParsedPath,
  ParsedMethod,
  ParsedParameter,
  ParsedRequestBody,
  ParsedResponse,
  GeneratorOptions,
} from '../src/types';

describe('Types Module', () => {
  describe('ParsedOpenAPI', () => {
    it('should define a valid ParsedOpenAPI object', () => {
      const parsed: ParsedOpenAPI = {
        info: {
          title: 'Test API',
          description: 'A test API',
          version: '1.0.0',
        },
        baseUrl: 'https://api.example.com',
        servers: [
          { url: 'https://api.example.com', description: 'Production' },
        ],
        securitySchemes: [],
        paths: [],
      };

      expect(parsed.info.title).toBe('Test API');
      expect(parsed.info.version).toBe('1.0.0');
      expect(parsed.baseUrl).toBe('https://api.example.com');
      expect(parsed.servers).toHaveLength(1);
    });

    it('should allow optional fields to be undefined', () => {
      const parsed: ParsedOpenAPI = {
        info: {
          title: 'Minimal API',
          version: '1.0.0',
        },
        securitySchemes: [],
        paths: [],
      };

      expect(parsed.info.description).toBeUndefined();
      expect(parsed.baseUrl).toBeUndefined();
      expect(parsed.servers).toBeUndefined();
    });
  });

  describe('SecurityScheme', () => {
    it('should define a bearer security scheme', () => {
      const scheme: SecurityScheme = {
        name: 'bearerAuth',
        type: 'bearer',
        envVarName: 'API_KEY',
      };

      expect(scheme.type).toBe('bearer');
      expect(scheme.name).toBe('bearerAuth');
    });

    it('should define an apiKey security scheme', () => {
      const scheme: SecurityScheme = {
        name: 'apiKeyAuth',
        type: 'apiKey',
        in: 'header',
        paramName: 'X-API-Key',
        envVarName: 'API_KEY',
      };

      expect(scheme.type).toBe('apiKey');
      expect(scheme.in).toBe('header');
      expect(scheme.paramName).toBe('X-API-Key');
    });

    it('should define a basic security scheme', () => {
      const scheme: SecurityScheme = {
        name: 'basicAuth',
        type: 'basic',
        envVarName: 'BASIC_AUTH_USERNAME',
      };

      expect(scheme.type).toBe('basic');
    });

    it('should define an oauth2 security scheme', () => {
      const scheme: SecurityScheme = {
        name: 'oauth2',
        type: 'oauth2',
        description: 'OAuth 2.0 authentication',
        envVarName: 'API_KEY',
      };

      expect(scheme.type).toBe('oauth2');
      expect(scheme.description).toBe('OAuth 2.0 authentication');
    });

    it('should define an openIdConnect security scheme', () => {
      const scheme: SecurityScheme = {
        name: 'oidc',
        type: 'openIdConnect',
        envVarName: 'API_KEY',
      };

      expect(scheme.type).toBe('openIdConnect');
    });
  });

  describe('ParsedPath', () => {
    it('should define a valid ParsedPath object', () => {
      const path: ParsedPath = {
        path: '/users',
        methods: [],
      };

      expect(path.path).toBe('/users');
      expect(path.methods).toEqual([]);
    });

    it('should contain multiple methods', () => {
      const method1: ParsedMethod = {
        method: 'get',
        operationId: 'getUsers',
        parameters: [],
        responses: [],
      };

      const method2: ParsedMethod = {
        method: 'post',
        operationId: 'createUser',
        parameters: [],
        responses: [],
      };

      const parsedPath: ParsedPath = {
        path: '/users',
        methods: [method1, method2],
      };

      expect(parsedPath.methods).toHaveLength(2);
      expect(parsedPath.methods[0].method).toBe('get');
      expect(parsedPath.methods[1].method).toBe('post');
    });
  });

  describe('ParsedMethod', () => {
    it('should define a valid ParsedMethod object', () => {
      const method: ParsedMethod = {
        method: 'get',
        operationId: 'getUserById',
        summary: 'Get user by ID',
        description: 'Returns a single user',
        tags: ['users'],
        parameters: [],
        responses: [],
        security: ['bearerAuth'],
      };

      expect(method.method).toBe('get');
      expect(method.operationId).toBe('getUserById');
      expect(method.summary).toBe('Get user by ID');
      expect(method.tags).toContain('users');
      expect(method.security).toContain('bearerAuth');
    });
  });

  describe('ParsedParameter', () => {
    it('should define a path parameter', () => {
      const param: ParsedParameter = {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'User ID',
        type: 'string',
      };

      expect(param.name).toBe('userId');
      expect(param.in).toBe('path');
      expect(param.required).toBe(true);
      expect(param.type).toBe('string');
    });

    it('should define a query parameter', () => {
      const param: ParsedParameter = {
        name: 'limit',
        in: 'query',
        required: false,
        description: 'Number of results',
        type: 'integer',
      };

      expect(param.in).toBe('query');
      expect(param.required).toBe(false);
    });

    it('should define a header parameter', () => {
      const param: ParsedParameter = {
        name: 'X-Custom-Header',
        in: 'header',
        required: false,
        type: 'string',
      };

      expect(param.in).toBe('header');
    });

    it('should define a cookie parameter', () => {
      const param: ParsedParameter = {
        name: 'sessionId',
        in: 'cookie',
        required: true,
        type: 'string',
      };

      expect(param.in).toBe('cookie');
    });
  });

  describe('ParsedRequestBody', () => {
    it('should define a request body', () => {
      const body: ParsedRequestBody = {
        required: true,
        description: 'User object',
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };

      expect(body.required).toBe(true);
      expect(body.contentType).toBe('application/json');
      expect(body.schema).toBeDefined();
    });
  });

  describe('ParsedResponse', () => {
    it('should define a response', () => {
      const response: ParsedResponse = {
        statusCode: '200',
        description: 'Success',
        contentType: 'application/json',
        schema: {
          type: 'object',
        },
      };

      expect(response.statusCode).toBe('200');
      expect(response.description).toBe('Success');
      expect(response.contentType).toBe('application/json');
    });

    it('should define an error response', () => {
      const response: ParsedResponse = {
        statusCode: '404',
        description: 'Not Found',
      };

      expect(response.statusCode).toBe('404');
      expect(response.contentType).toBeUndefined();
    });
  });

  describe('GeneratorOptions', () => {
    it('should define required options', () => {
      const options: GeneratorOptions = {
        outputDir: './output',
      };

      expect(options.outputDir).toBe('./output');
    });

    it('should define all options', () => {
      const options: GeneratorOptions = {
        outputDir: './output',
        cliName: 'my-cli',
        baseUrl: 'https://api.example.com',
        envPrefix: 'MY_API',
        authEnvName: 'MY_AUTH_API_KEY',
      };

      expect(options.cliName).toBe('my-cli');
      expect(options.baseUrl).toBe('https://api.example.com');
      expect(options.envPrefix).toBe('MY_API');
      expect(options.authEnvName).toBe('MY_AUTH_API_KEY');
    });
  });
});