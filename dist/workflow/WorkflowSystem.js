"use strict";
/**
 * Workflow System — Structured task execution paths
 *
 * Workflows are markdown files with step-by-step instructions.
 * They route inputs to the right procedure and execute deterministically.
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
exports.WorkflowSystem = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const glob_1 = require("glob");
class WorkflowSystem {
    baseDir;
    debug;
    workflows = new Map();
    constructor(baseDir, debug = false) {
        this.baseDir = baseDir;
        this.debug = debug;
    }
    async init() {
        const workflowsDir = path.join(this.baseDir, 'WORKFLOWS');
        if (await fs.pathExists(workflowsDir)) {
            const workflowFiles = await (0, glob_1.glob)('**/*.md', { cwd: workflowsDir });
            for (const wfFile of workflowFiles) {
                try {
                    const wf = await this.load(path.join(workflowsDir, wfFile));
                    this.workflows.set(wf.name, wf);
                }
                catch (e) {
                    this.log(`Warning: Failed to load workflow ${wfFile}: ${e}`);
                }
            }
        }
        this.log(`Workflow system initialized with ${this.workflows.size} workflows`);
    }
    /**
     * Load a workflow from a markdown file
     */
    async load(workflowPath) {
        const content = await fs.readFile(workflowPath, 'utf-8');
        const steps = this.parseWorkflowContent(content);
        const name = path.basename(workflowPath, '.md');
        const workflow = {
            name,
            description: steps[0]?.instruction || name,
            source: workflowPath,
            triggers: this.extractTriggers(content),
        };
        workflow._steps = steps;
        this.workflows.set(name, workflow);
        return workflow;
    }
    /**
     * Get a workflow by name
     */
    async get(workflowPath) {
        // Try as full path first
        if (await fs.pathExists(workflowPath)) {
            return this.load(workflowPath);
        }
        // Try as name
        const wf = this.workflows.get(workflowPath);
        if (wf)
            return wf;
        // Try fuzzy match
        for (const [name, workflow] of this.workflows) {
            if (name.toLowerCase().includes(workflowPath.toLowerCase())) {
                return workflow;
            }
        }
        return null;
    }
    /**
     * List all workflows
     */
    async list() {
        return Array.from(this.workflows.values());
    }
    /**
     * Route input text to the best matching workflow
     */
    async route(input) {
        const inputLower = input.toLowerCase();
        for (const workflow of this.workflows.values()) {
            // Check triggers
            if (workflow.triggers?.some(t => inputLower.includes(t.toLowerCase()))) {
                return workflow;
            }
            // Check name keywords
            if (inputLower.includes(workflow.name.toLowerCase())) {
                return workflow;
            }
        }
        return null;
    }
    /**
     * Execute a workflow
     */
    async execute(workflow, context) {
        const steps = workflow._steps;
        if (!steps || steps.length === 0) {
            return `Workflow ${workflow.name} has no steps`;
        }
        const ctx = context || {};
        const outputs = [];
        for (const step of steps) {
            this.log(`Executing step ${step.order}: ${step.instruction.slice(0, 50)}...`);
            // In a real implementation, this would execute each step
            // For now, we return the workflow summary
            outputs.push(`[Step ${step.order}] ${step.instruction}`);
        }
        return outputs.join('\n');
    }
    /**
     * Get workflow steps
     */
    async getSteps(workflow) {
        if (workflow._steps) {
            return workflow._steps;
        }
        if (await fs.pathExists(workflow.source)) {
            const content = await fs.readFile(workflow.source, 'utf-8');
            return this.parseWorkflowContent(content);
        }
        return [];
    }
    parseWorkflowContent(content) {
        const steps = [];
        const lines = content.split('\n');
        let currentStep = null;
        let stepNumber = 0;
        for (const line of lines) {
            // Step headers: ## Step 1 or ### Step 1 or ## 1.
            const stepMatch = line.match(/^#{1,3}\s*(?:Step\s+)?(\d+)[\s.)]?(.*)/i);
            if (stepMatch) {
                if (currentStep) {
                    steps.push(currentStep);
                }
                stepNumber = parseInt(stepMatch[1]);
                currentStep = {
                    order: stepNumber,
                    instruction: stepMatch[2].trim() || 'Step ' + stepNumber,
                };
            }
            else if (currentStep && line.trim()) {
                // Continuation of current step
                currentStep.instruction += ' ' + line.trim();
            }
        }
        if (currentStep) {
            steps.push(currentStep);
        }
        return steps;
    }
    extractTriggers(content) {
        const triggers = [];
        const triggerMatch = content.match(/triggers?[:\s]+(.*)/i);
        if (triggerMatch) {
            const triggerLine = triggerMatch[1];
            // Extract quoted strings or comma-separated words
            const matches = triggerLine.matchAll(/(["'])(.*?)\1|(\w+)/g);
            for (const match of matches) {
                triggers.push(match[2] || match[3]);
            }
        }
        return triggers;
    }
    log(message) {
        if (this.debug) {
            console.log(`[Workflow] ${message}`);
        }
    }
}
exports.WorkflowSystem = WorkflowSystem;
//# sourceMappingURL=WorkflowSystem.js.map