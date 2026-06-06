/**
 * AIONE — Agentic AI Infrastructure SDK
 * The Agentic AI Operating System
 *
 * @example
 * import { AIONE, Memory, Skills } from 'aione-sdk';
 *
 * const sdk = new AIONE({ baseDir: '~/.aione' });
 * await sdk.init();
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { AIONEConfig, DA, ISC, AgentResponse, ExecutionContext } from './types/core';
import { MemorySystem, MemoryEntry, MemoryQuery, MemoryStats } from './memory/MemorySystem';
import { SkillSystem, Skill, SkillExecutionResult } from './skills/SkillSystem';
import { WorkflowSystem, Workflow } from './workflow/WorkflowSystem';
import { HookSystem, Hook, HookEvent } from './hooks/HookSystem';
import { AlgorithmSystem, AlgorithmResult } from './algorithm/AlgorithmSystem';
import { AgentCore } from './agent/AgentCore';

export class AIONE {
  private config: Required<AIONEConfig>;
  private baseDir: string;
  private memory!: MemorySystem;
  private skills!: SkillSystem;
  private workflows!: WorkflowSystem;
  private hooks!: HookSystem;
  private algorithm!: AlgorithmSystem;
  private agent!: AgentCore;
  private da!: DA;
  private isc!: ISC;
  private initialized: boolean = false;

  constructor(config: AIONEConfig = {}) {
    this.config = {
      baseDir: config.baseDir || path.join(process.env.HOME || process.env.USERPROFILE || '~', '.aione'),
      provider: config.provider || 'anthropic',
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || '',
      baseUrl: config.baseUrl || '',
      model: config.model || 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature ?? 0.7,
      debug: config.debug || false,
    };
    this.baseDir = this.config.baseDir;
  }

  /**
   * Initialize AIONE - loads all subsystems
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Ensure base directory exists
    await fs.ensureDir(this.baseDir);

    // Initialize subsystems
    this.memory = new MemorySystem(this.baseDir, this.config.debug);
    await this.memory.init();

    this.workflows = new WorkflowSystem(this.baseDir, this.config.debug);
    await this.workflows.init();

    this.skills = new SkillSystem(this.baseDir, this.workflows, this.config.debug);
    await this.skills.init();

    this.hooks = new HookSystem(this.baseDir, this.config.debug);
    await this.hooks.init();

    this.algorithm = new AlgorithmSystem(this.config, this.memory, this.config.debug);

    this.agent = new AgentCore(this.config, this.memory, this.skills, this.hooks);

    // Load DA identity
    this.da = await this.loadDA();

    // Load ISC
    this.isc = await this.loadISC();

    this.initialized = true;
    this.log('AIONE initialized successfully');
  }

  /**
   * Run a conversation turn with the agent
   */
  async run(userInput: string, options?: { skill?: string; workflow?: string }): Promise<AgentResponse> {
    if (!this.initialized) await this.init();

    const sessionId = `session-${Date.now()}`;
    const startTime = Date.now();

    const context: ExecutionContext = {
      config: this.config,
      da: this.da,
      isc: this.isc,
      sessionId,
      startTime,
      skill: options?.skill,
      workflow: options?.workflow,
    };

    // Fire SessionStart hooks
    await this.hooks.fire('SessionStart', context);

    try {
      // Fire PreToolUse hooks
      await this.hooks.fire('UserPromptSubmit', context, { prompt: userInput });

      const response = await this.agent.run(userInput, context);

      // Fire SessionEnd hooks
      await this.hooks.fire('SessionEnd', context, { response });

      return response;
    } catch (error) {
      this.log(`Error in run: ${error}`);
      throw error;
    }
  }

  /**
   * Process a task through the Algorithm system (Ideal State Assessment)
   */
  async assess(input: string): Promise<AlgorithmResult> {
    if (!this.initialized) await this.init();
    return this.algorithm.run(input);
  }

  /**
   * Memory operations
   */
  async remember(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    if (!this.initialized) await this.init();
    return this.memory.add(entry);
  }

  async recall(query: MemoryQuery): Promise<MemoryEntry[]> {
    if (!this.initialized) await this.init();
    return this.memory.query(query);
  }

  async forget(memoryId: string): Promise<boolean> {
    if (!this.initialized) await this.init();
    return this.memory.remove(memoryId);
  }

  async memoryStats(): Promise<MemoryStats> {
    if (!this.initialized) await this.init();
    return this.memory.stats();
  }

  /**
   * Skill operations
   */
  async loadSkill(skillPath: string): Promise<Skill> {
    if (!this.initialized) await this.init();
    return this.skills.load(skillPath);
  }

  async listSkills(): Promise<Skill[]> {
    if (!this.initialized) await this.init();
    return this.skills.list();
  }

  async executeSkill(skillName: string, workflow?: string): Promise<SkillExecutionResult> {
    if (!this.initialized) await this.init();
    return this.skills.execute(skillName, workflow);
  }

  /**
   * Workflow operations
   */
  async getWorkflow(workflowPath: string): Promise<Workflow | null> {
    if (!this.initialized) await this.init();
    return this.workflows.get(workflowPath);
  }

  async listWorkflows(): Promise<Workflow[]> {
    if (!this.initialized) await this.init();
    return this.workflows.list();
  }

  async routeWorkflow(input: string): Promise<Workflow | null> {
    if (!this.initialized) await this.init();
    return this.workflows.route(input);
  }

  /**
   * Hook operations
   */
  async registerHook(hook: Hook): Promise<void> {
    if (!this.initialized) await this.init();
    await this.hooks.register(hook);
  }

  async listHooks(event?: HookEvent): Promise<Hook[]> {
    if (!this.initialized) await this.init();
    return this.hooks.list(event);
  }

  async removeHook(name: string): Promise<boolean> {
    if (!this.initialized) await this.init();
    return this.hooks.remove(name);
  }

  /**
   * DA (Digital Assistant) identity
   */
  getDA(): DA {
    return this.da;
  }

  async updateDA(updates: Partial<DA>): Promise<void> {
    this.da = { ...this.da, ...updates };
    await this.saveDA();
  }

  /**
   * ISC (Ideal State Criteria) document
   */
  getISC(): ISC {
    return this.isc;
  }

  async updateISC(updates: Partial<ISC>): Promise<void> {
    this.isc = { ...this.isc, ...updates };
    await this.saveISC();
  }

  /**
   * Get SDK version
   */
  version(): string {
    return '1.0.0';
  }

  // Private helpers
  private async loadDA(): Promise<DA> {
    const daPath = path.join(this.baseDir, 'USER', 'DA_IDENTITY.md');
    try {
      if (await fs.pathExists(daPath)) {
        const content = await fs.readFile(daPath, 'utf-8');
        return this.parseDAMarkdown(content);
      }
    } catch (e) {
      this.log(`Warning: Could not load DA identity: ${e}`);
    }
    return { name: 'AIONE', fullName: 'Agentic Intelligence ONE' };
  }

  private async saveDA(): Promise<void> {
    const daDir = path.join(this.baseDir, 'USER');
    await fs.ensureDir(daDir);
    const daPath = path.join(daDir, 'DA_IDENTITY.md');
    const content = this.formatDAMarkdown(this.da);
    await fs.writeFile(daPath, content, 'utf-8');
  }

  private parseDAMarkdown(content: string): DA {
    const result: DA = { name: '' };
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        result.fullName = line.slice(2).trim();
      } else if (line.startsWith('- **Name:** ')) {
        result.name = line.replace('- **Name:** ', '').replace(/\*\*/g, '').trim();
      } else if (line.startsWith('- **Voice:** ')) {
        result.voice = line.replace('- **Voice:** ', '').replace(/\*\*/g, '').trim();
      } else if (line.startsWith('- **Personality:** ')) {
        result.personality = line.replace('- **Personality:** ', '').replace(/\*\*/g, '').trim();
      }
    }
    if (!result.name) result.name = 'AIONE';
    return result;
  }

  private formatDAMarkdown(da: DA): string {
    return `# ${da.fullName || 'AIONE'}

- **Name:** ${da.name}
${da.voice ? `- **Voice:** ${da.voice}` : ''}
${da.personality ? `- **Personality:** ${da.personality}` : ''}
`;
  }

  private async loadISC(): Promise<ISC> {
    const iscPath = path.join(this.baseDir, 'USER', 'ISC.md');
    try {
      if (await fs.pathExists(iscPath)) {
        const content = await fs.readFile(iscPath, 'utf-8');
        return this.parseISCMarkdown(content);
      }
    } catch (e) {
      this.log(`Warning: Could not load ISC: ${e}`);
    }
    return this.defaultISC();
  }

  private parseISCMarkdown(content: string): ISC {
    const sections = content.split(/\n(?=[A-Z][A-Z\s]+:)/);
    const isc: ISC = this.defaultISC();
    for (const section of sections) {
      const match = section.match(/^([A-Z][A-Z\s]+):/);
      if (match) {
        const key = match[1].trim().toLowerCase().replace(/\s+/g, '');
        const value = section.replace(/^[A-Z][A-Z\s]+:\s*/, '').trim();
        if (key === 'problem') isc.problem = value;
        else if (key === 'vision') isc.vision = value;
        else if (key === 'scope') isc.scope = value;
        else if (key === 'goal') isc.goal = value;
      }
    }
    return isc;
  }

  private defaultISC(): ISC {
    return {
      problem: 'Unspecified',
      vision: 'Unspecified',
      scope: 'Unspecified',
      principles: [],
      constraints: [],
      goal: 'Unspecified',
      criteria: [],
      testStrategy: '',
      features: [],
      decisions: [],
      changing: [],
      verification: [],
    };
  }

  private async saveISC(): Promise<void> {
    const iscDir = path.join(this.baseDir, 'USER');
    await fs.ensureDir(iscDir);
    const iscPath = path.join(iscDir, 'ISC.md');
    const content = this.formatISCMarkdown(this.isc);
    await fs.writeFile(iscPath, content, 'utf-8');
  }

  private formatISCMarkdown(isc: ISC): string {
    return `# Ideal State Criteria

## Problem
${isc.problem}

## Vision
${isc.vision}

## Scope
${isc.scope}

## Goal
${isc.goal}

## Principles
${isc.principles.map(p => `- ${p}`).join('\n')}

## Constraints
${isc.constraints.map(c => `- ${c}`).join('\n')}

## Criteria
${isc.criteria.map(c => `- ${c}`).join('\n')}
`;
  }

  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[AIONE] ${new Date().toISOString()} ${message}`);
    }
  }
}

export default AIONE;