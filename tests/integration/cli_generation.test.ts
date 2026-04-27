import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { OpenAPIParser } from '../../src/parser';
import { TypeScriptGenerator } from '../../src/generator/typescript';

describe('CLI Generation Integration', () => {
  const tempDir = path.join(__dirname, 'temp-integration-' + Date.now());
  const petstoreSpecPath = path.resolve(__dirname, '../../examples/petstore.json');

  beforeAll(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should generate, install, build, and execute the petstore CLI', async () => {
    // 1. Parse the spec
    const parser = new OpenAPIParser();
    const spec = await parser.parse(petstoreSpecPath);

    // 2. Generate the CLI
    const outputDir = path.join(tempDir, 'petstore-cli');
    const generator = new TypeScriptGenerator({
      outputDir,
      cliName: 'petstore-api-test',
      envPrefix: 'TEST_',
    });
    await generator.generate(spec);

    // Verify files were generated
    expect(fs.existsSync(path.join(outputDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'src/index.ts'))).toBe(true);

    // 3. Install and Build (this might be slow, but it's an integration test)
    console.log('Running npm install in generated CLI...');
    execSync('npm install', { cwd: outputDir, stdio: 'inherit' });
    
    console.log('Running npm run build in generated CLI...');
    execSync('npm run build', { cwd: outputDir, stdio: 'inherit' });

    // Verify build output
    expect(fs.existsSync(path.join(outputDir, 'dist/index.js'))).toBe(true);

    // 4. Execute the CLI --help
    console.log('Executing generated CLI --help...');
    const helpOutput = execSync('node bin/cli.js --help', {
      cwd: outputDir,
      encoding: 'utf-8',
    });

    expect(helpOutput).toContain('petstore-api-test');
    expect(helpOutput).toContain('List all pets');
    expect(helpOutput).toContain('show-pet-by-id');

    // 5. Verify environment variables are correctly mentioned in the code (optional check)
    const clientContent = fs.readFileSync(path.join(outputDir, 'src/client.ts'), 'utf-8');
    expect(clientContent).toContain('process.env.TEST_API_KEY');
    expect(clientContent).toContain('process.env.TEST_BEARER_AUTH_API_KEY');
  }, 60000); // Set timeout to 60s for npm install
});
