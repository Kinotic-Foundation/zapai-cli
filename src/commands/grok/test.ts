import { Flags } from '@oclif/core';
import chalk from 'chalk';
import { BaseGrokCommand } from '../../internal/BaseGrokCommand.js';
import { NetworkListener, NetworkHandler } from '../../internal/network/NetworkListener.js';
import { Page, HTTPResponse } from 'puppeteer';

// Defines a CLI command to test the NetworkListener functionality
export default class Test extends BaseGrokCommand {
  static description = "\nTest the NetworkListener by monitoring network responses from Grok's chat API.\nThis command launches a browser, navigates to grok.com, and listens for network events\nfor a specified duration (default 60 seconds).\n";

  static examples = [
    '$ z grok test',
    'Start the NetworkListener test with default settings (60 seconds, visible browser).',
    '',
    '$ z grok test -t 30',
    'Run the test for 30 seconds.',
    '',
    '$ z grok test --headless',
    'Run the test in headless mode.',
  ];

  static flags = {
    timeout: Flags.integer({
      char: 't',
      description: 'Duration to listen for network events in seconds',
      default: 60,
      name: 'timeout',
    }),
    headless: Flags.boolean({
      description: 'Run in headless mode (no visible browser)',
      default: false,
      name: 'headless',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Test);

    // Set up the browser using BaseGrokCommand
    const page = await this.setupBrowser('https://grok.com', undefined, flags.headless);

    // Initialize NetworkListener
    const listener = new NetworkListener(page);

    // Define a handler for chat responses
    const chatHandler: NetworkHandler = {
      urlPattern: '/rest/app-chat/conversations/*/responses',
      async handleResponse(response: HTTPResponse, url: string) {
        if (response.status() === 200) {
          try {
            const text = await response.text();
            console.log(chalk.green(`Received response from ${url}: ${text}`));
          } catch (error) {
            console.log(chalk.red(`Failed to read response from ${url}: ${(error as Error).message}`));
          }
        }
      },
    };

    try {
      // Register the handler
      listener.registerHandler(chatHandler);

      // Start listening
      await listener.start();

      // Wait for the specified duration
      this.log(chalk.blue(`Listening for network events for ${flags.timeout} seconds...`));
      await new Promise(resolve => setTimeout(resolve, flags.timeout * 1000));

    } catch (error) {
      this.log(chalk.red(`Error during test: ${(error as Error).message}`));
    } finally {
      // Clean up
      await listener.stop();
      await this.cleanup();
      this.log(chalk.blue('Test command completed'));
    }
  }
}
