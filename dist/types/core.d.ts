export interface AIONEConfig {
    baseDir?: string;
    provider?: 'anthropic' | 'openai' | 'local';
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    debug?: boolean;
}
export interface DA {
    name: string;
    fullName?: string;
    voice?: string;
    personality?: string;
    identityFile?: string;
}
export interface AgentResponse {
    content: string;
    done: boolean;
    metrics?: {
        tokensUsed?: number;
        durationMs?: number;
        toolsCalled?: number;
    };
}
export interface ExecutionContext {
    config: AIONEConfig;
    da: DA;
    sessionId: string;
    startTime: number;
}
//# sourceMappingURL=core.d.ts.map