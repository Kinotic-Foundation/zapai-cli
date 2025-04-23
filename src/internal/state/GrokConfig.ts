import { createStateManager } from './IStateManager.js'

const CONFIG_KEY = 'grok-config'

export class GrokConfig {
    private readonly dataDir: string
    grokCookie?: string
    activeConversationId?: string

    constructor(dataDir: string) {
        this.dataDir = dataDir
    }

    public async save(): Promise<void> {
        await saveGrokConfig(this.dataDir, this)
    }
}

export async function loadGrokConfig(dataDir: string): Promise<GrokConfig> {
    const stateManager = createStateManager(dataDir)
    if (await stateManager.containsState(CONFIG_KEY)) {
        const loadedConfig = await stateManager.load<GrokConfig>(CONFIG_KEY)
        // Merge loaded config with defaults to ensure savedPoints exists
        const defaultConfig = new GrokConfig(dataDir)
        Object.assign(defaultConfig, loadedConfig)
        return defaultConfig
    } else {
        return new GrokConfig(dataDir)
    }
}

export async function saveGrokConfig(dataDir: string, config: GrokConfig): Promise<void> {
    const stateManager = createStateManager(dataDir)
    await stateManager.save(CONFIG_KEY, config)
}