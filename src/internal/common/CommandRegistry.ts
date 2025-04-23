import chalk from 'chalk'
import { resolve } from 'path'
import { readdirSync, mkdirSync, rmSync } from 'fs'
import { ChatController } from './ChatController.js'

interface ChatCommand {
  name: string
  description: string
  execute(controller: ChatController, args: string[]): Promise<void>
}

// Registers and executes special chat commands like :cd and :ls
export class CommandRegistry {
  private commands: Map<string, ChatCommand> = new Map()

  constructor() {
    // Command to change the current working directory
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
    // Command to list contents of the current directory
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
    // Command to create a new directory
    this.register({
      name: 'mkdir',
      description: 'Create a new directory',
      execute: async (controller, args) => {
        if (args.length === 0) {
          console.log(chalk.yellow('Usage: :mkdir <directory-name>'))
          return
        }
        const dirPath = resolve(controller.getCwd(), args.join(' '))
        try {
          mkdirSync(dirPath)
          console.log(chalk.green(`Created directory: ${dirPath}`))
        } catch (error) {
          console.log(chalk.red(`Failed to create directory: ${(error as Error).message}`))
        }
      }
    })
    // Command to remove a file or directory
    this.register({
      name: 'rm',
      description: 'Remove a file or directory',
      execute: async (controller, args) => {
        if (args.length === 0) {
          console.log(chalk.yellow('Usage: :rm <path>'))
          return
        }
        const targetPath = resolve(controller.getCwd(), args.join(' '))
        try {
          rmSync(targetPath, { recursive: true, force: true })
          console.log(chalk.green(`Removed: ${targetPath}`))
        } catch (error) {
          console.log(chalk.red(`Failed to remove: ${(error as Error).message}`))
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