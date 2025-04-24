import chalk from 'chalk'
import ora from 'ora'
import fetch from 'node-fetch'
import { Writable } from 'stream'
import { GrokTool, GrokModelResponse } from '../tools/GrokTool.js'
import { ChatStreamer as ChatStreamerInterface } from '../common/Interfaces.js'

export interface WebUiOptions {
  serverUrl: string
  apiKey: string
  model: string
}

interface ChatErrorResponse {
  error?: { message: string }
}

export class WebUiChatStreamer implements ChatStreamerInterface {
  private messageHistory: { role: string; content: string }[] = []

  constructor(private options: WebUiOptions) {}

  async streamChat(userInput: string, fileIds: string[], tool: GrokTool | null): Promise<void> {
    const spinner = ora('WebUI is thinking...').start()
    try {
      let processedPrompt = userInput
      if (tool) processedPrompt = await tool.preprocessPrompt(processedPrompt)

      this.messageHistory.push({ role: 'user', content: processedPrompt })

      const response = await fetch(`${this.options.serverUrl}/api/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          model: this.options.model,
          messages: this.messageHistory,
          stream: true,
          files: fileIds.length > 0 ? fileIds.map(id => ({ type: 'file', id })) : undefined,
        }),
      })

      if (!response.ok) {
        const errorJson = await response.json()
        if (this.isChatErrorResponse(errorJson) && errorJson.error?.message) {
          throw new Error(errorJson.error.message)
        } else {
          throw new Error('Failed to fetch response: Unknown error format')
        }
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      let fullResponse = ''
      let modelResponse: GrokModelResponse | null = null
      const reader = (response.body as unknown as ReadableStream<Uint8Array>).getReader()
      const decoder = new TextDecoder()

      const chunkWriter = new Writable({
        write(chunk, encoding, callback) {
          const text = chunk.toString()
          const lines = text.split('\n').filter((line: string) => line.trim())
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') return callback()
              try {
                const parsed = JSON.parse(data)
                const token = parsed.choices[0]?.delta?.content
                if (token) {
                  fullResponse += token
                  spinner.stop()
                  process.stdout.write(chalk.white(token))
                }
              } catch (e) {
                console.log(chalk.yellow(`Parse error: ${e}`))
              }
            }
          }
          callback()
        },
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunkWriter.write(decoder.decode(value, { stream: true }))
      }

      this.messageHistory.push({ role: 'assistant', content: fullResponse })
      modelResponse = {
        responseId: Date.now().toString(),
        message: fullResponse,
        sender: 'ASSISTANT',
        createTime: new Date().toISOString(),
        parentResponseId: '',
        manual: false,
        partial: false,
        shared: false,
        query: userInput,
        queryType: 'text',
        webSearchResults: [],
        xpostIds: [],
        xposts: [],
        generatedImageUrls: [],
        imageAttachments: [],
        fileAttachments: fileIds.map(id => ({ id })),
        cardAttachmentsJson: [],
        fileUris: [],
        fileAttachmentsMetadata: [],
        isControl: false,
        steps: [],
        imageEditUris: [],
        mediaTypes: [],
        webpageUrls: [],
        metadata: { deepsearchPreset: '' },
      }

      if (tool && modelResponse) {
        await tool.postprocessResponse(modelResponse)
      }

      spinner.stop()
      process.stdout.write('\n')
    } catch (error) {
      spinner.fail(chalk.red(`Chat error: ${(error as Error).message}`))
    }
  }

  private isChatErrorResponse(obj: any): obj is ChatErrorResponse {
    return obj && typeof obj === 'object' && 'error' in obj && obj.error && typeof obj.error.message === 'string'
  }
}


