export interface AIONEConfig {
    /** Path to the AIONE data directory (default: ~/.aione) */
    baseDir?: string;
    /** LLM provider: 'anthropic' | 'openai' | 'local' */
    provider?: 'anthropic' | 'openai' | 'local';
    /** API key for the LLM provider */
    apiKey?: string;
    /** Base URL for API (for local/custom endpoints) */
    baseUrl?: string;
    /** Model to use (default: claude-sonnet-4-20250514) */
    model?: string;
    /** Maximum tokens for responses */
    maxTokens?: number;
    /** Temperature (0-1, default: 0.7) */
    temperature?: number;
    /** Enable debug logging */
    debug?: boolean;
}
export interface Skill {
    name: string;
    description: string;
    /** Cost: 'low' | 'medium' | 'high' */
    effort?: 'low' | 'medium' | 'high';
    /** Path to SKILL.md or inline content */
    source?: string;
    /** Directory containing the skill */
    dir?: string;
    /** Workflows provided by this skill */
    workflows?: Workflow[];
    /** Custom tools provided by this skill */
    tools?: Tool[];
    /** Tags for routing */
    tags?: string[];
}
export interface Workflow {
    name: string;
    description: string;
    /** Path to workflow markdown file */
    source: string;
    /** Trigger phrases that route to this workflow */
    triggers?: string[];
}
export interface Tool {
    name: string;
    description: string;
    /** Path to tool script */
    script: string;
    /** Runtime: 'bun' | 'node' | 'bash' */
    runtime?: 'bun' | 'node' | 'bash';
    /** Arguments schema */
    args?: ToolArg[];
}
export interface ToolArg {
    name: string;
    description?: string;
    required?: boolean;
    default?: string;
}
export interface MemoryEntry {
    id: string;
    timestamp: string;
    type: 'WORK' | 'KNOWLEDGE' | 'LEARNING' | 'RELATIONSHIP' | 'OBSERVATION' | 'STATE';
    content: string;
    /** Tags for search */
    tags?: string[];
    /** Source skill or workflow */
    source?: string;
    /** Importance 1-5 */
    importance?: number;
}
export interface Hook {
    name: string;
    /** Event that triggers this hook: SessionStart | UserPromptSubmit | PreToolUse | PostToolUse | Stop | SessionEnd */
    event: HookEvent;
    /** Script to execute */
    script: string;
    /** Runtime */
    runtime?: 'bun' | 'node' | 'bash';
    /** Whether hook is enabled */
    enabled?: boolean;
}
export type HookEvent = 'SessionStart' | 'UserPromptSubmit' | 'PreToolUse' | 'PostToolUse' | 'Stop' | 'SessionEnd' | 'PreCompact' | 'PostCompact';
export interface ISC {
    problem: string;
    vision: string;
    scope: string;
    principles: string[];
    constraints: string[];
    goal: string;
    criteria: string[];
    testStrategy: string;
    features: string[];
    decisions: string[];
    changing: string[];
    verification: string[];
    /** Unique identity document */
    identity?: string;
}
export interface DA {
    name: string;
    fullName?: string;
    voice?: string;
    personality?: string;
    /** Path to identity file */
    identityFile?: string;
}
export interface AlgorithmResult {
    currentState: string;
    idealState: string;
    gap: string[];
    transitions: Transition[];
    /** Quality score 0-100 */
    quality: number;
}
export interface Transition {
    phase: number;
    name: string;
    action: string;
    expected: string;
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
    isc: ISC;
    sessionId: string;
    startTime: number;
    skill?: string;
    workflow?: string;
}
export * from './types/core';
export * from './types/skill';
export * from './types/memory';
export * from './types/workflow';
export * from './types/hook';
export * from './types/algorithm';
//# sourceMappingURL=index.d.ts.map