import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import { Page } from 'puppeteer'

// Facilitates uploading files to the Grok chat session
export class FileUploader {
    constructor(private page: Page, private fileIds: string[]) {}

    // Uploads files and stores their IDs for attachment to messages
    async uploadFiles(paths: string[]): Promise<void> {
        for (const filePath of paths) {
            try {
                const contentBuffer = await fs.readFile(filePath)
                const content = contentBuffer.toString('base64')
                const fileName = path.basename(filePath)
                const uploadResponse = await this.page.evaluate(async (fileData) => {
                    const response = await fetch('/rest/app-chat/upload-file', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': '*/*',
                            'Origin': 'https://grok.com',
                            'Referer': 'https://grok.com/'
                        },
                        body: JSON.stringify(fileData)
                    })
                    return await response.json()
                }, { fileName, fileMimeType: '', content })

                const fileId = uploadResponse.fileMetadataId
                if (fileId) {
                    this.fileIds.push(fileId)
                    console.log(chalk.green(`Uploaded file: ${fileName} (ID: ${fileId})`))
                } else {
                    console.log(chalk.red(`Failed to get file ID for ${fileName}. Response: ${JSON.stringify(uploadResponse)}`))
                }
            } catch (error) {
                console.log(chalk.red(`Upload error for ${filePath}: ${(error as Error).message}`))
            }
        }
    }
}