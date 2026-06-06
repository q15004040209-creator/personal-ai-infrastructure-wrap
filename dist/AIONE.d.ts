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
import { AIONEConfig, DA, ISC, AgentResponse } from '../types/core';
import { MemoryEntry, MemoryQuery, MemoryStats } from '../memory/MemorySystem';
import { Skill, SkillExecutionResult } from '../skills/SkillSystem';
import { Workflow } from '../workflow/WorkflowSystem';
import { Hook, HookEvent } from '../hooks/HookSystem';
import { AlgorithmResult } from '../algorithm/AlgorithmSystem';
export declare class AIONE {
    private config;
    private baseDir;
    private memory;
    private skills;
    private workflows;
    private hooks;
    private algorithm;
    private agent;
    private da;
    private isc;
    private initialized;
    constructor(config?: AIONEConfig);
    /**
     * Initialize AIONE - loads all subsystems
     */
    init(): Promise<void>;
    /**
     * Run a conversation turn with the agent
     */
    run(userInput: string, options?: {
        skill?: string;
        workflow?: string;
    }): Promise<AgentResponse>;
    /**
     * Process a task through the Algorithm system (Ideal State Assessment)
     */
    assess(input: string): Promise<AlgorithmResult>;
    /**
     * Memory operations
     */
    remember(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry>;
    recall(query: MemoryQuery): Promise<MemoryEntry[]>;
    forget(memoryId: string): Promise<boolean>;
    memoryStats(): Promise<MemoryStats>;
    /**
     * Skill operations
     */
    loadSkill(skillPath: string): Promise<Skill>;
    listSkills(): Promise<Skill[]>;
    executeSkill(skillName: string, workflow?: string): Promise<SkillExecutionResult>;
    /**
     * Workflow operations
     */
    getWorkflow(workflowPath: string): Promise<Workflow | null>;
    listWorkflows(): Promise<Workflow[]>;
    routeWorkflow(input: string): Promise<Workflow | null>;
    /**
     * Hook operations
     */
    registerHook(hook: Hook): Promise<void>;
    listHooks(event?: HookEvent): Promise<Hook[]>;
    removeHook(name: string): Promise<boolean>;
    /**
     * DA (Digital Assistant) identity
     */
    getDA(): DA;
    updateDA(updates: Partial<DA>): Promise<void>;
    /**
     * ISC (Ideal State Criteria) document
     */
    getISC(): ISC;
    updateISC(updates: Partial<ISC>): Promise<void>;
    /**
     * Get SDK version
     */
    version(): string;
    private loadDA;
    private saveDA;
    private parseDAMarkdown;
    private formatDAMarkdown;
    private loadISC;
    private parseISCMarkdown;
    private defaultISC;
    private saveISC;
    private formatISCMarkdown;
    private log;
}
export default AIONE;
//# sourceMappingURL=AIONE.d.ts.map