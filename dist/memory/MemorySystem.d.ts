/**
 * Memory System — Persistent memory across sessions
 *
 * Stores What you've done, What you've learned, and What's worth keeping.
 * Three tiers: WORK, KNOWLEDGE, LEARNING plus typed graph across people,
 * companies, ideas, and research.
 */
import { MemoryEntry, MemoryQuery, MemoryStats, MemoryType } from '../types/memory';
export declare class MemorySystem {
    private baseDir;
    private debug;
    private memoryFile;
    private indexFile;
    private entries;
    constructor(baseDir: string, debug?: boolean);
    init(): Promise<void>;
    /**
     * Add a memory entry
     */
    add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry>;
    /**
     * Query memories
     */
    query(query: MemoryQuery): Promise<MemoryEntry[]>;
    /**
     * Remove a memory entry
     */
    remove(id: string): Promise<boolean>;
    /**
     * Get memory statistics
     */
    stats(): Promise<MemoryStats>;
    /**
     * Get recent entries by type
     */
    recent(type?: MemoryType, limit?: number): Promise<MemoryEntry[]>;
    /**
     * Update memory importance
     */
    setImportance(id: string, importance: number): Promise<boolean>;
    /**
     * Clear all memories (use with caution)
     */
    clear(): Promise<void>;
    private persist;
    private rebuildIndex;
    private generateId;
    private log;
}
//# sourceMappingURL=MemorySystem.d.ts.map