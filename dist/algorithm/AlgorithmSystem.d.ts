/**
 * Algorithm System — Ideal State Assessment (Seven-Phase Loop)
 *
 * The Algorithm is the gravitational center of AIONE.
 * It drives the current → ideal state transition through seven phases:
 * THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN
 *
 * Modeled on Deutche's framework for "good" via hard-to-vary explanations.
 */
import { AIONEConfig } from '../types/core';
import { ISC, AlgorithmResult } from '../types/algorithm';
import { MemorySystem } from '../memory/MemorySystem';
export declare class AlgorithmSystem {
    private config;
    private memory;
    private debug;
    constructor(config: AIONEConfig, memory: MemorySystem, debug?: boolean);
    /**
     * Run the Algorithm on an input task
     */
    run(input: string): Promise<AlgorithmResult>;
    private analyzeCurrentState;
    private defineIdealState;
    private identifyGap;
    private generateTransitions;
    private calculateQuality;
    private recordRun;
    private buildISC;
    /**
     * Load ISC from file
     */
    loadISC(): Promise<ISC | null>;
    private parseISC;
    private log;
}
//# sourceMappingURL=AlgorithmSystem.d.ts.map