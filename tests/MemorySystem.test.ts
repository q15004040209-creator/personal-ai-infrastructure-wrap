/**
 * Memory System Tests
 */

import { MemorySystem } from '../src/memory/MemorySystem';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('MemorySystem', () => {
  const testDir = path.join(__dirname, '.test-aione-memory');
  let memory: MemorySystem;

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    await fs.emptyDir(testDir);
    memory = new MemorySystem(testDir, false);
    await memory.init();
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  test('should initialize with empty entries', async () => {
    const stats = await memory.stats();
    expect(stats.total).toBe(0);
  });

  test('should add memory entries', async () => {
    const entry = await memory.add({
      type: 'WORK',
      content: 'Test memory entry',
      tags: ['test'],
      importance: 3,
    });

    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.content).toBe('Test memory entry');
    expect(entry.type).toBe('WORK');
  });

  test('should query memories by search', async () => {
    await memory.add({ type: 'WORK', content: 'TypeScript is great', tags: ['ts'], importance: 4 });
    await memory.add({ type: 'WORK', content: 'Python is also great', tags: ['py'], importance: 3 });
    await memory.add({ type: 'KNOWLEDGE', content: 'TypeScript has strict typing', tags: ['ts'], importance: 5 });

    const results = await memory.query({ search: 'TypeScript' });
    expect(results.length).toBe(2);
  });

  test('should query memories by type', async () => {
    await memory.add({ type: 'WORK', content: 'Work task 1', importance: 3 });
    await memory.add({ type: 'KNOWLEDGE', content: 'Knowledge fact', importance: 4 });
    await memory.add({ type: 'WORK', content: 'Work task 2', importance: 3 });

    const results = await memory.query({ type: 'WORK' });
    expect(results.length).toBe(2);
    expect(results.every(r => r.type === 'WORK')).toBe(true);
  });

  test('should query memories by tags', async () => {
    await memory.add({ type: 'WORK', content: 'Task 1', tags: ['urgent', 'api'], importance: 4 });
    await memory.add({ type: 'WORK', content: 'Task 2', tags: ['api'], importance: 3 });
    await memory.add({ type: 'WORK', content: 'Task 3', tags: ['design'], importance: 3 });

    const results = await memory.query({ tags: ['api'] });
    expect(results.length).toBe(2);
  });

  test('should return memory statistics', async () => {
    await memory.add({ type: 'WORK', content: 'Task 1', importance: 3 });
    await memory.add({ type: 'WORK', content: 'Task 2', importance: 3 });
    await memory.add({ type: 'KNOWLEDGE', content: 'Fact', importance: 4 });

    const stats = await memory.stats();
    expect(stats.total).toBe(3);
    expect(stats.byType.WORK).toBe(2);
    expect(stats.byType.KNOWLEDGE).toBe(1);
  });

  test('should remove memory entries', async () => {
    const entry = await memory.add({ type: 'WORK', content: 'To be deleted', importance: 3 });
    const removed = await memory.remove(entry.id);
    expect(removed).toBe(true);

    const results = await memory.query({ search: 'deleted' });
    expect(results.length).toBe(0);
  });

  test('should limit query results', async () => {
    for (let i = 0; i < 10; i++) {
      await memory.add({ type: 'WORK', content: `Task ${i}`, importance: 3 });
    }

    const results = await memory.query({ limit: 3 });
    expect(results.length).toBe(3);
  });

  test('should clear all memories', async () => {
    await memory.add({ type: 'WORK', content: 'Task 1', importance: 3 });
    await memory.add({ type: 'KNOWLEDGE', content: 'Fact', importance: 4 });

    await memory.clear();
    const stats = await memory.stats();
    expect(stats.total).toBe(0);
  });
});