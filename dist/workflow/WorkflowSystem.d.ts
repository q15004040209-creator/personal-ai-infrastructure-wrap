/**
 * Workflow System — Structured task execution paths
 *
 * Workflows are markdown files with step-by-step instructions.
 * They route inputs to the right procedure and execute deterministically.
 */
import { Workflow, WorkflowStep } from '../types/workflow';
export declare class WorkflowSystem {
    private baseDir;
    private debug;
    private workflows;
    constructor(baseDir: string, debug?: boolean);
    init(): Promise<void>;
    /**
     * Load a workflow from a markdown file
     */
    load(workflowPath: string): Promise<Workflow>;
    /**
     * Get a workflow by name
     */
    get(workflowPath: string): Promise<Workflow | null>;
    /**
     * List all workflows
     */
    list(): Promise<Workflow[]>;
    /**
     * Route input text to the best matching workflow
     */
    route(input: string): Promise<Workflow | null>;
    /**
     * Execute a workflow
     */
    execute(workflow: Workflow, context?: Record<string, unknown>): Promise<string>;
    /**
     * Get workflow steps
     */
    getSteps(workflow: Workflow): Promise<WorkflowStep[]>;
    private parseWorkflowContent;
    private extractTriggers;
    private log;
}
//# sourceMappingURL=WorkflowSystem.d.ts.map