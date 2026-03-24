#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { OpenAPIParser } from './parser';
import { TypeScriptGenerator } from './generator/typescript';
import { kebabCase } from 'lodash';

const program = new Command();

program
  .name('openapi2cli')
  .description('Convert OpenAPI specifications to executable CLI tools')
  .version('1.0.0')
  .argument('<input>', 'OpenAPI specification file (JSON/YAML) or URL')
  .requiredOption('-o, --output <dir>', 'Output directory for generated CLI')
  .option('--base-url <url>', 'Override base URL for API requests')
  .option('--name <name>', 'Name for the generated CLI (default: derived from API title)')
  .option('--env-prefix <prefix>', 'Prefix for environment variables')
  .option('--include-tags <tags>', 'Comma-separated list of tags to include')
  .option('--include-ops <ids>', 'Comma-separated list of operation IDs to include')
  .option('--exclude-tags <tags>', 'Comma-separated list of tags to exclude')
  .option('--exclude-ops <ids>', 'Comma-separated list of operation IDs to exclude')
  .option('--group-by-tag', 'Enable tag-based subcommand hierarchy')
  .option('--logs', 'Show key log outputs during conversion')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (input: string, options: any) => {
    try {
      let generatorConfig: any = {};
      if (options.config) {
        console.log(`Loading configuration from: ${options.config}`);
        const { loadConfig } = await import('./config');
        generatorConfig = loadConfig(path.resolve(options.config));
      }

      console.log(`Parsing OpenAPI specification from: ${input}`);

      const parser = new OpenAPIParser();
      let spec;

      // Check if input is a URL or a file
      if (input.startsWith('http://') || input.startsWith('https://')) {
        spec = await parser.parseFromUrl(input);
      } else {
        // Check if file exists
        if (!fs.existsSync(input)) {
          console.error(`Error: File not found: ${input}`);
          process.exit(1);
        }

        const absolutePath = path.resolve(input);
        spec = await parser.parse(absolutePath);
      }

      console.log(`API: ${spec.info.title} (v${spec.info.version})`);
      console.log(`Found ${spec.paths.length} paths with ${spec.paths.reduce((acc, p) => acc + p.methods.length, 0)} operations`);

      if (spec.securitySchemes.length > 0) {
        console.log(`Security schemes: ${spec.securitySchemes.map((s) => s.name).join(', ')}`);
      }

      // Merge CLI options with config file (CLI has priority)
      const cliName = options.name || generatorConfig.cliName || kebabCase(spec.info.title);
      const baseUrl = options.baseUrl || generatorConfig.baseUrl || spec.baseUrl;
      
      // Format environment variable prefix: default to 'API', uppercase, ensure trailing underscore
      let envPrefix = (options.envPrefix || generatorConfig.envPrefix || 'API').toUpperCase();
      if (!envPrefix.endsWith('_')) {
        envPrefix += '_';
      }

      // Create generator
      const generator = new TypeScriptGenerator({
        outputDir: path.resolve(options.output),
        cliName,
        baseUrl,
        envPrefix,
        includeTags: options.includeTags ? options.includeTags.split(',').map((s: string) => s.trim()) : (generatorConfig.permissions?.allow?.tags || undefined),
        includeOperationIds: options.includeOps ? options.includeOps.split(',').map((s: string) => s.trim()) : (generatorConfig.permissions?.allow?.operationIds || undefined),
        excludeTags: options.excludeTags ? options.excludeTags.split(',').map((s: string) => s.trim()) : (generatorConfig.permissions?.block?.tags || undefined),
        excludeOperationIds: options.excludeOps ? options.excludeOps.split(',').map((s: string) => s.trim()) : (generatorConfig.permissions?.block?.operationIds || undefined),
        groupByTag: options.groupByTag,
        config: generatorConfig,
        logs: options.logs,
      });

      console.log(`Generating CLI to: ${options.output}`);
      await generator.generate(spec);

      console.log('\nCLI generated successfully!');
      console.log('\nNext steps:');
      console.log(`  cd ${options.output}`);
      console.log('  npm install');
      console.log('  npm run build');
      console.log(`  npm link  # To install the CLI globally`);
      console.log(`\nUsage:`);
      console.log(`  ${options.name || kebabCase(spec.info.title)} --help`);

      if (spec.securitySchemes.length > 0) {
        console.log('\nAuthentication:');
        for (const scheme of spec.securitySchemes) {
          console.log(`  export ${envPrefix}${scheme.envVarName}="your-token-here"`);
        }
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();