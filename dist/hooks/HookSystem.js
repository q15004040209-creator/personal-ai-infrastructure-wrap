"use strict";
/**
 * Hook System — Event-driven extensibility
 *
 * Hooks fire on life cycle events: SessionStart, UserPromptSubmit,
 * PreToolUse, PostToolUse, Stop, SessionEnd, PreCompact, PostCompact.
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
exports.HookSystem = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
class HookSystem {
    baseDir;
    debug;
    hooks = new Map();
    hooksDir;
    constructor(baseDir, debug = false) {
        this.baseDir = baseDir;
        this.debug = debug;
        this.hooksDir = path.join(baseDir, 'HOOKS');
    }
    async init() {
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
                }
                catch (e) {
                    this.log(`Warning: Failed to load hook ${file}: ${e}`);
                }
            }
        }
        this.log(`Hook system initialized with ${this.hooks.size} hooks`);
    }
    /**
     * Register a new hook
     */
    async register(hook) {
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
    list(event) {
        const hooks = Array.from(this.hooks.values());
        if (event) {
            return hooks.filter(h => h.event === event);
        }
        return hooks;
    }
    /**
     * Remove a hook by name
     */
    async remove(name) {
        const hook = this.hooks.get(name);
        if (!hook)
            return false;
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
    async fire(event, context, data) {
        const executions = [];
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
            }
            catch (error) {
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
    hasEventListeners(event) {
        return this.list(event).length > 0;
    }
    async loadHook(hookPath) {
        const content = await fs.readFile(hookPath, 'utf-8');
        // Parse hook metadata from comments
        const name = path.basename(hookPath, path.extname(hookPath)).replace('.hook', '');
        let event = 'SessionStart';
        let enabled = true;
        let script = content;
        const eventMatch = content.match(/@event\s+(\w+)/);
        if (eventMatch) {
            event = eventMatch[1];
        }
        const enabledMatch = content.match(/@enabled\s+(true|false)/);
        if (enabledMatch) {
            enabled = enabledMatch[1] === 'true';
        }
        return { name, event, script, enabled };
    }
    formatHook(hook) {
        return `/**
 * @event ${hook.event}
 * @enabled ${hook.enabled !== false}
 * @runtime ${hook.runtime || 'bun'}
 */

${hook.script}
`;
    }
    async executeHook(hook, context, data) {
        // In a full implementation, this would spawn a subprocess
        // For now, we return a summary
        return `[Hook: ${hook.name}] fired on ${hook.event} for session ${context.sessionId}`;
    }
    log(message) {
        if (this.debug) {
            console.log(`[Hook] ${message}`);
        }
    }
}
exports.HookSystem = HookSystem;
//# sourceMappingURL=HookSystem.js.map