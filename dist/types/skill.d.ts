export interface Skill {
    name: string;
    description: string;
    effort?: 'low' | 'medium' | 'high';
    source?: string;
    dir?: string;
    workflows?: import('./workflow').Workflow[];
    tools?: import('./skill').Tool[];
    tags?: string[];
}
export interface Tool {
    name: string;
    description: string;
    script: string;
    runtime?: 'bun' | 'node' | 'bash';
    args?: ToolArg[];
}
export interface ToolArg {
    name: string;
    description?: string;
    required?: boolean;
    default?: string;
}
export interface SkillLoadOptions {
    /** Load customizations from USER/SKILLCUSTOMIZATIONS/<SkillName>/ */
    loadCustomizations?: boolean;
    /** Custom base dir (default: config.baseDir) */
    baseDir?: string;
}
export interface SkillExecutionResult {
    success: boolean;
    output?: string;
    error?: string;
    durationMs: number;
    workflow?: string;
    tool?: string;
}
//# sourceMappingURL=skill.d.ts.map