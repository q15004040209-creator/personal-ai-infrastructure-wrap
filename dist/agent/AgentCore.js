"use strict";
/**
 * Agent Core — The AI execution engine
 *
 * Handles LLM communication, tool orchestration, and session management.
 * Currently provides a template; integrate with actual LLM APIs for full functionality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCore = void 0;
class AgentCore {
    config;
    memory;
    skills;
    hooks;
    constructor(config, memory, skills, hooks) {
        this.config = config;
        this.memory = memory;
        this.skills = skills;
        this.hooks = hooks;
    }
    /**
     * Run a single turn with the agent
     */
    async run(userInput, context) {
        const startTime = Date.now();
        let toolsCalled = 0;
        // Build context for the LLM
        const systemPrompt = this.buildSystemPrompt(context);
        const conversationHistory = await this.getConversationHistory(context.sessionId);
        // Add user input to history
        conversationHistory.push({ role: 'user', content: userInput });
        // Call LLM
        const llmResponse = await this.callLLM(systemPrompt, conversationHistory);
        toolsCalled++;
        // Store in memory
        await this.memory.add({
            type: 'WORK',
            content: `User: ${userInput}\nAgent: ${llmResponse.content}`,
            tags: ['conversation', context.sessionId],
            source: 'AgentCore',
            importance: 2,
        });
        return {
            content: llmResponse.content,
            done: llmResponse.done,
            metrics: {
                tokensUsed: llmResponse.tokens,
                durationMs: Date.now() - startTime,
                toolsCalled,
            },
        };
    }
    /**
     * Build system prompt with DA identity, ISC, and recent memory
     */
    buildSystemPrompt(context) {
        const da = context.da;
        const isc = context.isc;
        return `You are ${da.name}${da.fullName ? ` (${da.fullName})` : ''}.
${da.personality ? `Your personality: ${da.personality}` : ''}

You are running the AIONE Agentic AI Infrastructure SDK.

## Current Mission (ISC)
Problem: ${isc.problem}
Vision: ${isc.vision}
Goal: ${isc.goal}
${isc.principles.length > 0 ? `Principles:\n${isc.principles.map(p => `- ${p}`).join('\n')}` : ''}

## Guidelines
- Be helpful, precise, and action-oriented
- Verify your outputs before presenting them
- Learn from interactions and remember key details
- Follow the Algorithm's seven-phase loop for complex tasks
`;
    }
    /**
     * Get conversation history for a session
     */
    async getConversationHistory(sessionId) {
        // In production, this would load from a session store
        return [];
    }
    /**
     * Call the LLM API
     */
    async callLLM(systemPrompt, messages) {
        // This is a template — integrate with actual LLM API
        const apiKey = this.config.apiKey || process.env.ANTHROPIC_API_KEY;
        const model = this.config.model || 'claude-sonnet-4-20250514';
        if (!apiKey) {
            // Demo mode — return a template response
            return {
                content: this.generateDemoResponse(messages),
                done: true,
                tokens: 0,
            };
        }
        // Anthropic API call
        if (this.config.provider === 'anthropic') {
            return this.callAnthropic(systemPrompt, messages, model, apiKey);
        }
        // OpenAI API call
        if (this.config.provider === 'openai') {
            return this.callOpenAI(systemPrompt, messages, model, apiKey);
        }
        return {
            content: 'No LLM provider configured. Set apiKey or ANTHROPIC_API_KEY environment variable.',
            done: true,
            tokens: 0,
        };
    }
    async callAnthropic(systemPrompt, messages, model, apiKey) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
                body: JSON.stringify({
                    model,
                    max_tokens: this.config.maxTokens || 4096,
                    temperature: this.config.temperature ?? 0.7,
                    system: systemPrompt,
                    messages,
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Anthropic API error: ${response.status} - ${error}`);
            }
            const data = await response.json();
            const text = data.content?.[0]?.text || 'No response from model';
            return {
                content: text,
                done: true,
                tokens: data.usage.input_tokens + data.usage.output_tokens,
            };
        }
        catch (error) {
            return {
                content: `Error calling Anthropic API: ${error}`,
                done: true,
                tokens: 0,
            };
        }
    }
    async callOpenAI(systemPrompt, messages, model, apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    max_tokens: this.config.maxTokens || 4096,
                    temperature: this.config.temperature ?? 0.7,
                    systemrompt,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                    ],
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${error}`);
            }
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || 'No response from model';
            return {
                content: text,
                done: true,
                tokens: data.usage?.total_tokens || 0,
            };
        }
        catch (error) {
            return {
                content: `Error calling OpenAI API: ${error}`,
                done: true,
                tokens: 0,
            };
        }
    }
    generateDemoResponse(messages) {
        const lastMessage = messages[messages.length - 1]?.content || '';
        return `## AIONE SDK — Demo Mode

Hello! I'm running in **demo mode** because no LLM API key is configured.

### What you said:
> ${lastMessage.slice(0, 100)}${lastMessage.length > 100 ? '...' : ''}

### AIONE SDK Status:
- ✅ Memory System: Active (${this.memory ? 'connected' : 'not initialized'})
- ✅ Skill System: Active (${this.skills ? 'connected' : 'not initialized'})
- ✅ Hook System: Active (${this.hooks ? 'connected' : 'not initialized'})
- ✅ Workflow System: Available
- ✅ Algorithm System: Available

### To enable full AI capabilities:

**Anthropic (Claude):**
\`\`\`bash
export ANTHROPIC_API_KEY=sk-ant-...
\`\`\`

**OpenAI (GPT-4):**
\`\`\`javascript
const sdk = new AIONE({
  provider: 'openai',
  apiKey: 'sk-...'
});
\`\`\`

### Try these commands:
- \`aione memory --stats\` — View memory statistics
- \`aione skills --list\` — List available skills
- \`aione algorithm --run "design a REST API"\` — Run the Algorithm
`;
    }
}
exports.AgentCore = AgentCore;
//# sourceMappingURL=AgentCore.js.map