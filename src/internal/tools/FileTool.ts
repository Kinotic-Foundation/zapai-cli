import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import { GrokTool, toolRegistry, GrokModelResponse } from './GrokTool.js'

interface FileEntry {
    name: string
    path: string
    body: string
}

// Implements a tool to process responses as JSON and write files to the filesystem
export class FileTool implements GrokTool {
    name = 'file'
    description = 'Requests responses as JSON with a summary and files array, then writes them to the filesystem within the current directory'

    constructor() {}

    // Modifies the prompt to request a JSON response with specific structure
    async preprocessPrompt(prompt: string): Promise<string> {
        return `${prompt}\n\nFor this response and this response only. Return *only* a JSON object with no additional text before or after. 
        Do not include any code blocks or any other characters only JSON. 
        The JSON must contain:
- A 'summary' field with a brief summary of your response as a string.
- A 'files' array where each entry is an object with:
  - 'name': a descriptive file name (e.g., 'script.js' or 'readme.md'),
  - 'path': a relative path (e.g., './src' or './docs'),
  - 'body': the file content as a string.
Ensure the files are relevant to the request and use appropriate extensions for the content type. Example: {"summary":"Summary text","files":[{"name":"example.md","path":"./docs","body":"Content"}]}`
    }

    private async writeFile(file: FileEntry): Promise<void> {
        const cwd = process.cwd()
        const fullPath = path.resolve(cwd, file.path, file.name) // Resolve to absolute path
        if (!fullPath.startsWith(cwd)) {
            console.warn(`Rejected file '${file.name}' at '${file.path}': Path attempts to escape current directory`)
            return
        }
        await fs.mkdir(path.dirname(fullPath), { recursive: true })
        await fs.writeFile(fullPath, file.body, 'utf-8')
        console.log(chalk.white(`Writing file: ${fullPath}`))
    }

    async postprocessResponse(response: GrokModelResponse): Promise<void> {
        try {
            console.log(chalk.grey('\nProcessing file tool response...'))
            let json: any = {}
            try {
                json = JSON.parse(response.message)
            } catch (e) {
                console.log(chalk.red(`Error: Failed to parse JSON response. ${e}\nRaw response: ${response.message}`))
                return
            }
            if (!json.summary || !Array.isArray(json.files)) {
                console.log(chalk.red(`Error: Invalid response format. Expected JSON with 'summary' and 'files'. Received: ${response.message}`))
            }
            const summary = json.summary + '\n'
            console.log(chalk.white(summary || 'No summary provided.'))
            for (const file of json.files) {
                if(!file.name || !file.path || !file.body) {
                    console.warn(`Invalid file entry: ${JSON.stringify(file, null, 2)}`)
                    continue
                }
                await this.writeFile(file)
            }
            console.log(chalk.white('Done! Check your directory.'))
        } catch (error) {
            console.log(chalk.red(`Error processing file tool response: ${(error as Error).message}\nRaw response: ${JSON.stringify(response)}`))
        }
    }
}

toolRegistry['file'] = new FileTool()