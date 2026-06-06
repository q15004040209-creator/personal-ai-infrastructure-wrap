// Workflow types

export interface Workflow {
  name: string;
  description: string;
  source: string;
  triggers?: string[];
}

export interface WorkflowStep {
  order: number;
  instruction: string;
  /** Expected output format */
  expected?: string;
}

export interface WorkflowExecution {
  workflow: Workflow;
  steps: WorkflowStep[];
  currentStep: number;
  context: Record<string, unknown>;
}