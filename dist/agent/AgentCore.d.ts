/**
 * Agent Core — The AI execution engine
 *
 * Handles LLM communication, tool orchestration, and session management.
 * Currently provides a template; integrate with actual LLM APIs for full functionality.
 */
import { AIONEConfig, AgentResponse, ExecutionContext } from '../types/core';
import { MemorySystem } from '../memory/MemorySystem';
import { SkillSystem } from '../skills/SkillSystem';
import { HookSystem } from '../hooks/HookSystem';
export declare class AgentCore {
    private config;
    private memory;
    private skills;
    private hooks;
    constructor(config: AIONEConfig, memory: MemorySystem, skills: SkillSystem, hooks: HookSystem);
    /**
     * Run a single turn with the agent
     */
    run(userInput: string, context: ExecutionContext): Promise<AgentResponse>;
    /**
     * Build system prompt with DA identity, ISC, and recent memory
     */
    private buildSystemPrompt;
    /**
     * Get conversation history for a session
     */
    private getConversationHistory;
    /**
     * Call the LLM API
     */
    private callLLM;
    private callAnthropic;
    private callOpenAI;
    private generateDemoResponse;
}
//# sourceMappingURL=AgentCore.d.ts.map