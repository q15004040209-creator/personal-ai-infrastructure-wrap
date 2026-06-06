/**
 * Workflow System — Structured task execution paths
 *
 * Workflows are markdown files with step-by-step instructions.
 * They route inputs to the right procedure and execute deterministically.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { glob } from 'glob';
import { Workflow, WorkflowStep } from '../types/workflow';

export class WorkflowSystem {
  private baseDir: string;
  private debug: boolean;
  private workflows: Map<string, Workflow> = new Map();

  constructor(baseDir: string, debug: boolean = false) {
    this.baseDir = baseDir;
    this.debug = debug;
  }

  async init(): Promise<void> {
    const workflowsDir = path.join(this.baseDir, 'WORKFLOWS');
    if (await fs.pathExists(workflowsDir)) {
      const workflowFiles = await glob('**/*.md', { cwd: workflowsDir });
      for (const wfFile of workflowFiles) {
        try {
          const wf = await this.load(path.join(workflowsDir, wfFile));
          this.workflows.set(wf.name, wf);
        } catch (e) {
          this.log(`Warning: Failed to load workflow ${wfFile}: ${e}`);
        }
      }
    }
    this.log(`Workflow system initialized with ${this.workflows.size} workflows`);
  }

  /**
   * Load a workflow from a markdown file
   */
  async load(workflowPath: string): Promise<Workflow> {
    const content = await fs.readFile(workflowPath, 'utf-8');
    const steps = this.parseWorkflowContent(content);

    const name = path.basename(workflowPath, '.md');

    const workflow: Workflow = {
      name,
      description: steps[0]?.instruction || name,
      source: workflowPath,
      triggers: this.extractTriggers(content),
    };

    (workflow as Workflow & { _steps?: WorkflowStep[] })._steps = steps;

    this.workflows.set(name, workflow);
    return workflow;
  }

  /**
   * Get a workflow by name
   */
  async get(workflowPath: string): Promise<Workflow | null> {
    // Try as full path first
    if (await fs.pathExists(workflowPath)) {
      return this.load(workflowPath);
    }

    // Try as name
    const wf = this.workflows.get(workflowPath);
    if (wf) return wf;

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
  async list(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  /**
   * Route input text to the best matching workflow
   */
  async route(input: string): Promise<Workflow | null> {
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
  async execute(workflow: Workflow, context?: Record<string, unknown>): Promise<string> {
    const steps = (workflow as Workflow & { _steps?: WorkflowStep[] })._steps;
    if (!steps || steps.length === 0) {
      return `Workflow ${workflow.name} has no steps`;
    }

    const ctx = context || {};
    const outputs: string[] = [];

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
  async getSteps(workflow: Workflow): Promise<WorkflowStep[]> {
    if ((workflow as Workflow & { _steps?: WorkflowStep[] })._steps) {
      return (workflow as Workflow & { _steps?: WorkflowStep[] })._steps!;
    }

    if (await fs.pathExists(workflow.source)) {
      const content = await fs.readFile(workflow.source, 'utf-8');
      return this.parseWorkflowContent(content);
    }

    return [];
  }

  private parseWorkflowContent(content: string): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const lines = content.split('\n');
    let currentStep: WorkflowStep | null = null;
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
      } else if (currentStep && line.trim()) {
        // Continuation of current step
        currentStep.instruction += ' ' + line.trim();
      }
    }

    if (currentStep) {
      steps.push(currentStep);
    }

    return steps;
  }

  private extractTriggers(content: string): string[] {
    const triggers: string[] = [];
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

  private log(message: string): void {
    if (this.debug) {
      console.log(`[Workflow] ${message}`);
    }
  }
}