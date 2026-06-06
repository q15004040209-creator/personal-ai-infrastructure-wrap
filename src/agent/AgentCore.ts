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

export class AgentCore {
  private config: AIONEConfig;
  private memory: MemorySystem;
  private skills: SkillSystem;
  private hooks: HookSystem;

  constructor(
    config: AIONEConfig,
    memory: MemorySystem,
    skills: SkillSystem,
    hooks: HookSystem
  ) {
    this.config = config;
    this.memory = memory;
    this.skills = skills;
    this.hooks = hooks;
  }

  /**
   * Run a single turn with the agent
   */
  async run(userInput: string, context: ExecutionContext): Promise<AgentResponse> {
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
  private buildSystemPrompt(context: ExecutionContext): string {
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
  private async getConversationHistory(sessionId: string): Promise<Array<{ role: string; content: string }>> {
    // In production, this would load from a session store
    return [];
  }

  /**
   * Call the LLM API
   */
  private async callLLM(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<{ content: string; done: boolean; tokens?: number }> {
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

  private async callAnthropic(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
    model: string,
    apiKey: string
  ): Promise<{ content: string; done: boolean; tokens?: number }> {
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

      const data = await response.json() as {
        content: Array<{ type: string; text: string }>;
        usage: { input_tokens: number; output_tokens: number };
      };

      const text = data.content?.[0]?.text || 'No response from model';

      return {
        content: text,
        done: true,
        tokens: data.usage.input_tokens + data.usage.output_tokens,
      };
    } catch (error) {
      return {
        content: `Error calling Anthropic API: ${error}`,
        done: true,
        tokens: 0,
      };
    }
  }

  private async callOpenAI(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
    model: string,
    apiKey: string
  ): Promise<{ content: string; done: boolean; tokens?: number }> {
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
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
        usage: { total_tokens: number };
      };

      const text = data.choices?.[0]?.message?.content || 'No response from model';

      return {
        content: text,
        done: true,
        tokens: data.usage?.total_tokens || 0,
      };
    } catch (error) {
      return {
        content: `Error calling OpenAI API: ${error}`,
        done: true,
        tokens: 0,
      };
    }
  }

  private generateDemoResponse(messages: Array<{ role: string; content: string }>): string {
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