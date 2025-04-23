import { createStateManager } from './IStateManager.js';

const CONFIG_KEY = 'webui-config';

export class WebUiConfig {
  serverUrl: string = 'http://localhost:3000'; // e.g., http://localhost:3000
  apiKey: string = ''; // Bearer token or API key
  defaultModel: string = 'llama3.1'; // e.g., "llama3.1"
  activeConversationId?: string;
}

export async function loadWebUiConfig(dataDir: string): Promise<WebUiConfig> {
  const stateManager = createStateManager(dataDir);
  if (await stateManager.containsState(CONFIG_KEY)) {
    const loadedConfig = await stateManager.load<WebUiConfig>(CONFIG_KEY);
    return { ...new WebUiConfig(), ...loadedConfig };
  } else {
    return new WebUiConfig();
  }
}

export async function saveWebUiConfig(dataDir: string, config: WebUiConfig): Promise<void> {
  const stateManager = createStateManager(dataDir);
  await stateManager.save(CONFIG_KEY, config);
}
