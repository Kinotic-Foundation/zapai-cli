import { JSONParser } from '@streamparser/json-node'
import chalk from 'chalk'
import ora from 'ora'
import { Page } from 'puppeteer'
import { Writable } from 'stream'
import { GrokModelResponse, GrokTool } from '../tools/GrokTool.js'

// Manages real-time streaming of chat responses from the Grok API
export class ChatStreamer {
  private lastResponseId: string
  private conversationId: string

  constructor(private page: Page, conversationId: string, initialParentResponseId: string = '') {
    this.conversationId = conversationId
    this.lastResponseId = initialParentResponseId
  }

  // Streams chat responses, handling tokens and applying tools if specified
  async streamChat(userInput: string, fileIds: string[], tool: GrokTool | null): Promise<void> {
    const spinner = ora('Grok is thinking...').start()
    try {
      let processedPrompt = userInput
      if (tool) processedPrompt = await tool.preprocessPrompt(processedPrompt)

      const payload = {
        temporary: false,
        modelName: 'grok-3',
        message: processedPrompt,
        fileAttachments: fileIds.slice(0, 10),
        imageAttachments: [],
        disableSearch: false,
        enableImageGeneration: true,
        returnImageBytes: false,
        enableImageStreaming: true,
        imageGenerationCount: 2,
        forceConcise: false,
        toolOverrides: {},
        enableSideBySide: true,
        sendFinalMetadata: true,
        isReasoning: false,
        webpageUrls: [],
        disableTextFollowUps: true,
        parentResponseId: this.lastResponseId
      }

      let fullResponse = ''
      let spinnerStopped = false
      let modelResponse: GrokModelResponse | null = null

      const endpoint = this.conversationId
        ? `https://grok.com/rest/app-chat/conversations/${this.conversationId}/responses`
        : 'https://grok.com/rest/app-chat/conversations/new'

      const responsePromise = new Promise<string>((resolve) => {
        const timeout = setTimeout(() => resolve('Error: Response timeout after 30 minutes'), 1800000)
        const parser = new JSONParser({ paths: ['$.result', '$.error'], keepStack: false, separator: '' })

        const chunkWriter = new Writable({
          write(chunk, encoding, callback) {
            const text = chunk.toString()
            if (text.startsWith('STREAM_CHUNK:')) {
              parser.write(text.substring(13))
            } else if (text === 'STREAM_END') {
              parser.end()
            } else if (text.startsWith('STREAM_ERROR:')) {
              console.log(chalk.red(`Error: ${text.substring(13)}`))
              resolve('')
            }
            callback()
          }
        })

        parser.on('data', ({ value }) => {
          if (value && 'code' in value && 'message' in value) {
            console.log(chalk.red(`Error: ${JSON.stringify(value)}`))
            resolve('')
            return
          }
          if (!this.conversationId && value?.conversation?.conversationId) {
            this.conversationId = value.conversation.conversationId
          }
          const token = value?.token || value?.response?.token
          if (token && typeof token === 'string' && token !== '') {
            if (!spinnerStopped) {
              spinner.stop()
              spinnerStopped = true
            }
            fullResponse += token
            if (tool){
              process.stdout.write(chalk.gray(token))
            } else if (!tool) {
              process.stdout.write(chalk.white(token))
            }
          } else {
            const mr = value?.modelResponse || value?.response?.modelResponse
            if (mr) {
              if (!spinnerStopped) {
                spinner.stop()
                spinnerStopped = true
              }
              fullResponse = mr.message
              this.lastResponseId = mr.responseId
              modelResponse = mr
              if (!tool) process.stdout.write(chalk.white(fullResponse))
            }
          }
        })

        parser.on('error', (error: Error) => console.log(chalk.yellow(`Stream parse error: ${error.message}`)))
        parser.on('end', () => {
          clearTimeout(timeout)
          this.page.off('console', handleConsole)
          resolve(fullResponse)
        })

        const handleConsole = (msg: any) => chunkWriter.write(msg.text())
        this.page.on('console', handleConsole)

        this.page.evaluate(async (url, body) => {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': '*/*',
              'Origin': 'https://grok.com',
              'Referer': 'https://grok.com/'
            },
            body: JSON.stringify(body)
          })
          if (!response.body) {
            console.log('STREAM_ERROR: No response body')
            return
          }
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              console.log('STREAM_END')
              break
            }
            const chunk = decoder.decode(value, { stream: true })
            console.log('STREAM_CHUNK:' + chunk)
          }
        }, endpoint, payload)
      })

      await responsePromise
      if (tool){
        if(modelResponse){
          await tool.postprocessResponse(modelResponse)
        }else{
          process.stdout.write(chalk.red(`Tool error: No model response available`))
        }
      }

      if (!spinnerStopped) spinner.stop()
      process.stdout.write('\n')
    } catch (error) {
      spinner.fail(chalk.red(`Chat error: ${(error as Error).message}`))
    }
  }

  getLastResponseId(): string { return this.lastResponseId }
  getConversationId(): string { return this.conversationId }
}