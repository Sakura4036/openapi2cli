import swaggerParser from '@apidevtools/swagger-parser';
import {
  ParsedOpenAPI,
  SecurityScheme,
  ParsedPath,
  ParsedMethod,
  ParsedParameter,
  ParsedRequestBody,
  ParsedResponse,
} from './types';
import { camelCase, upperCase, snakeCase } from 'lodash';

// Internal document type that handles both OpenAPI 3.x and Swagger 2.x
interface OpenAPIDocumentInternal {
  openapi?: string;
  swagger?: string;
  info: {
    title?: string;
    description?: string;
    version?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  host?: string;
  basePath?: string;
  schemes?: string[];
  components?: {
    securitySchemes?: Record<string, any>;
  };
  securityDefinitions?: Record<string, any>;
  paths: Record<string, any>;
}

interface PathItemInternal {
  get?: OperationInternal;
  post?: OperationInternal;
  put?: OperationInternal;
  patch?: OperationInternal;
  delete?: OperationInternal;
  head?: OperationInternal;
  options?: OperationInternal;
  trace?: OperationInternal;
  parameters?: any[];
}

interface OperationInternal {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: any[];
  requestBody?: any;
  responses?: Record<string, any>;
  security?: any[];
  example?: any;      // Added
  examples?: Record<string, any>; // Added
}

export class OpenAPIParser {
  private doc: OpenAPIDocumentInternal | null = null;

  async parse(input: string): Promise<ParsedOpenAPI> {
    // Parse and validate the OpenAPI document
    const parsed = await swaggerParser.parse(input);
    await swaggerParser.validate(input);
    this.doc = parsed as OpenAPIDocumentInternal;

    return this.transform();
  }

  async parseFromUrl(url: string): Promise<ParsedOpenAPI> {
    // Fetch from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI spec from ${url}: ${response.statusText}`);
    }

    const content = await response.text();
    let spec: any;

    // Try to parse as JSON first, then YAML
    try {
      spec = JSON.parse(content);
    } catch {
      const yaml = await import('js-yaml');
      spec = yaml.load(content);
    }

    this.doc = spec as OpenAPIDocumentInternal;
    await swaggerParser.validate(spec as any);

    return this.transform();
  }

  private transform(): ParsedOpenAPI {
    if (!this.doc) {
      throw new Error('No OpenAPI document loaded');
    }

    const doc = this.doc;

    return {
      info: {
        title: doc.info?.title || 'API',
        description: doc.info?.description,
        version: doc.info?.version || '1.0.0',
      },
      baseUrl: this.extractBaseUrl(),
      servers: doc.servers?.map((s: any) => ({
        url: s.url,
        description: s.description,
      })),
      securitySchemes: this.extractSecuritySchemes(),
      paths: this.extractPaths(),
    };
  }

  private extractBaseUrl(): string | undefined {
    if (!this.doc) {
      return undefined;
    }

    // OpenAPI 3.x
    if (this.doc.servers && this.doc.servers.length > 0) {
      return this.doc.servers[0].url;
    }

    // Swagger 2.x
    if (this.doc.host) {
      const scheme = this.doc.schemes?.[0] || 'https';
      const basePath = this.doc.basePath || '';
      return `${scheme}://${this.doc.host}${basePath}`;
    }

    return undefined;
  }

