/**
 * Skill System — Domain-specific capability packages
 *
 * Skills are self-contained, AI-installable capabilities.
 * Each skill has: SKILL.md (metadata), Workflows/, Tools/, and customization support.
 */
import { Skill, SkillLoadOptions, SkillExecutionResult } from '../types/skill';
import { WorkflowSystem } from '../workflow/WorkflowSystem';
export declare class SkillSystem {
    private baseDir;
    private debug;
    private skills;
    private workflows;
    constructor(baseDir: string, workflows: WorkflowSystem, debug?: boolean);
    init(): Promise<void>;
    /**
     * Load a skill from a directory
     */
    load(skillPath: string, options?: SkillLoadOptions): Promise<Skill>;
    /**
     * List all loaded skills
     */
    list(): Skill[];
    /**
     * Get a skill by name
     */
    get(name: string): Skill | undefined;
    /**
     * Execute a skill's workflow
     */
    execute(skillName: string, workflowName?: string): Promise<SkillExecutionResult>;
    /**
     * Install a skill from a URL or path
     */
    install(source: string): Promise<Skill>;
    /**
     * Uninstall a skill
     */
    uninstall(name: string): Promise<boolean>;
    /**
     * Route input to the best matching skill
     */
    route(input: string): Skill | null;
    private parseSkillMarkdown;
    private parseWorkflowMarkdown;
    private parseToolFile;
    private log;
}
//# sourceMappingURL=SkillSystem.d.ts.map