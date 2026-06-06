/**
 * Hook System — Event-driven extensibility
 *
 * Hooks fire on life cycle events: SessionStart, UserPromptSubmit,
 * PreToolUse, PostToolUse, Stop, SessionEnd, PreCompact, PostCompact.
 */
import { Hook, HookEvent, HookExecution } from '../types/hook';
import { ExecutionContext } from '../types/core';
export declare class HookSystem {
    private baseDir;
    private debug;
    private hooks;
    private hooksDir;
    constructor(baseDir: string, debug?: boolean);
    init(): Promise<void>;
    /**
     * Register a new hook
     */
    register(hook: Hook): Promise<void>;
    /**
     * List hooks, optionally filtered by event
     */
    list(event?: HookEvent): Hook[];
    /**
     * Remove a hook by name
     */
    remove(name: string): Promise<boolean>;
    /**
     * Fire all hooks for a specific event
     */
    fire(event: HookEvent, context: ExecutionContext, data?: Record<string, unknown>): Promise<HookExecution[]>;
    /**
     * Check if any hooks are registered for an event
     */
    hasEventListeners(event: HookEvent): boolean;
    private loadHook;
    private formatHook;
    private executeHook;
    private log;
}
//# sourceMappingURL=HookSystem.d.ts.map