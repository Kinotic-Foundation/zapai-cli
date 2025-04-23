import { Command } from '@oclif/core';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { loadWebUiConfig, saveWebUiConfig } from '../../internal/state/WebUiConfig.js';

export default class WebUiConfig extends Command {
  static description = 'Configures the WebUI CLI with server URL, API key, and default model';
  static examples = [
    '$ zapai webui config',
    'Configure WebUI settings interactively.',
  ];

  async run(): Promise<void> {
    const config = await loadWebUiConfig(this.config.configDir);

    const serverUrl = await input({
      message: 'Enter your WebUI server URL',
      default: config.serverUrl || 'http://localhost:3000',
    });

    const apiKey = await input({
      message: 'Enter your WebUI API key (from Settings > Account)',
      default: config.apiKey || '',
    });

    const defaultModel = await input({
      message: 'Enter the default model',
      default: config.defaultModel || 'llama3.1',
    });

    if (serverUrl && apiKey) {
      config.serverUrl = serverUrl;
      config.apiKey = apiKey;
      config.defaultModel = defaultModel;
      await saveWebUiConfig(this.config.configDir, config);
      this.log(chalk.blue('WebUI') + chalk.green(' Configured'));
    } else {
      this.log(chalk.red('Server URL and API key are required. Configuration unchanged.'));
    }
  }
}
