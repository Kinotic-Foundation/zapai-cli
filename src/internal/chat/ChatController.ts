import { input } from '@inquirer/prompts'
import chalk from 'chalk'
import { resolve } from 'path'
import { homedir } from 'os'
import ora from 'ora'
import { ChatStreamer } from './ChatStreamer.js'
import { CommandRegistry } from './CommandRegistry.js'
import { MenuHandler } from './MenuHandler.js'
import { FileUploader } from './FileUploader.js'
import { ConversationManager } from './ConversationManager.js'
import { Page } from 'puppeteer'
import { ConfigGrok, loadGrokConfig, saveGrokConfig } from '../state/ConfigGrok.js'
import { GrokTool } from '../tools/GrokTool.js'

// Controls the lifecycle and interactions of a Grok chat session
export class ChatController {
  private chatActive = false
  private cwd = process.cwd()
  private fileIds: string[] = []
  private conversationId: string
  private enabledTool: GrokTool | null = null
  private chatStreamer: ChatStreamer
  private grokConfig: ConfigGrok
  private initialParentResponseId = ''
  private fileUploader: FileUploader
  private conversationManager: ConversationManager

  constructor(
    private page: Page,
    private commandRegistry: CommandRegistry,
    private menuHandler: MenuHandler,
    initialConversationId: string,
    private configDir: string
  ) {
    this.conversationId = initialConversationId
    this.fileUploader = new FileUploader(page, this.fileIds, this.cwd) // Pass cwd to FileUploader
    this.conversationManager = new ConversationManager(page)
    this.chatStreamer = new ChatStreamer(page, this.conversationId, this.initialParentResponseId)
    this.grokConfig = {} as ConfigGrok
  }

  // Initiates the chat session with browser setup and user interaction loop
  async run(flags: { visible: boolean; files?: string; new?: boolean; conversation?: string }): Promise<void> {
    this.grokConfig = await loadGrokConfig(this.configDir)
    await this.initializeConversation(flags)
    await this.setupChatPage(flags.visible)

    if (flags.files) await this.uploadFiles(flags.files)
    console.log(chalk.blue('Interactive chat started. Type ') + chalk.yellow(':') + chalk.blue(' for menu, ') + chalk.yellow('\\q') + chalk.blue(' to exit'))
    await this.chatLoop()
  }

  private async initializeConversation(flags: { new?: boolean; conversation?: string }): Promise<void> {
    if (flags.new) {
      this.conversationId = ''
      console.log(chalk.yellow('Starting a new conversation (ignoring active ID)'))
    } else {
      this.conversationId = flags.conversation || this.grokConfig.activeConversationId || ''
      if (this.conversationId && this.conversationId !== this.grokConfig.activeConversationId) {
        this.grokConfig.activeConversationId = this.conversationId
        await saveGrokConfig(this.configDir, this.grokConfig)
        console.log(chalk.yellow(`Active conversation set to: ${this.conversationId}`))
      }
    }
  }

  private async setupChatPage(visible: boolean): Promise<void> {
    const url = this.conversationId ? `https://grok.com/chat/${this.conversationId}` : 'https://grok.com'
    await this.page.goto(url, { waitUntil: 'networkidle2' })

    try {
      await this.page.waitForSelector('textarea[aria-label="Ask Grok anything"]', { timeout: 30000 })
    } catch (error) {
      console.log(chalk.red('Timed out waiting for chat UI'))
      const content = await this.page.content()
      console.log(chalk.yellow('Page content after timeout:'), content)
      throw new Error('Failed to load chat UI')
    }

    if (this.conversationId) {
      const spinner = ora('Loading previous conversation...').start()
      try {
        this.initialParentResponseId = (await this.conversationManager.loadConversationHistory(this.conversationId)) || ''
        if (this.initialParentResponseId) {
          this.chatStreamer = new ChatStreamer(this.page, this.conversationId, this.initialParentResponseId)
          spinner.succeed(chalk.green(`Loaded conversation ${this.conversationId}`))
        } else {
          spinner.warn(chalk.yellow(`No history found for conversation ${this.conversationId}`))
        }
      } catch (error) {
        spinner.fail(chalk.red(`Failed to load conversation: ${(error as Error).message}`))
      }
    } else {
      this.chatStreamer = new ChatStreamer(this.page, this.conversationId, this.initialParentResponseId)
    }
  }

  private async chatLoop(): Promise<void> {
    this.chatActive = true
    while (this.chatActive) {
      console.log(this.formatCwd())
      const userInput = await input({ message: chalk.green('You:') })

      if (userInput.trim() === '\\q') {
        this.chatActive = false
      } else if (userInput.trim() === ':') {
        await this.menuHandler.showMenu(this)
      } else if (userInput.trim().startsWith(':')) {
        await this.commandRegistry.execute(userInput.trim(), this)
      } else {
        await this.chatStreamer.streamChat(userInput, this.fileIds, this.enabledTool)
        await this.updateConversationId()
        this.fileIds = []
      }
    }
    console.log(chalk.blue('Chat session ended'))
  }

  private async uploadFiles(globPattern: string): Promise<void> {
    const paths = globPattern.split(',').map(p => resolve(this.cwd, p))
    await this.fileUploader.uploadFiles(paths)
  }

  private async updateConversationId(): Promise<void> {
    if (!this.conversationId && this.chatStreamer.getConversationId()) {
      this.conversationId = this.chatStreamer.getConversationId()
      this.grokConfig.activeConversationId = this.conversationId
      await saveGrokConfig(this.configDir, this.grokConfig)
    }
  }

  private formatCwd(): string {
    const home = homedir()
    return this.cwd.startsWith(home) ? chalk.gray(`📁 ~${this.cwd.slice(home.length)}`) : chalk.gray(`📁 ${this.cwd}`)
  }

  getCwd(): string { return this.cwd }
  setCwd(cwd: string) { this.cwd = cwd }
  getEnabledTool(): GrokTool | null { return this.enabledTool }
  setEnabledTool(tool: GrokTool | null) { this.enabledTool = tool }
  getFileUploader(): FileUploader { return this.fileUploader }
  getChatStreamer(): ChatStreamer { return this.chatStreamer }
  getGrokConfig(): ConfigGrok { return this.grokConfig }
}