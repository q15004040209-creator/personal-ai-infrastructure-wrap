"use strict";
/**
 * Skill System — Domain-specific capability packages
 *
 * Skills are self-contained, AI-installable capabilities.
 * Each skill has: SKILL.md (metadata), Workflows/, Tools/, and customization support.
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
exports.SkillSystem = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const glob_1 = require("glob");
class SkillSystem {
    baseDir;
    debug;
    skills = new Map();
    workflows;
    constructor(baseDir, workflows, debug = false) {
        this.baseDir = baseDir;
        this.workflows = workflows;
        this.debug = debug;
    }
    async init() {
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
                    }
                    catch (e) {
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
    async load(skillPath, options) {
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
            const workflowFiles = await (0, glob_1.glob)('*.md', { cwd: workflowsDir });
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
            const toolFiles = await (0, glob_1.glob)('*.ts', { cwd: toolsDir });
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
    list() {
        return Array.from(this.skills.values());
    }
    /**
     * Get a skill by name
     */
    get(name) {
        return this.skills.get(name);
    }
    /**
     * Execute a skill's workflow
     */
    async execute(skillName, workflowName) {
        const skill = this.skills.get(skillName);
        if (!skill) {
            return { success: false, error: `Skill not found: ${skillName}`, durationMs: 0 };
        }
        const startTime = Date.now();
        // Select workflow
        let workflow;
        if (workflowName && skill.workflows) {
            workflow = skill.workflows.find(w => w.name.toLowerCase() === workflowName.toLowerCase());
        }
        else if (skill.workflows && skill.workflows.length > 0) {
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
        }
        catch (error) {
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
    async install(source) {
        // This would clone/pack the skill
        // For now, just load from local path
        return this.load(source);
    }
    /**
     * Uninstall a skill
     */
    async uninstall(name) {
        const skill = this.skills.get(name);
        if (!skill || !skill.dir)
            return false;
        await fs.remove(skill.dir);
        this.skills.delete(name);
        this.log(`Uninstalled skill: ${name}`);
        return true;
    }
    /**
     * Route input to the best matching skill
     */
    route(input) {
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
    parseSkillMarkdown(content) {
        const skill = {};
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
                if (key === 'name')
                    skill.name = value;
                else if (key === 'description')
                    skill.description = value.replace(/"/g, '');
                else if (key === 'effort')
                    skill.effort = value;
            }
        }
        if (!skill.name || !skill.description) {
            throw new Error('Invalid SKILL.md: missing name or description');
        }
        return skill;
    }
    parseWorkflowMarkdown(content, filename) {
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
    parseToolFile(filename) {
        return {
            name: filename.replace('.ts', ''),
            description: `Tool: ${filename}`,
            script: filename,
            runtime: 'bun',
        };
    }
    log(message) {
        if (this.debug) {
            console.log(`[Skill] ${message}`);
        }
    }
}
exports.SkillSystem = SkillSystem;
//# sourceMappingURL=SkillSystem.js.map