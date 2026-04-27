import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { loadConfig, mergeConfig } from '../../src/config';
import { GeneratorConfig } from '../../src/types';

describe('Config Loader', () => {
  const tempConfigPath = path.join(__dirname, 'test-config.yaml');

  afterEach(() => {
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  });

  it('should load a valid YAML config file', () => {
    const mockConfig: GeneratorConfig = {
      cliName: 'test-cli',
      baseUrl: 'https://api.test.com',
      permissions: {
        readonly: true,
      },
    };

    fs.writeFileSync(tempConfigPath, yaml.dump(mockConfig));

    const loaded = loadConfig(tempConfigPath);
    expect(loaded.cliName).toBe('test-cli');
    expect(loaded.baseUrl).toBe('https://api.test.com');
    expect(loaded.permissions?.readonly).toBe(true);
  });

  it('should throw error if config file does not exist', () => {
    expect(() => loadConfig('non-existent.yaml')).toThrow('Configuration file not found');
  });

  it('should merge CLI options with config, giving priority to CLI options', () => {
    const config: GeneratorConfig = {
      cliName: 'config-name',
      baseUrl: 'http://config.url',
      envPrefix: 'CONFIG_',
      authEnvName: 'CONFIG_AUTH_KEY',
    };

    const options = {
      cliName: 'cli-name',
      // baseUrl is missing, should take from config
      envPrefix: 'CLI_',
      authEnvName: 'CLI_AUTH_KEY',
    };

    const merged = mergeConfig(config, options);

    expect(merged.cliName).toBe('cli-name');
    expect(merged.baseUrl).toBe('http://config.url');
    expect(merged.envPrefix).toBe('CLI_');
    expect(merged.authEnvName).toBe('CLI_AUTH_KEY');
  });
});
