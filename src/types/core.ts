// Core types
export interface AIONEConfig {
  baseDir?: string;
  provider?: 'anthropic' | 'openai' | 'local';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  debug?: boolean;
}

export interface DA {
  name: string;
  fullName?: string;
  voice?: string;
  personality?: string;
  identityFile?: string;
}

export interface AgentResponse {
  content: string;
  done: boolean;
  metrics?: {
    tokensUsed?: number;
    durationMs?: number;
    toolsCalled?: number;
  };
}

export interface ExecutionContext {
  config: AIONEConfig;
  da: DA;
  isc: ISC;
  sessionId: string;
  startTime: number;
  skill?: string;
  workflow?: string;
}

export interface ISC {
  problem: string;
  vision: string;
  scope: string;
  principles: string[];
  constraints: string[];
  goal: string;
  criteria: string[];
  testStrategy: string;
  features: string[];
  decisions: string[];
  changing: string[];
  verification: string[];
  identity?: string;
}