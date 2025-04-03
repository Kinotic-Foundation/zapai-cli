import { input, select } from '@inquirer/prompts'
import { Flags } from '@oclif/core'
import chalk from 'chalk'
import { glob } from 'glob'
import { Page } from 'puppeteer'
import { ConfigGrok, loadGrokConfig, saveGrokConfig } from '../../internal/state/ConfigGrok.js'
import { GrokTool, toolRegistry } from '../../internal/tools/GrokTool.js'
import { ChatStreamer } from '../../internal/utils/ChatStreamer.js'
import { FileUploader } from '../../internal/utils/FileUploader.js'
import { ConversationManager } from '../../internal/utils/ConversationManager.js'
import { BaseGrokCommand } from '../../internal/BaseGrokCommand.js'
import '../../internal/tools/FileTool.js'

export default class Chat extends BaseGrokCommand {
    static description = `
Start an interactive chat session with Grok 3, an AI assistant from xAI. This command opens a browser session to grok.com, allowing real-time interaction with Grok. You can upload files, enable tools, save/load conversation states, and switch conversations via an interactive menu.

Features:
- Persistent conversation IDs stored in config (~/.config/z/config.json)
- File uploads via glob patterns (max 10 files per message)
- Tool integration (e.g., 'file' tool for JSON-based file writing)
- Browser visibility toggle for debugging or manual interaction
- Menu-driven options: toggle tools, upload files, save/load points in time
- Automatic new conversation creation if none specified, with optional override

Requires a valid Grok cookie configured via 'z grok config' for authentication.
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
        conversation: Flags.string({
                                       char: 'c',
                                       description: 'Use a specific conversation ID to resume an existing chat, overriding the active ID in config.',
                                       name: 'conversation-id'
                                   }),
        files: Flags.string({
                                char: 'f',
                                description: 'Glob pattern for files to upload before starting the chat (e.g., "./docs/*.txt"). Max 10 files will be uploaded and sent per message.',
                                name: 'files'
                            }),
        visible: Flags.boolean({
                                   char: 'v',
                                   description: 'Run with a visible browser window (non-headless mode) instead of headless. Useful for manual interaction or debugging.',
                                   name: 'visible',
                                   default: false
                               }),
        tools: Flags.string({
                                char: 't',
                                description: 'Enable a specific tool for the session (e.g., "file" to process JSON responses and write files). Only one tool can be active at a time.',
                                name: 'tools'
                            }),
        new: Flags.boolean({
                               char: 'n',
                               description: 'Force the creation of a new conversation, ignoring any active conversation ID in the config. Useful for starting fresh without modifying config.',
                               name: 'new',
                               default: false
                           })
    }

    private page!: Page
    private conversationId: string = ''
    private enabledTool: GrokTool | null = null
    private fileIds: string[] = []
    private chatStreamer!: ChatStreamer
    private initialParentResponseId: string = ''
    private grokConfig!: ConfigGrok
    private fileUploader!: FileUploader
    private conversationManager!: ConversationManager
    private chatActive: boolean = false

    async run(): Promise<void> {
        const { flags } = await this.parse(Chat)
        await this.initialize(flags)

        try {
            await this.setupChatPage(flags.visible)
            if (flags.files) {
                await this.uploadFiles(flags.files)
            }

            this.log(chalk.blue('Interactive chat started. Type ') + chalk.yellow(':') + chalk.blue(' for menu, ') + chalk.yellow('\\q') + chalk.blue(' to exit'))
            await this.chatLoop(flags.visible)
        } catch (error) {
            this.log(chalk.red(`Error: ${(error as Error).message}`))
        } finally {
            await this.cleanup()
        }
    }

    private async initialize(flags: any): Promise<void> {
        this.grokConfig = await loadGrokConfig(this.config.configDir)
        if (flags.new) {
            this.conversationId = ''
            this.log(chalk.yellow('Starting a new conversation (ignoring active ID)'))
        } else {
            this.conversationId = flags.conversation || this.grokConfig.activeConversationId || ''
            if (this.conversationId && this.conversationId !== this.grokConfig.activeConversationId) {
                this.grokConfig.activeConversationId = this.conversationId
                await saveGrokConfig(this.config.configDir, this.grokConfig)
                this.log(chalk.yellow(`Active conversation set to: ${this.conversationId}`))
            }
        }
    }

    private async setupChatPage(visible: boolean): Promise<void> {
        const url = this.conversationId ? `https://grok.com/chat/${this.conversationId}` : 'https://grok.com'
        this.page = await this.setupBrowser(url, undefined, !visible)
        this.fileUploader = new FileUploader(this.page, this.fileIds)
        this.conversationManager = new ConversationManager(this.page)
        this.chatStreamer = new ChatStreamer(this.page, this.conversationId, this.initialParentResponseId)

        this.browser!.on('disconnected', () => {
            this.log(chalk.blue('Browser closed. Ending chat session...'))
            this.chatActive = false
            process.exit(0)
        })

        if (this.conversationId) {
            this.initialParentResponseId = (await this.conversationManager.loadConversationHistory(this.conversationId)) || ''
            if (this.initialParentResponseId) {
                this.chatStreamer = new ChatStreamer(this.page, this.conversationId, this.initialParentResponseId)
            }
        }

