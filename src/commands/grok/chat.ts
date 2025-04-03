import { Flags } from '@oclif/core'
import chalk from 'chalk'
import { ChatController } from '../../internal/chat/ChatController.js'
import { CommandRegistry } from '../../internal/chat/CommandRegistry.js'
import { MenuHandler } from '../../internal/chat/MenuHandler.js'
import { BaseGrokCommand } from '../../internal/BaseGrokCommand.js'
import '../../internal/tools/FileTool.js' // Import to register tools in toolRegistry

// Defines the CLI command to initiate an interactive Grok chat session
export default class Chat extends BaseGrokCommand {
  static description = `
Start an interactive chat session with Grok 3, an AI assistant from xAI...
`
  static examples = [
    '$ z grok chat',
    'Start a chat session, resuming the active conversation or creating a new one if none exists.',
    '',
    '$ z grok chat -v',
    'Run in visible mode to see the browser UI, useful for debugging or CAPTCHA resolution.',
    '',
    '$ z grok chat -c <conversation-id>',
    'Resume a specific conversation by ID, overriding the active one in config.',
    '',
    '$ z grok chat -n',
    'Force a new conversation, ignoring any active conversation ID in config.',
    '',
    '$ z grok chat -f "./docs/*.md" -t file',
    'Start a chat with up to 10 files uploaded from ./docs/*.md and enable the "file" tool for JSON responses.',
    '',
    '$ z grok chat -v -n -t file',
    'Start a new conversation in visible mode with the "file" tool enabled.'
  ]
  static flags = {
    conversation: Flags.string({ char: 'c', description: 'Use a specific conversation ID', name: 'conversation-id' }),
    files: Flags.string({ char: 'f', description: 'Glob pattern for files to upload', name: 'files' }),
    visible: Flags.boolean({ char: 'v', description: 'Run with visible browser', name: 'visible', default: false }),
    tools: Flags.string({ char: 't', description: 'Enable a specific tool', name: 'tools' }),
    new: Flags.boolean({ char: 'n', description: 'Force a new conversation', name: 'new', default: false })
  }

  // Executes the chat command with the provided flags
  async run(): Promise<void> {
    const { flags } = await this.parse(Chat)
    const page = await this.setupBrowser('https://grok.com', undefined, !flags.visible)

    const commandRegistry = new CommandRegistry()
    const menuHandler = new MenuHandler()
    const controller = new ChatController(
      page,
      commandRegistry,
      menuHandler,
      flags.conversation || '',
      this.config.configDir
    )

    try {
      await controller.run(flags)
    } catch (error) {
      this.log(chalk.red(`Error: ${(error as Error).message}`))
    } finally {
      await this.cleanup()
    }
  }
}