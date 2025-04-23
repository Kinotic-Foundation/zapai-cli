import { Flags } from '@oclif/core'
import chalk from 'chalk'
import ora from 'ora'
import {Page} from 'puppeteer'
import { ChatController } from '../../internal/common/ChatController.js'
import { CommandRegistry } from '../../internal/common/CommandRegistry.js'
import { MenuHandler } from '../../internal/common/MenuHandler.js'
import { ChatStreamer } from '../../internal/chat/ChatStreamer.js'
import { FileUploader } from '../../internal/chat/FileUploader.js'
import { ConversationManager } from '../../internal/chat/ConversationManager.js'
import { BaseGrokCommand } from '../../internal/BaseGrokCommand.js'
import {GrokConfig, saveGrokConfig} from '../../internal/state/GrokConfig.js'
import '../../internal/tools/FileTool.js'

export default class Chat extends BaseGrokCommand {
  static description = `
Start an interactive chat session with Grok 3, an AI assistant from xAI...
`
  static examples = [
    '$ zapai grok chat',
    'Start a chat session, resuming the active conversation or creating a new one if none exists.',
    '',
    '$ zapai grok chat -v',
    'Run in visible mode to see the browser UI, useful for debugging or CAPTCHA resolution.',
    '',
    '$ zapai grok chat -c <conversation-id>',
    'Resume a specific conversation by ID, overriding the active one in config.',
    '',
    '$ zapai grok chat -n',
    'Force a new conversation, ignoring any active conversation ID in config.',
    '',
    '$ zapai grok chat -f "./docs/*.md" -t file',
    'Start a chat with up to 10 files uploaded from ./docs/*.md and enable the "file" tool for JSON responses.',
    '',
    '$ zapai grok chat -v -n -t file',
    'Start a new conversation in visible mode with the "file" tool enabled.'
  ]
  static flags = {
    conversation: Flags.string({ char: 'c', description: 'Use a specific conversation ID', name: 'conversation-id' }),
    files: Flags.string({ char: 'f', description: 'Glob pattern for files to upload', name: 'files' }),
    visible: Flags.boolean({ char: 'v', description: 'Run with visible browser', name: 'visible', default: false }),
    tools: Flags.string({ char: 't', description: 'Enable a specific tool', name: 'tools' }),
    new: Flags.boolean({ char: 'n', description: 'Force a new conversation', name: 'new', default: false }),
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(Chat)
      const page = await this.setupBrowser('https://grok.com', undefined, !flags.visible)

      const conversationId = await this.initializeConversation(flags)
      const chatStreamer = await this.setupChatStreamer(page, conversationId)

      const commandRegistry = new CommandRegistry()
      const menuHandler = new MenuHandler()
      const fileUploader = new FileUploader(page, [], process.cwd())

      const controller = new ChatController(
          commandRegistry,
          menuHandler,
          chatStreamer,
          fileUploader
      )

      await controller.run(flags)

    } catch (error) {
      this.log(chalk.red(`Error: ${(error as Error).message}`))
    } finally {
      await this.cleanup()
    }
  }

  private async initializeConversation(flags: { new?: boolean; conversation?: string }): Promise<string> {
    let ret: string = ''
    if (flags.new) {
      ret = ''
      console.log(chalk.yellow('Starting a new conversation (ignoring active ID)'))
    } else {

      if(!this.grokConfig){
        throw new Error('No Grok configuration found. Run `zapai grok config` first.')
      }

      ret = flags.conversation || this.grokConfig.activeConversationId || ''
      if (ret && ret !== this.grokConfig.activeConversationId) {
        this.grokConfig.activeConversationId = ret
        await saveGrokConfig(this.config.configDir, this.grokConfig)
        console.log(chalk.yellow(`Active conversation set to: ${ret}`))
      }
    }

    return ret
  }

  private async setupChatStreamer(page: Page, conversationId: string): Promise<ChatStreamer> {
    const url = conversationId ? `https://grok.com/chat/${conversationId}` : 'https://grok.com'
    await page.goto(url, { waitUntil: 'networkidle2' })

    try {
      await page.waitForSelector('textarea[aria-label="Ask Grok anything"]', { timeout: 30000 })
    } catch (error) {
      const content = await page.content()
      const err = `Timed out waiting for chat UI\n Page content after timeout: ${content}`
      throw new Error(err)
    }

    if (conversationId) {
      const conversationManager = new ConversationManager(page)

      const spinner = ora('Loading previous conversation...').start()

      const initialParentResponseId = (await conversationManager.loadConversationHistory(conversationId)) || ''
      if (initialParentResponseId) {
        spinner.succeed(chalk.green(`Loaded conversation ${conversationId}`))
        return new ChatStreamer(page, this.grokConfig as GrokConfig, conversationId, initialParentResponseId)
      } else {
        throw new Error(`No history found for conversation ${conversationId}`)
      }

    } else {
      return new ChatStreamer(page, this.grokConfig as GrokConfig)
    }
  }

}
