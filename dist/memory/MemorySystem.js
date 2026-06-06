"use strict";
/**
 * Memory System — Persistent memory across sessions
 *
 * Stores What you've done, What you've learned, and What's worth keeping.
 * Three tiers: WORK, KNOWLEDGE, LEARNING plus typed graph across people,
 * companies, ideas, and research.
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
exports.MemorySystem = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
class MemorySystem {
    baseDir;
    debug;
    memoryFile;
    indexFile;
    entries = new Map();
    constructor(baseDir, debug = false) {
        this.baseDir = baseDir;
        this.debug = debug;
        this.memoryFile = path.join(baseDir, 'MEMORY', 'entries.jsonl');
        this.indexFile = path.join(baseDir, 'MEMORY', 'index.json');
    }
    async init() {
        const memoryDir = path.join(this.baseDir, 'MEMORY');
        await fs.ensureDir(memoryDir);
        // Load existing entries
        if (await fs.pathExists(this.memoryFile)) {
            const content = await fs.readFile(this.memoryFile, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);
                    this.entries.set(entry.id, entry);
                }
                catch {
                    // Skip malformed lines
                }
            }
        }
        this.log(`Memory system initialized with ${this.entries.size} entries`);
    }
    /**
     * Add a memory entry
     */
    async add(entry) {
        const fullEntry = {
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
    async query(query) {
        let results = Array.from(this.entries.values());
        if (query.type) {
            results = results.filter(e => e.type === query.type);
        }
        if (query.tags && query.tags.length > 0) {
            results = results.filter(e => query.tags.some(tag => e.tags?.includes(tag)));
        }
        if (query.since) {
            const sinceDate = new Date(query.since);
            results = results.filter(e => new Date(e.timestamp) >= sinceDate);
        }
        if (query.search) {
            const searchLower = query.search.toLowerCase();
            results = results.filter(e => e.content.toLowerCase().includes(searchLower) ||
                e.tags?.some(t => t.toLowerCase().includes(searchLower)));
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
    async remove(id) {
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
    async stats() {
        const entries = Array.from(this.entries.values());
        const byType = {
            WORK: 0, KNOWLEDGE: 0, LEARNING: 0,
            RELATIONSHIP: 0, OBSERVATION: 0, STATE: 0,
        };
        const bySource = {};
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
    async recent(type, limit = 10) {
        return this.query({ type, limit });
    }
    /**
     * Update memory importance
     */
    async setImportance(id, importance) {
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
    async clear() {
        this.entries.clear();
        if (await fs.pathExists(this.memoryFile)) {
            await fs.remove(this.memoryFile);
        }
        if (await fs.pathExists(this.indexFile)) {
            await fs.remove(this.indexFile);
        }
        this.log('All memories cleared');
    }
    async persist(entry) {
        await fs.ensureFile(this.memoryFile);
        const line = JSON.stringify(entry) + '\n';
        await fs.appendFile(this.memoryFile, line, 'utf-8');
    }
    async rebuildIndex() {
        await fs.ensureFile(this.memoryFile);
        const lines = Array.from(this.entries.values()).map(e => JSON.stringify(e)).join('\n') + '\n';
        await fs.writeFile(this.memoryFile, lines, 'utf-8');
    }
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).slice(2, 8);
        return `${timestamp}-${random}`;
    }
    log(message) {
        if (this.debug) {
            console.log(`[Memory] ${message}`);
        }
    }
}
exports.MemorySystem = MemorySystem;
//# sourceMappingURL=MemorySystem.js.map