import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { Command } from '@oclif/core';
import { loadWebUiConfig, saveWebUiConfig } from '../../internal/state/WebUiConfig.js';

interface Conversation {
  id: string;
  title: string;
  create_time: string;
  modify_time: string;
}

export default class WebUiConversations extends Command {
  static description = 'List and select WebUI conversations';
  static examples = [
    '$ zapai webui conversations',
    'List available conversations and select one to set as active.',
  ];

  async run(): Promise<void> {
    const config = await loadWebUiConfig(this.config.configDir);

    if (!config.apiKey) {
      this.log(chalk.red('No WebUI API key configured. Run `zapai webui config` first.'));
      throw new Error('No API key configured');
    }

    try {
      const response = await fetch(`${config.serverUrl}/api/chats?page=1`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        this.log(chalk.red(`Error fetching conversations: ${error.detail || 'Unknown error'}`));
        return;
      }

      const json: { chats: Conversation[] } = await response.json();
      const conversations = json.chats || [];

      if (!conversations.length) {
        this.log(chalk.yellow('No conversations found.'));
        return;
      }

      const choices = [
        { name: 'None (clear active conversation)', value: '' },
        ...conversations.map((conv) => ({
          name: `${conv.title} (${conv.id}) - Last modified: ${new Date(conv.modify_time).toLocaleString()}`,
          value: conv.id,
        })),
      ];

      const selectedId = await select({
        message: chalk.blue('Select a conversation to set as active (or None to clear):'),
        choices,
      });

      config.activeConversationId = selectedId;
      await saveWebUiConfig(this.config.configDir, config);
      this.log(chalk.green(`Active conversation set to: ${selectedId || 'none'}`));
    } catch (error) {
      this.log(chalk.red(`Error fetching conversations: ${(error as Error).message}`));
      this.log(chalk.yellow('Conversation listing may not be supported by this WebUI server.'));
    }
  }
}
