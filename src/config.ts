import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { GeneratorConfig } from './types';

/**
 * Loads the configuration from a YAML file.
 * @param path Path to the YAML configuration file.
 * @returns The parsed configuration object.
 */
export function loadConfig(path: string): GeneratorConfig {
  if (!fs.existsSync(path)) {
    throw new Error(`Configuration file not found: ${path}`);
  }

  try {
    const fileContents = fs.readFileSync(path, 'utf8');
    const config = yaml.load(fileContents) as GeneratorConfig;
    return config || {};
  } catch (error: any) {
    throw new Error(`Failed to parse configuration file: ${error.message}`);
  }
}

/**
 * Merges the configuration from the file with the CLI options.
 * CLI options have higher priority.
 * @param config The configuration from the file.
 * @param options The CLI options.
 * @returns The merged configuration.
 */
export function mergeConfig(config: GeneratorConfig, options: any): GeneratorConfig {
  const merged: GeneratorConfig = { ...config };

  if (options.cliName) merged.cliName = options.cliName;
  if (options.baseUrl) merged.baseUrl = options.baseUrl;
  if (options.envPrefix) merged.envPrefix = options.envPrefix;
  if (options.authEnvName) merged.authEnvName = options.authEnvName;

  return merged;
}