        try {
            await this.page.waitForSelector('textarea[aria-label="Ask Grok anything"]', { timeout: 30000 })
        } catch (error) {
            this.log(chalk.red('Timed out waiting for chat UI'))
            const content = await this.page.content()
            this.log(chalk.yellow('Page content after timeout:'), content)
            throw new Error('Failed to load chat UI')
        }
    }

    private async uploadFiles(globPattern: string): Promise<void> {
        const filePaths = await glob(globPattern)
        if (filePaths.length > 0) {
            const limitedFilePaths = filePaths.slice(0, 10) // Cap at 10 files
            await this.fileUploader.uploadFiles(limitedFilePaths)
            if (filePaths.length > 10) {
                this.log(chalk.yellow(`Only the first 10 files were uploaded due to message limit. Total matched: ${filePaths.length}`))
            }
        } else {
            this.log(chalk.yellow(`No files matched glob pattern: ${globPattern}`))
        }
    }

    private async chatLoop(verbose: boolean): Promise<void> {
        this.chatActive = true
        while (this.chatActive) {
            const userInput = await input({ message: chalk.green('You:') })

            if (userInput.trim() === '\\q') {
                this.chatActive = false
            } else if (userInput.trim() === ':') {
                await this.showMenu()
            } else {
                const response = await this.chatStreamer.streamChat(userInput, this.fileIds, this.enabledTool, verbose)
                if (!this.conversationId && this.chatStreamer.getConversationId()) {
                    this.conversationId = this.chatStreamer.getConversationId()
                    this.grokConfig.activeConversationId = this.conversationId
                    await saveGrokConfig(this.config.configDir, this.grokConfig)
                    this.log(chalk.yellow(`Active conversation set to: ${this.conversationId}`))
                }
                this.fileIds = [] // Clear fileIds after each message
            }
        }
        this.log(chalk.blue('Chat session ended'))
    }

    private async showMenu(): Promise<void> {
        const choices = [
            { name: 'Toggle Tool', value: 'tool' },
            { name: 'Upload Files', value: 'files' },
            { name: 'Save Point in Time', value: 'save' },
            { name: 'Load Point in Time', value: 'load' },
            { name: 'Back to Chat', value: 'back' }
        ]
        const action = await select({
                                        message: chalk.blue('Chat Menu:'),
                                        choices
                                    })

        switch (action) {
            case 'tool':
                await this.toggleTool()
                break
            case 'files':
                await this.uploadMoreFiles()
                break
            case 'save':
                await this.savePointInTime()
                break
            case 'load':
                await this.loadPointInTime()
                break
            case 'back':
                break
        }
    }

    private async toggleTool(): Promise<void> {
        console.log(chalk.blue(`Available tools in registry: ${JSON.stringify(Object.keys(toolRegistry))}`))
        const toolChoices = Object.values(toolRegistry).map(tool => ({
            name: `${tool.name} - ${tool.description}`,
            value: tool.name,
            checked: this.enabledTool?.name === tool.name
        }))
        toolChoices.unshift({ name: 'None', value: 'none', checked: !this.enabledTool })
        const selectedToolName = await select({
                                                  message: chalk.blue('Select active tool:'),
                                                  choices: toolChoices
                                              })
        this.enabledTool = selectedToolName === 'none' ? null : toolRegistry[selectedToolName]
        this.log(chalk.green(`Active tool: ${this.enabledTool ? this.enabledTool.name : 'none'}`))
    }

    private async uploadMoreFiles(): Promise<void> {
        const pattern = await input({ message: chalk.blue('Enter glob pattern for files to upload (e.g., "./docs/*.txt", max 10 files):') })
        if (pattern) {
            await this.uploadFiles(pattern)
        }
    }

    private async savePointInTime(): Promise<void> {
        const name = await input({ message: chalk.blue('Enter name for this point in time:') })
        if (name) {
            const lastResponseId = this.chatStreamer.getLastResponseId()
            if (lastResponseId) {
                const label = `${this.conversationId}-${name}`
                const key = label
                if (!this.grokConfig.savedPoints) {
                    this.grokConfig.savedPoints = {}
                }
                this.grokConfig.savedPoints[key] = { label, previousResponseId: lastResponseId }
                await saveGrokConfig(this.config.configDir, this.grokConfig)
                this.log(chalk.green(`Saved point '${label}' with responseId: ${lastResponseId}`))
            } else {
                this.log(chalk.yellow('No response ID available to save'))
            }
        } else {
            this.log(chalk.red('Name cannot be empty'))
        }
    }

    private async loadPointInTime(): Promise<void> {
        if (Object.keys(this.grokConfig.savedPoints).length === 0) {
            this.log(chalk.yellow('No saved points available'))
            return
        }

        const choices = Object.entries(this.grokConfig.savedPoints).map(([key, point]) => ({
            name: `${point.label} (responseId: ${point.previousResponseId})`,
            value: key
        }))
        const selectedKey = await select({
                                             message: chalk.blue('Select a point in time to load:'),
                                             choices
                                         })

        const selectedPoint = this.grokConfig.savedPoints[selectedKey]
        this.conversationId = crypto.randomUUID()
        this.chatStreamer = new ChatStreamer(this.page, this.conversationId, selectedPoint.previousResponseId)
        this.fileIds = []
        this.grokConfig.activeConversationId = this.conversationId
        await saveGrokConfig(this.config.configDir, this.grokConfig)
        this.log(chalk.green(`Loaded point '${selectedPoint.label}' with responseId: ${selectedPoint.previousResponseId} in new conversation: ${this.conversationId}`))
    }
}