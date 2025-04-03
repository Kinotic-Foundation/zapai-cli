import chalk from 'chalk'
import { resolve } from 'path'
import { readdirSync } from 'fs'
import { ChatController } from './ChatController.js'

interface ChatCommand {
  name: string
  description: string
  execute(controller: ChatController, args: string[]): Promise<void>
}

// Manages special commands like :cd and :ls
export class CommandRegistry {
  private commands: Map<string, ChatCommand> = new Map()

  constructor() {
    // :cd command to change directory
    this.register({
      name: 'cd',
      description: 'Change working directory',
      execute: async (controller, args) => {
        if (args.length === 0) {
          console.log(chalk.yellow('Usage: :cd <path>'))
          return
        }
        const newDir = resolve(controller.getCwd(), args.join(' '))
        try {
          process.chdir(newDir)
          controller.setCwd(newDir)
          console.log(chalk.green(`Changed directory to: ${newDir}`))
        } catch (error) {
          console.log(chalk.red(`Failed to change directory: ${(error as Error).message}`))
        }
      }
    })
    // :ls command to list directory contents
    this.register({
      name: 'ls',
      description: 'List directory contents',
      execute: async (controller) => {
        try {
          const files = readdirSync(controller.getCwd())
          console.log(chalk.blue('Directory contents:'))
          files.forEach(file => console.log(chalk.white(file)))
        } catch (error) {
          console.log(chalk.red(`Failed to list directory: ${(error as Error).message}`))
        }
      }
    })
  }

  register(command: ChatCommand): void {
    this.commands.set(command.name, command)
  }

  async execute(input: string, controller: ChatController): Promise<void> {
    const [commandName, ...args] = input.slice(1).split(' ')
    const command = this.commands.get(commandName)
    if (command) {
      await command.execute(controller, args)
    } else {
      console.log(chalk.red(`Unknown command: ${commandName}`))
    }
  }
}