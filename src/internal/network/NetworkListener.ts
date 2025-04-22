import { Page, HTTPResponse } from 'puppeteer';
import chalk from 'chalk';

// Interface for network event handlers
export interface NetworkHandler {
  // The URL path or pattern to match (e.g., '/rest/app-chat/conversations/*/responses')
  urlPattern: string;
  // Callback to handle the response
  handleResponse: (response: HTTPResponse, url: string) => Promise<void> | void;
}

// Manages network event listening and routes responses to registered handlers
export class NetworkListener {
  private handlers: NetworkHandler[] = [];
  private isListening: boolean = false;

  constructor(private page: Page) {}

  // Registers a new handler for a specific URL pattern
  registerHandler(handler: NetworkHandler): void {
    this.handlers.push(handler);
    console.log(chalk.gray(`Registered handler for URL pattern: ${handler.urlPattern}`));
  }

  // Unregisters a handler based on the URL pattern
  unregisterHandler(urlPattern: string): void {
    const initialLength = this.handlers.length;
    this.handlers = this.handlers.filter(handler => handler.urlPattern !== urlPattern);
    if (this.handlers.length < initialLength) {
      console.log(chalk.gray(`Unregistered handler for URL pattern: ${urlPattern}`));
    } else {
      console.log(chalk.yellow(`No handler found for URL pattern: ${urlPattern}`));
    }
  }

  // Starts listening for network responses
  async start(): Promise<void> {
    if (this.isListening) {
      console.log(chalk.yellow('NetworkListener is already running'));
      return;
    }

    this.isListening = true;
    console.log(chalk.blue('NetworkListener started'));

    this.page.on('response', async (response: HTTPResponse) => {
      const url = response.url();
      for (const handler of this.handlers) {
        if (this.matchUrlPattern(handler.urlPattern, url)) {
          try {
            await handler.handleResponse(response, url);
          } catch (error) {
            console.log(chalk.red(`Error in handler for ${url}: ${(error as Error).message}`));
          }
        }
      }
    });
  }

  // Stops listening for network responses
  async stop(): Promise<void> {
    if (!this.isListening) {
      console.log(chalk.yellow('NetworkListener is not running'));
      return;
    }

    this.isListening = false;
    // Remove all response listeners to prevent memory leaks
    this.page.removeAllListeners('response');
    console.log(chalk.blue('NetworkListener stopped'));
  }

  // Checks if a URL matches the handler's pattern
  private matchUrlPattern(pattern: string, url: string): boolean {
    // Convert pattern to a RegExp, handling wildcards like '*'
    const regexPattern = '^' + pattern
      .replace(/\//g, '\\/') // Escape slashes
      .replace(/\*/g, '[^/]*') // Convert * to match any characters except /
      .replace(/\?/g, '.') + '$'; // Convert ? to single character
    const regex = new RegExp(regexPattern);
    return regex.test(new URL(url).pathname);
  }
}
