import { input, select } from '@inquirer/prompts'
import chalk from 'chalk'
import { resolve, dirname } from 'path'
import fileSelector from 'inquirer-file-selector'
import { ChatController } from './ChatController.js'
import { toolRegistry } from '../tools/GrokTool.js'

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