  private extractSecuritySchemes(): SecurityScheme[] {
    const schemes: SecurityScheme[] = [];

    // OpenAPI 3.x
    const securitySchemes = this.doc?.components?.securitySchemes;
    // Swagger 2.x
    const securityDefinitions = this.doc?.securityDefinitions;

    const allSchemes = { ...securitySchemes, ...securityDefinitions };

    if (!allSchemes) {
      return schemes;
    }

    for (const [name, scheme] of Object.entries(allSchemes)) {
      const typedScheme = scheme as any;

      let type: SecurityScheme['type'] = 'bearer';
      let envVarName = '';

      switch (typedScheme.type) {
        case 'http':
          if (typedScheme.scheme === 'bearer') {
            type = 'bearer';
            envVarName = 'API_TOKEN';
          } else if (typedScheme.scheme === 'basic') {
            type = 'basic';
            envVarName = 'API_USERNAME';
          } else {
            type = 'bearer';
            envVarName = 'API_TOKEN';
          }
          break;
        case 'apiKey':
          type = 'apiKey';
          envVarName = 'API_KEY';
          break;
        case 'oauth2':
          type = 'oauth2';
          envVarName = 'OAUTH_TOKEN';
          break;
        case 'openIdConnect':
          type = 'openIdConnect';
          envVarName = 'OPENID_TOKEN';
          break;
        case 'basic':
          // Swagger 2.x basic auth
          type = 'basic';
          envVarName = 'API_USERNAME';
          break;
        default:
          type = 'bearer';
          envVarName = 'API_TOKEN';
      }

      // Create a more specific env var name based on scheme name
      const baseName = name;

      // Convert to UPPER_SNAKE_CASE
      let variableName = snakeCase(baseName).toUpperCase();
      
      // Handle standard "HTTP_BEARER" from HTTPBearer scheme name
      if (variableName === 'HTTP_BEARER') {
        variableName = 'BEARER';
      }

      // Ensure appropriate suffix based on type
      const isAuthToken = ['bearer', 'oauth2', 'openIdConnect', 'basic'].includes(type);
      const isApiKey = type === 'apiKey';

      if (isAuthToken && !variableName.endsWith('_TOKEN')) {
        variableName = `${variableName}_TOKEN`;
      } else if (isApiKey && !variableName.endsWith('_KEY')) {
        variableName = `${variableName}_KEY`;
      }
      
      envVarName = variableName;

      schemes.push({
        name,
        type,
        in: typedScheme.in as SecurityScheme['in'],
        paramName: typedScheme.name,
        description: typedScheme.description,
        envVarName,
      });
    }

    return schemes;
  }

  private extractPaths(): ParsedPath[] {
    const paths: ParsedPath[] = [];
    const docPaths = this.doc?.paths;

    if (!docPaths) {
      return paths;
    }

    for (const [path, pathItem] of Object.entries(docPaths)) {
      const typedPathItem = pathItem as PathItemInternal;

      const methods = this.extractMethods(path, typedPathItem);

      if (methods.length > 0) {
        paths.push({
          path,
          methods,
        });
      }
    }

    return paths;
  }

  private extractMethods(path: string, pathItem: PathItemInternal): ParsedMethod[] {
    const methods: ParsedMethod[] = [];
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const;

    for (const method of httpMethods) {
      const operation = pathItem[method];

      if (!operation) {
        continue;
      }

      methods.push({
        method,
        operationId: operation.operationId || this.generateOperationId(method, path),
        summary: operation.summary,
        description: operation.description,
        tags: operation.tags,
        parameters: this.extractParameters(operation, pathItem),
        requestBody: this.extractRequestBody(operation),
        responses: this.extractResponses(operation),
        security: operation.security?.map((s: any) => Object.keys(s)[0]),
        example: operation.example || (operation as any)['x-example'], // Added
        examples: (operation.examples ? Object.values(operation.examples) : undefined) || (operation as any)['x-examples'], // Added
      });
    }

    return methods;
  }

