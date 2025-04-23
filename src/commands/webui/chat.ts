import { Flags } from '@oclif/core'
import chalk from 'chalk'
import { Command } from '@oclif/core'
import { ChatController } from '../../internal/common/ChatController.js'
import { CommandRegistry } from '../../internal/common/CommandRegistry.js'
import { MenuHandler } from '../../internal/common/MenuHandler.js'
import { ChatStreamer } from '../../internal/webui/ChatStreamer.js'
import { FileUploader } from '../../internal/webui/FileUploader.js'
import { loadWebUiConfig, saveWebUiConfig } from '../../internal/state/WebUiConfig.js'

export default class WebUiChat extends Command {
  static description = `
Start an interactive chat session with an Open WebUI server...
`
  static examples = [
    '$ zapai webui chat',
    'Start a chat session with WebUI.',
    '',
    '$ zapai webui chat -c <conversation-id>',
    'Resume a specific conversation by ID.',
    '',
    '$ zapai webui chat -n',
    'Force a new conversation.',
    '',
    '$ zapai webui chat -f "./docs/*.md" -t file',
    'Start a chat with files uploaded and enable the "file" tool.',
    '',
    '$ zapai webui chat -m llama3.1',
    'Start a chat with a specific model.',
  ]
  static flags = {
    conversation: Flags.string({ char: 'c', description: 'Use a specific conversation ID', name: 'conversation-id' }),
    files: Flags.string({ char: 'f', description: 'Glob pattern for files to upload', name: 'files' }),
    tools: Flags.string({ char: 't', description: 'Enable a specific tool', name: 'tools' }),
    new: Flags.boolean({ char: 'n', description: 'Force a new conversation', name: 'new', default: false }),
    model: Flags.string({ char: 'm', description: 'Model to use', name: 'model' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(WebUiChat)
    const config = await loadWebUiConfig(this.config.configDir)

    if (!config.apiKey) {
      this.log(chalk.red('No WebUI API key configured. Run `zapai webui config` first.'))
      throw new Error('No API key configured')
    }

    const webUiOptions = {
      serverUrl: config.serverUrl,
      apiKey: config.apiKey,
      model: flags.model || config.defaultModel,
    }

    const commandRegistry = new CommandRegistry()
    const menuHandler = new MenuHandler()
    const chatStreamer = new ChatStreamer(webUiOptions, flags.conversation || '')
    const fileUploader = new FileUploader([], process.cwd(), webUiOptions)

    const controller = new ChatController(
      commandRegistry,
      menuHandler,
      chatStreamer,
      fileUploader,
    )

    try {
      await controller.run(flags)
    } catch (error) {
      this.log(chalk.red(`Error: ${(error as Error).message}`))
    }
  }
}
