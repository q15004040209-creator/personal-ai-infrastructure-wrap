/**
 * Algorithm System — Ideal State Assessment (Seven-Phase Loop)
 *
 * The Algorithm is the gravitational center of AIONE.
 * It drives the current → ideal state transition through seven phases:
 * THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN
 *
 * Modeled on Deutche's framework for "good" via hard-to-vary explanations.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { AIONEConfig } from '../types/core';
import { ISC, AlgorithmResult, Transition } from '../types/algorithm';
import { MemorySystem } from '../memory/MemorySystem';

export class AlgorithmSystem {
  private config: AIONEConfig;
  private memory: MemorySystem;
  private debug: boolean;

  constructor(config: AIONEConfig, memory: MemorySystem, debug: boolean = false) {
    this.config = config;
    this.memory = memory;
    this.debug = debug;
  }

  /**
   * Run the Algorithm on an input task
   */
  async run(input: string): Promise<AlgorithmResult> {
    this.log(`Running Algorithm on: ${input.slice(0, 50)}...`);

    // Step 1: THINK — Capture current state
    const currentState = await this.analyzeCurrentState(input);

    // Step 2: Define ideal state
    const idealState = await this.defineIdealState(input);

    // Step 3: Identify gap
    const gap = await this.identifyGap(currentState, idealState);

    // Step 4: Generate transitions (seven-phase loop)
    const transitions = this.generateTransitions(gap, idealState);

    // Step 5: Calculate quality score
    const quality = this.calculateQuality(transitions, gap);

    // Step 6: Record in memory
    await this.recordRun(input, currentState, idealState, transitions, quality);

    return {
      isc: this.buildISC(input, idealState),
      currentState,
      idealState,
      gap,
      transitions,
      quality,
      executedAt: new Date().toISOString(),
    };
  }

  private async analyzeCurrentState(input: string): Promise<string> {
    // Query memory for relevant context
    const recentMemories = await this.memory.query({ search: input, limit: 5 });
    const memoryContext = recentMemories.map(m => m.content).join('\n');

    // Build current state description
    return `
Current situation analysis for: "${input}"

Relevant memory:
${memoryContext || 'No prior memory found.'}

Current blockers:
- Unknown factors requiring investigation
- Resources to be determined
- Dependencies to be mapped
`.trim();
  }

  private async defineIdealState(input: string): Promise<string> {
    // In production, this would call the LLM to define the ideal state
    // For now, return a structured template
    return `
Ideal State for: "${input}"

The desired outcome is a clear, measurable state where:
1. The problem stated in "${input}" is resolved
2. Success criteria are objectively verifiable
3. The solution is sustainable and maintainable
4. All stakeholders' needs are addressed

Vision: Achieve a state of clarity, capability, and confidence regarding this task.
`.trim();
  }

  private async identifyGap(current: string, ideal: string): Promise<string[]> {
    // Analyze gap between current and ideal
    const gap: string[] = [];

    if (current.includes('Unknown')) gap.push('Knowledge gap — need to research/understand');
    if (current.includes('resources')) gap.push('Resource gap — need tools or information');
    if (current.includes('dependencies')) gap.push('Dependency gap — need to resolve relationships');

    gap.push('Execution gap — need to take action');

    return gap;
  }

  private generateTransitions(gap: string[], ideal: string): Transition[] {
    const phases = [
      { name: 'THINK', action: 'Analyze the problem deeply, understand context and constraints' },
      { name: 'PLAN', action: 'Define clear steps, success criteria, and resource requirements' },
      { name: 'BUILD', action: 'Execute the planned steps with attention to quality' },
      { name: 'EXECUTE', action: 'Run the solution, handle edge cases, validate outputs' },
      { name: 'VERIFY', action: 'Check results against success criteria from PLAN phase' },
      { name: 'REFINE', action: 'Iterate based on verification feedback, close any gaps' },
      { name: 'LEARN', action: 'Document lessons learned, update memory for future reference' },
    ];

    return phases.map((phase, index) => ({
      phase: index + 1,
      name: phase.name,
      action: phase.action,
      expected: `After ${phase.name}: Progress toward ideal state`,
    }));
  }

  private calculateQuality(transitions: Transition[], gap: string[]): number {
    // Quality based on completeness of gap coverage
    let score = 50; // Base score

    // Each transition adds points
    score += transitions.length * 5;

    // Each addressed gap adds points
    score += (gap.length - transitions.length) * 10;

    // Cap at 100
    return Math.min(100, Math.max(0, score));
  }

  private async recordRun(
    input: string,
    current: string,
    ideal: string,
    transitions: Transition[],
    quality: number
  ): Promise<void> {
    await this.memory.add({
      type: 'WORK',
      content: `Algorithm run: ${input}\nQuality: ${quality}/100\nTransitions: ${transitions.map(t => t.name).join(' → ')}`,
      tags: ['algorithm', 'task', `quality-${quality}`],
      source: 'AlgorithmSystem',
      importance: 3,
    });
  }

  private buildISC(input: string, ideal: string): ISC {
    return {
      problem: input,
      vision: ideal,
      scope: 'Task-specific',
      principles: [
        'Start with understanding, not execution',
        'Verify before claiming success',
        'Learn from every iteration',
      ],
      constraints: [],
      goal: ideal,
      criteria: ['Task completed successfully', 'Quality maintained', 'Knowledge captured'],
      testStrategy: 'Validate output against initial requirements',
      features: [],
      decisions: [],
      changing: [],
      verification: [],
    };
  }

  /**
   * Load ISC from file
   */
  async loadISC(): Promise<ISC | null> {
    const iscPath = path.join(this.config.baseDir || '', 'USER', 'ISC.md');
    if (await fs.pathExists(iscPath)) {
      const content = await fs.readFile(iscPath, 'utf-8');
      return this.parseISC(content);
    }
    return null;
  }

  private parseISC(content: string): ISC {
    // Simple markdown ISC parser
    const isc: ISC = {
      problem: '', vision: '', scope: '', principles: [],
      constraints: [], goal: '', criteria: [], testStrategy: '',
      features: [], decisions: [], changing: [], verification: [],
    };

    const lines = content.split('\n');
    let currentSection = '';
    let inList = false;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        currentSection = line.slice(3).toLowerCase();
        inList = false;
      } else if (line.startsWith('- ') && currentSection) {
        inList = true;
        const value = line.slice(2);
        if (currentSection === 'principles') isc.principles.push(value);
        else if (currentSection === 'constraints') isc.constraints.push(value);
        else if (currentSection === 'criteria') isc.criteria.push(value);
      } else if (line.trim() && !line.startsWith('#') && !inList) {
        if (currentSection === 'problem') isc.problem += line.trim() + ' ';
        else if (currentSection === 'vision') isc.vision += line.trim() + ' ';
        else if (currentSection === 'scope') isc.scope += line.trim() + ' ';
        else if (currentSection === 'goal') isc.goal += line.trim() + ' ';
      }
    }

    return isc;
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`[Algorithm] ${message}`);
    }
  }
}