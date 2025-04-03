import { input, select } from '@inquirer/prompts'
import chalk from 'chalk'
import { resolve, dirname } from 'path'
import fileSelector from 'inquirer-file-selector'
import { ChatController } from './ChatController.js'
import { toolRegistry } from '../tools/GrokTool.js'
import { SavedPoint, saveGrokConfig } from '../state/ConfigGrok.js'
import * as crypto from 'crypto'
import {ChatStreamer} from './ChatStreamer.js'

interface MenuOption {
  name: string
  description: string
  action: (controller: ChatController) => Promise<void>
}

// Provides an interactive menu for managing chat options
export class MenuHandler {
  private options: MenuOption[] = []

  constructor() {
    // Option to toggle tools on or off
    this.options.push({
      name: 'Toggle Tool',
      description: 'Enable or disable a tool',
      action: async (controller) => {
        const toolChoices = [
          { name: 'None', value: 'none', checked: !controller.getEnabledTool() },
          ...Object.values(toolRegistry).map(t => ({
            name: `${t.name} - ${t.description}`,
            value: t.name,
            checked: controller.getEnabledTool()?.name === t.name
          }))
        ]
        const selected = await select({ message: chalk.blue('Select active tool:'), choices: toolChoices })
        controller.setEnabledTool(selected === 'none' ? null : toolRegistry[selected])
        console.log(chalk.green(`Active tool: ${controller.getEnabledTool()?.name || 'none'}`))
      }
    })

    this.options.push({
      name: 'Upload Files (Glob Pattern)',
      description: 'Upload files using a glob pattern',
      action: async (controller) => {
        const pattern = await input({ message: chalk.blue('Enter glob pattern (e.g., "./docs/*.txt", max 10 files):') })
        if (pattern) await controller.getFileUploader().uploadFiles(pattern.split(',').map(p => resolve(controller.getCwd(), p)))
      }
    })

    this.options.push({
      name: 'Upload Files (Browse)',
      description: 'Interactively browse and select files to upload',
      action: async (controller) => {
        const selectedFiles: string[] = []
        let lastDir = process.cwd()

        while (selectedFiles.length < 10) {
          const filePath = await fileSelector({
            message: chalk.blue(`Select file ${selectedFiles.length + 1}/10 (Arrow keys to navigate, Enter to confirm, Esc/Ctrl+C to finish):`),
            basePath: lastDir,
            type: 'file',
            pageSize: 10,
            allowCancel: true
          })

          if (filePath === 'canceled') {
            console.log(chalk.yellow('File selection canceled'))
            break
          } else if (!selectedFiles.includes(filePath)) {
            selectedFiles.push(filePath)
            lastDir = dirname(filePath)
            console.log(chalk.green(`Selected: ${filePath}`))
          } else {
            console.log(chalk.yellow(`File already selected: ${filePath}`))
          }
        }

        if (selectedFiles.length > 0) {
          const limitedFilePaths = selectedFiles.slice(0, 10)
          await controller.getFileUploader().uploadFiles(limitedFilePaths)
          console.log(chalk.green(`Uploaded ${limitedFilePaths.length} file(s)`))
        } else {
          console.log(chalk.yellow('No files selected'))
        }
      }
    })

    this.options.push({
      name: 'Save Point in Time',
      description: 'Save the current conversation state',
      action: async (controller) => {
        const name = await input({ message: chalk.blue('Enter name for this point in time:') })
        if (name) {
          const lastResponseId = controller.getChatStreamer().getLastResponseId()
          if (lastResponseId) {
            const label = `${controller.getChatStreamer().getConversationId()}-${name}`
            const key = label
            if (!controller.getGrokConfig().savedPoints) {
              controller.getGrokConfig().savedPoints = {}
            }
            controller.getGrokConfig().savedPoints[key] = { label, previousResponseId: lastResponseId }
            await saveGrokConfig(controller['configDir'], controller.getGrokConfig())
            console.log(chalk.green(`Saved point '${label}' with responseId: ${lastResponseId}`))
          } else {
            console.log(chalk.yellow('No response ID available to save'))
          }
        } else {
          console.log(chalk.red('Name cannot be empty'))
        }
      }
    })

    this.options.push({
      name: 'Load Point in Time',
      description: 'Load a previously saved conversation state',
      action: async (controller) => {
        const savedPoints = controller.getGrokConfig().savedPoints || {}
        if (Object.keys(savedPoints).length === 0) {
          console.log(chalk.yellow('No saved points available'))
          return
        }

        const choices = Object.entries(savedPoints).map(([key, point]: [string, SavedPoint]) => ({
          name: `${point.label} (responseId: ${point.previousResponseId})`,
          value: key
        }))
        const selectedKey = await select({
          message: chalk.blue('Select a point in time to load:'),
          choices
        })

        const selectedPoint = savedPoints[selectedKey]
        const newConversationId = crypto.randomUUID()
        controller['conversationId'] = newConversationId
        controller['chatStreamer'] = new ChatStreamer(controller['page'], newConversationId, selectedPoint.previousResponseId)
        controller['fileIds'] = []
        controller.getGrokConfig().activeConversationId = newConversationId
        await saveGrokConfig(controller['configDir'], controller.getGrokConfig())
        console.log(chalk.green(`Loaded point '${selectedPoint.label}' with responseId: ${selectedPoint.previousResponseId} in new conversation: ${newConversationId}`))
      }
    })
  }

  async showMenu(controller: ChatController): Promise<void> {
    const choices = this.options.map(o => ({ name: o.name, value: o }))
    const selected = await select({ message: chalk.blue('Chat Menu:'), choices })
    await selected.action(controller)
  }

  registerOption(option: MenuOption): void {
    this.options.push(option)
  }
}