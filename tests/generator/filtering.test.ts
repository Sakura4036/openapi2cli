
import { TypeScriptGenerator } from '../../src/generator/typescript';
import { ParsedOpenAPI } from '../../src/types';

describe('Filtering Logic Robustness', () => {
  const mockSpec: ParsedOpenAPI = {
    info: { title: 'Test API', version: '1.0.0' },
    baseUrl: 'https://api.test.com',
    securitySchemes: [],
    paths: [
      {
        path: '/test',
        methods: [
          {
            method: 'get',
            operationId: 'get_test',
            tags: ['Tools-Predict'],
            parameters: [],
            responses: []
          }
        ]
      }
    ]
  };

  it('should match tags case-insensitively', async () => {
    const options = {
      outputDir: './test-out',
      includeTags: ['tools-predict'],
      logs: true
    };

    const generator = new TypeScriptGenerator(options as any);
    // @ts-ignore
    const filtered = generator.filterSpec(mockSpec);

    expect(filtered.paths.length).toBe(1);
    expect(filtered.paths[0].methods[0].operationId).toBe('get_test');
  });

  it('should handle whitespace in includeTags', async () => {
    const options = {
      outputDir: './test-out',
      includeTags: [' tools-predict '],
      logs: true
    };

    const generator = new TypeScriptGenerator(options as any);
    // @ts-ignore
    const filtered = generator.filterSpec(mockSpec);

    expect(filtered.paths.length).toBe(1);
  });

  it('should match operation IDs case-insensitively', async () => {
    const options = {
      outputDir: './test-out',
      includeOperationIds: ['GET_TEST'],
      logs: true
    };

    const generator = new TypeScriptGenerator(options as any);
    // @ts-ignore
    const filtered = generator.filterSpec(mockSpec);

    expect(filtered.paths.length).toBe(1);
  });
});