  private generateOperationId(method: string, path: string): string {
    // Generate operation ID from method and path
    const pathParts = path
      .split('/')
      .filter(Boolean)
      .map((part) => part.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9]/g, '-'));

    return `${method}-${pathParts.join('-')}`;
  }

  private extractParameters(
    operation: OperationInternal,
    pathItem: PathItemInternal
  ): ParsedParameter[] {
    const parameters: ParsedParameter[] = [];

    // Combine path-level and operation-level parameters
    const allParameters = [
      ...(pathItem.parameters || []),
      ...(operation.parameters || []),
    ];

    for (const param of allParameters) {
      // Skip $ref parameters for now (would need to resolve them)
      if (param.$ref) {
        continue;
      }

      parameters.push({
        name: param.name,
        in: param.in as ParsedParameter['in'],
        required: param.required || param.in === 'path',
        description: param.description,
        schema: param.schema,
        type: this.getTypeFromSchema(param.schema || param),
        example: param.example, // Added
      });
    }

    return parameters;
  }

  private extractRequestBody(operation: OperationInternal): ParsedRequestBody | undefined {
    const requestBody = operation.requestBody;

    if (!requestBody) {
      return undefined;
    }

    // Handle $ref
    if (requestBody.$ref) {
      return {
        required: true,
        contentType: 'application/json',
      };
    }

    const content = requestBody.content;
    let contentType = 'application/json';
    let schema: any = undefined;

    if (content) {
      // Prefer application/json
      if (content['application/json']) {
        contentType = 'application/json';
        schema = content['application/json'].schema;
      } else {
        // Use first available content type
        const types = Object.keys(content);
        if (types.length > 0) {
          contentType = types[0];
          schema = content[contentType].schema;
        }
      }
    }

    const isBinary = contentType === 'application/octet-stream' || 
                    contentType.startsWith('image/') || 
                    contentType.startsWith('video/') || 
                    contentType.startsWith('audio/') || 
                    contentType === 'application/pdf' ||
                    contentType === 'multipart/form-data';
                    
    return {
      required: requestBody.required || false,
      description: requestBody.description,
      contentType,
      schema,
      isBinary,
    };
  }

  private extractResponses(operation: OperationInternal): ParsedResponse[] {
    const responses: ParsedResponse[] = [];
    const operationResponses = operation.responses;

    if (!operationResponses) {
      return responses;
    }

    for (const [statusCode, response] of Object.entries(operationResponses)) {
      const typedResponse = response as any;

      // Handle $ref
      if (typedResponse.$ref) {
        responses.push({
          statusCode,
          description: 'Response',
        });
        continue;
      }

      const content = typedResponse.content;

      let contentType: string | undefined;
      let schema: any = undefined;

      if (content) {
        const types = Object.keys(content);
        if (types.length > 0) {
          contentType = types[0];
          schema = content[contentType].schema;
        }
      }

      const isBinary = contentType ? (
        contentType === 'application/octet-stream' || 
        contentType.startsWith('image/') || 
        contentType.startsWith('video/') || 
        contentType.startsWith('audio/') || 
        contentType === 'application/pdf'
      ) : false;
      
      responses.push({
        statusCode,
        description: typedResponse.description,
        contentType,
        schema,
        isBinary,
      });
    }

    return responses;
  }

  private getTypeFromSchema(schema: any): string {
    if (!schema) {
      return 'string';
    }

    // Handle Swagger 2.x style parameters
    if (schema.type && !schema.schema && !Array.isArray(schema.type)) {
      return this.mapType(schema.type);
    }

    // OpenAPI 3.1 supports type as an array
    if (Array.isArray(schema.type)) {
      // Find the first non-null type
      const nonNullType = schema.type.find((t: string) => t !== 'null');
      return this.mapType(nonNullType || 'string');
    }

    if (schema.type) {
      return this.mapType(schema.type);
    }

    // Handle combined schemas (oneOf, anyOf, allOf)
    if (schema.oneOf && schema.oneOf.length > 0) {
      return this.getTypeFromSchema(schema.oneOf[0]);
    }
    if (schema.anyOf && schema.anyOf.length > 0) {
      return this.getTypeFromSchema(schema.anyOf[0]);
    }
    if (schema.allOf && schema.allOf.length > 0) {
      return this.getTypeFromSchema(schema.allOf[0]);
    }

    if (schema.$ref) {
      return 'object';
    }

    return 'string';
  }

  private mapType(type: string): string {
    switch (type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      default:
        return 'string';
    }
  }
}