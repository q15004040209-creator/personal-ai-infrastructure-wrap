export type MemoryType = 'WORK' | 'KNOWLEDGE' | 'LEARNING' | 'RELATIONSHIP' | 'OBSERVATION' | 'STATE';
export interface MemoryEntry {
    id: string;
    timestamp: string;
    type: MemoryType;
    content: string;
    tags?: string[];
    source?: string;
    importance?: number;
}
export interface MemoryQuery {
    type?: MemoryType;
    tags?: string[];
    since?: string;
    limit?: number;
    search?: string;
}
export interface MemoryStats {
    total: number;
    byType: Record<MemoryType, number>;
    bySource: Record<string, number>;
}
//# sourceMappingURL=memory.d.ts.map