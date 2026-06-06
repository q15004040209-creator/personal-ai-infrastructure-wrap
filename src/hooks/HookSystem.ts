/**
 * Hook System — Event-driven extensibility
 *
 * Hooks fire on life cycle events: SessionStart, UserPromptSubmit,
 * PreToolUse, PostToolUse, Stop, SessionEnd, PreCompact, PostCompact.
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { Hook, HookEvent, HookExecution } from '../types/hook';
import { ExecutionContext } from '../types/core';

export class HookSystem {
  private baseDir: string;
  private debug: boolean;
  private hooks: Map<string, Hook> = new Map();
  private hooksDir: string;

  constructor(baseDir: string, debug: boolean = false) {
    this.baseDir = baseDir;
    this.debug = debug;
    this.hooksDir = path.join(baseDir, 'HOOKS');
  }

  async init(): Promise<void> {
    await fs.ensureDir(this.hooksDir);

    // Load hook definitions
    const hookFiles = await fs.readdir(this.hooksDir);
    for (const file of hookFiles) {
      if (file.endsWith('.hook.ts') || file.endsWith('.hook.json')) {
        try {
          const hookPath = path.join(this.hooksDir, file);
          const hook = await this.loadHook(hookPath);
          if (hook.enabled !== false) {
            this.hooks.set(hook.name, hook);
          }
        } catch (e) {
          this.log(`Warning: Failed to load hook ${file}: ${e}`);
        }
      }
    }

    this.log(`Hook system initialized with ${this.hooks.size} hooks`);
  }

  /**
   * Register a new hook
   */
  async register(hook: Hook): Promise<void> {
    // Save to file
    const hookPath = path.join(this.hooksDir, `${hook.name}.hook.ts`);
    const content = this.formatHook(hook);
    await fs.writeFile(hookPath, content, 'utf-8');
    this.hooks.set(hook.name, hook);
    this.log(`Registered hook: ${hook.name} (${hook.event})`);
  }

  /**
   * List hooks, optionally filtered by event
   */
  list(event?: HookEvent): Hook[] {
    const hooks = Array.from(this.hooks.values());
    if (event) {
      return hooks.filter(h => h.event === event);
    }
    return hooks;
  }

  /**
   * Remove a hook by name
   */
  async remove(name: string): Promise<boolean> {
    const hook = this.hooks.get(name);
    if (!hook) return false;

    const hookPath = path.join(this.hooksDir, `${name}.hook.ts`);
    if (await fs.pathExists(hookPath)) {
      await fs.remove(hookPath);
    }

    this.hooks.delete(name);
    this.log(`Removed hook: ${name}`);
    return true;
  }

  /**
   * Fire all hooks for a specific event
   */
  async fire(event: HookEvent, context: ExecutionContext, data?: Record<string, unknown>): Promise<HookExecution[]> {
    const executions: HookExecution[] = [];
    const eventHooks = this.list(event);

    for (const hook of eventHooks) {
      const startTime = Date.now();
      try {
        const output = await this.executeHook(hook, context, data);
        executions.push({
          hook,
          triggeredAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          success: true,
          output,
        });
      } catch (error) {
        executions.push({
          hook,
          triggeredAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          success: false,
          error: String(error),
        });
      }
    }

    return executions;
  }

  /**
   * Check if any hooks are registered for an event
   */
  hasEventListeners(event: HookEvent): boolean {
    return this.list(event).length > 0;
  }

  private async loadHook(hookPath: string): Promise<Hook> {
    const content = await fs.readFile(hookPath, 'utf-8');

    // Parse hook metadata from comments
    const name = path.basename(hookPath, path.extname(hookPath)).replace('.hook', '');
    let event: HookEvent = 'SessionStart';
    let enabled = true;
    let script = content;

    const eventMatch = content.match(/@event\s+(\w+)/);
    if (eventMatch) {
      event = eventMatch[1] as HookEvent;
    }

    const enabledMatch = content.match(/@enabled\s+(true|false)/);
    if (enabledMatch) {
      enabled = enabledMatch[1] === 'true';
    }

    return { name, event, script, enabled };
  }

  private formatHook(hook: Hook): string {
    return `/**
 * @event ${hook.event}
 * @enabled ${hook.enabled !== false}
 * @runtime ${hook.runtime || 'bun'}
 */

${hook.script}
`;
  }

  private async executeHook(
    hook: Hook,
    context: ExecutionContext,
    data?: Record<string, unknown>
  ): Promise<string> {
    // In a full implementation, this would spawn a subprocess
    // For now, we return a summary
    return `[Hook: ${hook.name}] fired on ${hook.event} for session ${context.sessionId}`;
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`[Hook] ${message}`);
    }
  }
}