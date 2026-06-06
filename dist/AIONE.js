"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIONE = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const MemorySystem_1 = require("../memory/MemorySystem");
const SkillSystem_1 = require("../skills/SkillSystem");
const WorkflowSystem_1 = require("../workflow/WorkflowSystem");
const HookSystem_1 = require("../hooks/HookSystem");
const AlgorithmSystem_1 = require("../algorithm/AlgorithmSystem");
const AgentCore_1 = require("../agent/AgentCore");
class AIONE {
    config;
    baseDir;
    memory;
    skills;
    workflows;
    hooks;
    algorithm;
    agent;
    da;
    isc;
    initialized = false;
    constructor(config = {}) {
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
    async init() {
        if (this.initialized)
            return;
        // Ensure base directory exists
        await fs.ensureDir(this.baseDir);
        // Initialize subsystems
        this.memory = new MemorySystem_1.MemorySystem(this.baseDir, this.config.debug);
        await this.memory.init();
        this.workflows = new WorkflowSystem_1.WorkflowSystem(this.baseDir, this.config.debug);
        await this.workflows.init();
        this.skills = new SkillSystem_1.SkillSystem(this.baseDir, this.workflows, this.config.debug);
        await this.skills.init();
        this.hooks = new HookSystem_1.HookSystem(this.baseDir, this.config.debug);
        await this.hooks.init();
        this.algorithm = new AlgorithmSystem_1.AlgorithmSystem(this.config, this.memory, this.config.debug);
        this.agent = new AgentCore_1.AgentCore(this.config, this.memory, this.skills, this.hooks);
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
    async run(userInput, options) {
        if (!this.initialized)
            await this.init();
        const sessionId = `session-${Date.now()}`;
        const startTime = Date.now();
        const context = {
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
        }
        catch (error) {
            this.log(`Error in run: ${error}`);
            throw error;
        }
    }
    /**
     * Process a task through the Algorithm system (Ideal State Assessment)
     */
    async assess(input) {
        if (!this.initialized)
            await this.init();
        return this.algorithm.run(input);
    }
    /**
     * Memory operations
     */
    async remember(entry) {
        if (!this.initialized)
            await this.init();
        return this.memory.add(entry);
    }
    async recall(query) {
        if (!this.initialized)
            await this.init();
        return this.memory.query(query);
    }
    async forget(memoryId) {
        if (!this.initialized)
            await this.init();
        return this.memory.remove(memoryId);
    }
    async memoryStats() {
        if (!this.initialized)
            await this.init();
        return this.memory.stats();
    }
    /**
     * Skill operations
     */
    async loadSkill(skillPath) {
        if (!this.initialized)
            await this.init();
        return this.skills.load(skillPath);
    }
    async listSkills() {
        if (!this.initialized)
            await this.init();
        return this.skills.list();
    }
    async executeSkill(skillName, workflow) {
        if (!this.initialized)
            await this.init();
        return this.skills.execute(skillName, workflow);
    }
    /**
     * Workflow operations
     */
    async getWorkflow(workflowPath) {
        if (!this.initialized)
            await this.init();
        return this.workflows.get(workflowPath);
    }
    async listWorkflows() {
        if (!this.initialized)
            await this.init();
        return this.workflows.list();
    }
    async routeWorkflow(input) {
        if (!this.initialized)
            await this.init();
        return this.workflows.route(input);
    }
    /**
     * Hook operations
     */
    async registerHook(hook) {
        if (!this.initialized)
            await this.init();
        await this.hooks.register(hook);
    }
    async listHooks(event) {
        if (!this.initialized)
            await this.init();
        return this.hooks.list(event);
    }
    async removeHook(name) {
        if (!this.initialized)
            await this.init();
        return this.hooks.remove(name);
    }
    /**
     * DA (Digital Assistant) identity
     */
    getDA() {
        return this.da;
    }
    async updateDA(updates) {
        this.da = { ...this.da, ...updates };
        await this.saveDA();
    }
    /**
     * ISC (Ideal State Criteria) document
     */
    getISC() {
        return this.isc;
    }
    async updateISC(updates) {
        this.isc = { ...this.isc, ...updates };
        await this.saveISC();
    }
    /**
     * Get SDK version
     */
    version() {
        return '1.0.0';
    }
    // Private helpers
    async loadDA() {
        const daPath = path.join(this.baseDir, 'USER', 'DA_IDENTITY.md');
        try {
            if (await fs.pathExists(daPath)) {
                const content = await fs.readFile(daPath, 'utf-8');
                return this.parseDAMarkdown(content);
            }
        }
        catch (e) {
            this.log(`Warning: Could not load DA identity: ${e}`);
        }
        return { name: 'AIONE', fullName: 'Agentic Intelligence ONE' };
    }
    async saveDA() {
        const daDir = path.join(this.baseDir, 'USER');
        await fs.ensureDir(daDir);
        const daPath = path.join(daDir, 'DA_IDENTITY.md');
        const content = this.formatDAMarkdown(this.da);
        await fs.writeFile(daPath, content, 'utf-8');
    }
    parseDAMarkdown(content) {
        const result = { name: '' };
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.startsWith('# ')) {
                result.fullName = line.slice(2).trim();
            }
            else if (line.startsWith('- **Name:** ')) {
                result.name = line.replace('- **Name:** ', '').replace(/\*\*/g, '').trim();
            }
            else if (line.startsWith('- **Voice:** ')) {
                result.voice = line.replace('- **Voice:** ', '').replace(/\*\*/g, '').trim();
            }
            else if (line.startsWith('- **Personality:** ')) {
                result.personality = line.replace('- **Personality:** ', '').replace(/\*\*/g, '').trim();
            }
        }
        if (!result.name)
            result.name = 'AIONE';
        return result;
    }
    formatDAMarkdown(da) {
        return `# ${da.fullName || 'AIONE'}

- **Name:** ${da.name}
${da.voice ? `- **Voice:** ${da.voice}` : ''}
${da.personality ? `- **Personality:** ${da.personality}` : ''}
`;
    }
    async loadISC() {
        const iscPath = path.join(this.baseDir, 'USER', 'ISC.md');
        try {
            if (await fs.pathExists(iscPath)) {
                const content = await fs.readFile(iscPath, 'utf-8');
                return this.parseISCMarkdown(content);
            }
        }
        catch (e) {
            this.log(`Warning: Could not load ISC: ${e}`);
        }
        return this.defaultISC();
    }
    parseISCMarkdown(content) {
        const sections = content.split(/\n(?=[A-Z][A-Z\s]+:)/);
        const isc = this.defaultISC();
        for (const section of sections) {
            const match = section.match(/^([A-Z][A-Z\s]+):/);
            if (match) {
                const key = match[1].trim().toLowerCase().replace(/\s+/g, '');
                const value = section.replace(/^[A-Z][A-Z\s]+:\s*/, '').trim();
                if (key === 'problem')
                    isc.problem = value;
                else if (key === 'vision')
                    isc.vision = value;
                else if (key === 'scope')
                    isc.scope = value;
                else if (key === 'goal')
                    isc.goal = value;
            }
        }
        return isc;
    }
    defaultISC() {
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
    async saveISC() {
        const iscDir = path.join(this.baseDir, 'USER');
        await fs.ensureDir(iscDir);
        const iscPath = path.join(iscDir, 'ISC.md');
        const content = this.formatISCMarkdown(this.isc);
        await fs.writeFile(iscPath, content, 'utf-8');
    }
    formatISCMarkdown(isc) {
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
    log(message) {
        if (this.config.debug) {
            console.log(`[AIONE] ${new Date().toISOString()} ${message}`);
        }
    }
}
exports.AIONE = AIONE;
exports.default = AIONE;
//# sourceMappingURL=AIONE.js.map