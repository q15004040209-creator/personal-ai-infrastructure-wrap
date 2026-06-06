/**
 * Skill System — Domain-specific capability packages
 *
 * Skills are self-contained, AI-installable capabilities.
 * Each skill has: SKILL.md (metadata), Workflows/, Tools/, and customization support.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { glob } from 'glob';
import { Skill, Tool, SkillLoadOptions, SkillExecutionResult } from '../types/skill';
import { WorkflowSystem } from '../workflow/WorkflowSystem';
import { Workflow } from '../types/workflow';

export class SkillSystem {
  private baseDir: string;
  private debug: boolean;
  private skills: Map<string, Skill> = new Map();
  private workflows: WorkflowSystem;

  constructor(baseDir: string, workflows: WorkflowSystem, debug: boolean = false) {
    this.baseDir = baseDir;
    this.workflows = workflows;
    this.debug = debug;
  }

  async init(): Promise<void> {
    // Scan for installed skills
    const skillsDir = path.join(this.baseDir, 'SKILLS');
    if (await fs.pathExists(skillsDir)) {
      const skillDirs = await fs.readdir(skillsDir);
      for (const dir of skillDirs) {
        const skillPath = path.join(skillsDir, dir);
        const stat = await fs.stat(skillPath);
        if (stat.isDirectory()) {
          try {
            const skill = await this.load(skillPath);
            this.skills.set(skill.name, skill);
          } catch (e) {
            this.log(`Warning: Failed to load skill ${dir}: ${e}`);
          }
        }
      }
    }

    this.log(`Skill system initialized with ${this.skills.size} skills`);
  }

  /**
   * Load a skill from a directory
   */
  async load(skillPath: string, options?: SkillLoadOptions): Promise<Skill> {
    const skillFile = path.join(skillPath, 'SKILL.md');
    if (!await fs.pathExists(skillFile)) {
      throw new Error(`SKILL.md not found in ${skillPath}`);
    }

    const content = await fs.readFile(skillFile, 'utf-8');
    const skill = this.parseSkillMarkdown(content);

    skill.dir = skillPath;
    skill.source = skillFile;

    // Load workflows
    const workflowsDir = path.join(skillPath, 'Workflows');
    if (await fs.pathExists(workflowsDir)) {
      const workflowFiles = await glob('*.md', { cwd: workflowsDir });
      skill.workflows = [];
      for (const wfFile of workflowFiles) {
        const wfContent = await fs.readFile(path.join(workflowsDir, wfFile), 'utf-8');
        const wf = this.parseWorkflowMarkdown(wfContent, wfFile);
        skill.workflows.push(wf);
      }
    }

    // Load tools
    const toolsDir = path.join(skillPath, 'Tools');
    if (await fs.pathExists(toolsDir)) {
      const toolFiles = await glob('*.ts', { cwd: toolsDir });
      skill.tools = [];
      for (const toolFile of toolFiles) {
        const tool = this.parseToolFile(toolFile);
        skill.tools.push(tool);
      }
    }

    this.skills.set(skill.name, skill);
    this.log(`Loaded skill: ${skill.name}`);
    return skill;
  }

  /**
   * List all loaded skills
   */
  list(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get a skill by name
   */
  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Execute a skill's workflow
   */
  async execute(skillName: string, workflowName?: string): Promise<SkillExecutionResult> {
    const skill = this.skills.get(skillName);
    if (!skill) {
      return { success: false, error: `Skill not found: ${skillName}`, durationMs: 0 };
    }

    const startTime = Date.now();

    // Select workflow
    let workflow: Workflow | undefined;
    if (workflowName && skill.workflows) {
      workflow = skill.workflows.find(w =>
        w.name.toLowerCase() === workflowName.toLowerCase()
      );
    } else if (skill.workflows && skill.workflows.length > 0) {
      workflow = skill.workflows[0];
    }

    if (!workflow) {
      return { success: false, error: 'No workflow found', durationMs: 0 };
    }

    try {
      // Execute workflow steps
      const result = await this.workflows.execute(workflow);

      return {
        success: true,
        output: result,
        durationMs: Date.now() - startTime,
        workflow: workflow.name,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        durationMs: Date.now() - startTime,
        workflow: workflow.name,
      };
    }
  }

  /**
   * Install a skill from a URL or path
   */
  async install(source: string): Promise<Skill> {
    // This would clone/pack the skill
    // For now, just load from local path
    return this.load(source);
  }

  /**
   * Uninstall a skill
   */
  async uninstall(name: string): Promise<boolean> {
    const skill = this.skills.get(name);
    if (!skill || !skill.dir) return false;

    await fs.remove(skill.dir);
    this.skills.delete(name);
    this.log(`Uninstalled skill: ${name}`);
    return true;
  }

  /**
   * Route input to the best matching skill
   */
  route(input: string): Skill | null {
    const inputLower = input.toLowerCase();

    for (const skill of this.skills.values()) {
      // Check tags
      if (skill.tags?.some(tag => inputLower.includes(tag))) {
        return skill;
      }
      // Check description keywords
      if (skill.description.toLowerCase().includes(inputLower.slice(0, 50))) {
        return skill;
      }
    }

    return null;
  }

  private parseSkillMarkdown(content: string): Skill {
    const skill: Partial<Skill> = {};
    const lines = content.split('\n');
    let inFrontmatter = false;

    for (const line of lines) {
      if (line === '---') {
        inFrontmatter = !inFrontmatter;
        continue;
      }
      if (inFrontmatter) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        if (key === 'name') skill.name = value;
        else if (key === 'description') skill.description = value.replace(/"/g, '');
        else if (key === 'effort') skill.effort = value as Skill['effort'];
      }
    }

    if (!skill.name || !skill.description) {
      throw new Error('Invalid SKILL.md: missing name or description');
    }

    return skill as Skill;
  }

  private parseWorkflowMarkdown(content: string, filename: string): Workflow {
    const lines = content.split('\n');
    let description = '';

    // Extract description from first paragraph
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
        description = line.trim();
        break;
      }
    }

    return {
      name: filename.replace('.md', ''),
      description,
      source: filename,
    };
  }

  private parseToolFile(filename: string): Tool {
    return {
      name: filename.replace('.ts', ''),
      description: `Tool: ${filename}`,
      script: filename,
      runtime: 'bun',
    };
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`[Skill] ${message}`);
    }
  }
}