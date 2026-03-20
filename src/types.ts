import { OpenAPI } from 'openapi-types';

export interface ParsedOpenAPI {
  info: {
    title: string;
    description?: string;
    version: string;
  };
  baseUrl?: string;
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  securitySchemes: SecurityScheme[];
  paths: ParsedPath[];
}

export interface SecurityScheme {
  name: string;
  type: 'bearer' | 'apiKey' | 'basic' | 'oauth2' | 'openIdConnect';
  in?: 'header' | 'query' | 'cookie';
  paramName?: string;
  description?: string;
  envVarName: string;
}

export interface ParsedPath {
  path: string;
  methods: ParsedMethod[];
}

export interface ParsedMethod {
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters: ParsedParameter[];
  requestBody?: ParsedRequestBody;
  responses: ParsedResponse[];
  security?: string[];
}

export interface ParsedParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  description?: string;
  schema?: any;
  type: string;
}

export interface ParsedRequestBody {
  required: boolean;
  description?: string;
  contentType: string;
  schema?: any;
}

export interface ParsedResponse {
  statusCode: string;
  description?: string;
  contentType?: string;
  schema?: any;
}

export interface GeneratorOptions {
  outputDir: string;
  cliName?: string;
  baseUrl?: string;
  envPrefix?: string;
}

export type OpenAPIDocument = OpenAPI.Document;