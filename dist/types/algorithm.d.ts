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
export interface Transition {
    phase: number;
    name: string;
    action: string;
    expected: string;
}
export interface AlgorithmResult {
    isc: ISC;
    currentState: string;
    idealState: string;
    gap: string[];
    transitions: Transition[];
    quality: number;
    executedAt: string;
}
export interface AlgorithmOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
//# sourceMappingURL=algorithm.d.ts.map