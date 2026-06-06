/**
 * Memory System — Persistent memory across sessions
 *
 * Stores What you've done, What you've learned, and What's worth keeping.
 * Three tiers: WORK, KNOWLEDGE, LEARNING plus typed graph across people,
 * companies, ideas, and research.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { MemoryEntry, MemoryQuery, MemoryStats, MemoryType } from '../types/memory';

export class MemorySystem {
  private baseDir: string;
  private debug: boolean;
  private memoryFile: string;
  private indexFile: string;
  private entries: Map<string, MemoryEntry> = new Map();

  constructor(baseDir: string, debug: boolean = false) {
    this.baseDir = baseDir;
    this.debug = debug;
    this.memoryFile = path.join(baseDir, 'MEMORY', 'entries.jsonl');
    this.indexFile = path.join(baseDir, 'MEMORY', 'index.json');
  }

  async init(): Promise<void> {
    const memoryDir = path.join(this.baseDir, 'MEMORY');
    await fs.ensureDir(memoryDir);

    // Load existing entries
    if (await fs.pathExists(this.memoryFile)) {
      const content = await fs.readFile(this.memoryFile, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as MemoryEntry;
          this.entries.set(entry.id, entry);
        } catch {
          // Skip malformed lines
        }
      }
    }

    this.log(`Memory system initialized with ${this.entries.size} entries`);
  }

  /**
   * Add a memory entry
   */
  async add(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<MemoryEntry> {
    const fullEntry: MemoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    this.entries.set(fullEntry.id, fullEntry);
    await this.persist(fullEntry);

    this.log(`Added memory: [${fullEntry.type}] ${fullEntry.content.slice(0, 50)}...`);
    return fullEntry;
  }

  /**
   * Query memories
   */
  async query(query: MemoryQuery): Promise<MemoryEntry[]> {
    let results = Array.from(this.entries.values());

    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(e =>
        query.tags!.some(tag => e.tags?.includes(tag))
      );
    }

    if (query.since) {
      const sinceDate = new Date(query.since);
      results = results.filter(e => new Date(e.timestamp) >= sinceDate);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(e =>
        e.content.toLowerCase().includes(searchLower) ||
        e.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Remove a memory entry
   */
  async remove(id: string): Promise<boolean> {
    if (this.entries.has(id)) {
      this.entries.delete(id);
      // Rewrite the file without the deleted entry
      await this.rebuildIndex();
      this.log(`Removed memory: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Get memory statistics
   */
  async stats(): Promise<MemoryStats> {
    const entries = Array.from(this.entries.values());
    const byType: Record<MemoryType, number> = {
      WORK: 0, KNOWLEDGE: 0, LEARNING: 0,
      RELATIONSHIP: 0, OBSERVATION: 0, STATE: 0,
    };
    const bySource: Record<string, number> = {};

    for (const entry of entries) {
      byType[entry.type]++;
      if (entry.source) {
        bySource[entry.source] = (bySource[entry.source] || 0) + 1;
      }
    }

    return { total: entries.length, byType, bySource };
  }

  /**
   * Get recent entries by type
   */
  async recent(type?: MemoryType, limit: number = 10): Promise<MemoryEntry[]> {
    return this.query({ type, limit });
  }

  /**
   * Update memory importance
   */
  async setImportance(id: string, importance: number): Promise<boolean> {
    const entry = this.entries.get(id);
    if (entry) {
      entry.importance = Math.max(1, Math.min(5, importance));
      await this.rebuildIndex();
      return true;
    }
    return false;
  }

  /**
   * Clear all memories (use with caution)
   */
  async clear(): Promise<void> {
    this.entries.clear();
    if (await fs.pathExists(this.memoryFile)) {
      await fs.remove(this.memoryFile);
    }
    if (await fs.pathExists(this.indexFile)) {
      await fs.remove(this.indexFile);
    }
    this.log('All memories cleared');
  }

  private async persist(entry: MemoryEntry): Promise<void> {
    await fs.ensureFile(this.memoryFile);
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(this.memoryFile, line, 'utf-8');
  }

  private async rebuildIndex(): Promise<void> {
    await fs.ensureFile(this.memoryFile);
    const lines = Array.from(this.entries.values()).map(e => JSON.stringify(e)).join('\n') + '\n';
    await fs.writeFile(this.memoryFile, lines, 'utf-8');
  }

  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 8);
    return `${timestamp}-${random}`;
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`[Memory] ${message}`);
    }
  }
}