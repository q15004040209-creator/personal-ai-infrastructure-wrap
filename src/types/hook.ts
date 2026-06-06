// Hook system types

export type HookEvent =
  | 'SessionStart'
  | 'UserPromptSubmit'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'Stop'
  | 'SessionEnd'
  | 'PreCompact'
  | 'PostCompact';

export interface Hook {
  name: string;
  event: HookEvent;
  script: string;
  runtime?: 'bun' | 'node' | 'bash';
  enabled?: boolean;
}

export interface HookExecution {
  hook: Hook;
  triggeredAt: string;
  durationMs?: number;
  success: boolean;
  output?: string;
  error?: string;
}