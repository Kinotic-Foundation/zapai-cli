import chalk from 'chalk'
import { Page } from 'puppeteer'

export class ConversationManager {
    constructor(private page: Page) {}

    async loadConversationHistory(conversationId: string): Promise<string | undefined> {
        const historyResponse = await this.page.evaluate(async (url) => {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': '*/*',
                    'Origin': 'https://grok.com',
                    'Referer': 'https://grok.com/'
                }
            })
            return await response.json()
        }, `https://grok.com/rest/app-chat/conversations/${conversationId}/response-node`)

        if (historyResponse.responseNodes && historyResponse.responseNodes.length > 0) {
            const assistantResponses = historyResponse.responseNodes
                                                      .filter((node: any) => node.sender === 'ASSISTANT')
            if (assistantResponses.length > 0) {
                const lastAssistantResponse = assistantResponses[assistantResponses.length - 1]
                const parentResponseId = lastAssistantResponse.responseId
                console.log(chalk.gray(`Loaded conversation context with parentResponseId: ${parentResponseId}`))
                return parentResponseId
            }
        }
        return undefined
    }
}