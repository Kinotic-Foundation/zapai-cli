import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { resolve } from 'path';
import { homedir } from 'os';
import { CommandRegistry } from './CommandRegistry.js';
import { MenuHandler } from './MenuHandler.js';
import { GrokTool } from '../tools/GrokTool.js';
import { ChatStreamer, FileUploader } from './Interfaces.js';

export class ChatController {
  private chatActive = false;
  private cwd = process.cwd();
  private fileIds: string[] = [];
  private enabledTool: GrokTool | null = null;

  constructor(
    private commandRegistry: CommandRegistry,
    private menuHandler: MenuHandler,
    private chatStreamer: ChatStreamer,
    private fileUploader: FileUploader
  ) {
  }

  async run(flags: { files?: string; }): Promise<void> {
    if (flags.files) await this.uploadFiles(flags.files);
    console.log(
      chalk.blue('Interactive chat started. Type ') +
        chalk.yellow(':') +
        chalk.blue(' for menu, ') +
        chalk.yellow('\\q') +
        chalk.blue(' to exit')
    );
    await this.chatLoop();
  }

  private async chatLoop(): Promise<void> {
    this.chatActive = true;
    while (this.chatActive) {
      console.log(this.formatCwd());
      let userInput = await input({ message: chalk.green('You:') });
      userInput = userInput.trim();
      if (userInput === '\\q') {
        this.chatActive = false;
      } else if (userInput === ':') {
        await this.menuHandler.showMenu(this);
      } else if (userInput.startsWith(':')) {
        await this.commandRegistry.execute(userInput, this);
      } else {
        await this.chatStreamer.streamChat(userInput, this.fileIds, this.enabledTool);
        this.fileIds.length = 0;
      }
    }
    console.log(chalk.blue('Chat session ended'));
  }

  private async uploadFiles(globPattern: string): Promise<void> {
    const paths = globPattern.split(',').map(p => resolve(this.cwd, p));
    await this.fileUploader.uploadFiles(paths);
  }

  private formatCwd(): string {
    const home = homedir();
    return this.cwd.startsWith(home) ? chalk.gray(`📁 ~${this.cwd.slice(home.length)}`) : chalk.gray(`📁 ${this.cwd}`);
  }

  getCwd(): string { return this.cwd; }
  setCwd(cwd: string) { this.cwd = cwd; }
  getEnabledTool(): GrokTool | null { return this.enabledTool; }
  setEnabledTool(tool: GrokTool | null) { this.enabledTool = tool; }
  getFileUploader(): FileUploader { return this.fileUploader; }
}
