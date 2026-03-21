import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as yaml from 'js-yaml';
import { OpenAPIParser } from '../../src/parser';
import { TypeScriptGenerator } from '../../src/generator/typescript';

describe('Advanced Features Integration', () => {
  const tempDir = path.join(__dirname, 'temp-adv-' + Date.now());
  const specPath = path.join(tempDir, 'spec.json');
  const configPath = path.join(tempDir, 'config.yaml');
  const outputDir = path.join(tempDir, 'generated-cli');

  const mockSpec = {
    openapi: '3.0.0',
    info: { title: 'Adv API', version: '1.0.0' },
    paths: {
      '/public': {
        get: {
          operationId: 'getPublic',
          summary: 'Get public data',
          responses: { '200': { description: 'OK' } },
        },
      },
      '/private': {
        get: {
          operationId: 'getPrivate',
          summary: 'Get private data',
          responses: { '200': { description: 'OK' } },
        },
        delete: {
          operationId: 'deletePrivate',
          summary: 'Delete private data',
          responses: { '204': { description: 'Deleted' } },
        },
      },
    },
  };

  const mockConfig = {
    permissions: {
      block: {
        operationIds: ['getPrivate'],
      },
    },
    safety: {
      highRiskOperations: ['delete-private'],
    },
    agent: {
      includeExamples: true,
    },
  };

  beforeAll(async () => {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(specPath, JSON.stringify(mockSpec));
    fs.writeFileSync(configPath, yaml.dump(mockConfig));

    const parser = new OpenAPIParser();
    const spec = await parser.parse(specPath);
    const generator = new TypeScriptGenerator({
      outputDir,
      cliName: 'adv-cli',
      config: mockConfig as any,
    });
    await generator.generate(spec);

    // Install and build
    execSync('npm install', { cwd: outputDir });
    execSync('npm run build', { cwd: outputDir });
  }, 120000);

  afterAll(() => {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should filter out blocked operationIds', () => {
    const helpOutput = execSync('node bin/cli.js --help', { cwd: outputDir, encoding: 'utf-8' });
    expect(helpOutput).toContain('get-public');
    expect(helpOutput).not.toContain('get-private');
  });

  it('should require --force for high-risk operations', () => {
    try {
      execSync('node bin/cli.js delete-private', { cwd: outputDir, encoding: 'utf-8', stdio: 'pipe' });
      fail('Should have failed without --force');
    } catch (error: any) {
      expect(error.stderr.toString()).toContain('Error: This is a high-risk operation. Use --force to confirm.');
    }
  });

  it('should allow high-risk operations with --force (mocking actual call failure)', () => {
    try {
      // It will still fail later because no real server, but the safety check should pass
      execSync('node bin/cli.js delete-private --force', { cwd: outputDir, encoding: 'utf-8', stdio: 'pipe' });
    } catch (error: any) {
      // Expect connection error or 404, but NOT the safety confirmation error
      expect(error.stderr.toString()).not.toContain('Use --force to confirm.');
    }
  });

  it('should support search-api command', () => {
    const searchOutput = execSync('node bin/cli.js search-api public', { cwd: outputDir, encoding: 'utf-8' });
    expect(searchOutput).toContain('get-public');
    expect(searchOutput).toContain('Get public data');
  });

  it('should support export-tools-json command', () => {
    const exportOutput = execSync('node bin/cli.js export-tools-json', { cwd: outputDir, encoding: 'utf-8' });
    const tools = JSON.parse(exportOutput);
    expect(Array.isArray(tools)).toBe(true);
    expect(tools[0].function.name).toBe('getPublic');
  });
});
