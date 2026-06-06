# AIONE — Agentic AI Infrastructure SDK

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-60A5FA?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node-%3E%3D18.0.0-339933?style=for-the-badge" alt="Node">
</p>

<p align="center">
  <strong>Build production AI agents with memory, skills, workflows, and hooks.</strong><br>
  The Agentic AI Operating System — amplify human capability through AI workflow orchestration.
</p>

---

## What is AIONE?

**AIONE** (Agentic Intelligence ONE) is a TypeScript SDK that encapsulates the architecture of Personal AI Infrastructure — the system behind a project with **14,793 GitHub stars**. It provides:

- 🧠 **Persistent Memory** — Text-based, RAG-free. Your filesystem is the index.
- 🎯 **Skill System** — Self-contained, AI-installable capability packages
- 🔄 **Workflow Engine** — Structured task execution paths with routing
- 🪝 **Hook System** — Event-driven extensibility (SessionStart, PreToolUse, etc.)
- 🧮 **Algorithm** — Seven-phase Ideal State Assessment loop
- 🤖 **Agent Core** — LLM orchestration with context management

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    AIONE SDK                         │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  │
│  │ Memory  │  │ Skills  │  │Workflows│  │ Hooks  │  │
│  │ System  │  │ System  │  │ System  │  │ System │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └───┬────┘  │
│       └────────────┴────────────┴───────────┘        │
│                        │                              │
│              ┌─────────▼─────────┐                   │
│              │   Agent Core      │                   │
│              │  (LLM Orchestration)│                  │
│              └─────────┬─────────┘                   │
│                        │                              │
│              ┌─────────▼─────────┐                   │
│              │    Algorithm      │                   │
│              │ (Ideal State Loop)│                   │
│              └───────────────────┘                   │
└─────────────────────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      Anthropic     OpenAI         Local
       (Claude)     (GPT-4)       Models
```

---

## Quick Start

### Installation

```bash
npm install aione-sdk
```

### Basic Usage

```typescript
import { AIONE } from 'aione-sdk';

const sdk = new AIONE({
  baseDir: '~/.aione',        // AIONE data directory
  provider: 'anthropic',      // LLM provider
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-20250514',
  temperature: 0.7,
  debug: false,
});

await sdk.init();

// Run a conversation
const response = await sdk.run('Help me design a REST API for a task management app');
console.log(response.content);

// Remember something
await sdk.remember({
  type: 'KNOWLEDGE',
  content: 'The API should use JWT for authentication',
  tags: ['api', 'auth', 'design'],
  importance: 4,
});

// Search memory
const memories = await sdk.recall({ search: 'API design', limit: 5 });
```

---

## API Reference

### `new AIONE(config?)`

Create a new AIONE instance.

```typescript
interface AIONEConfig {
  baseDir?: string;        // Default: ~/.aione
  provider?: 'anthropic' | 'openai' | 'local';
  apiKey?: string;         // Or set ANTHROPIC_API_KEY env var
  baseUrl?: string;        // For custom endpoints
  model?: string;          // Default: claude-sonnet-4-20250514
  maxTokens?: number;      // Default: 4096
  temperature?: number;    // Default: 0.7
  debug?: boolean;         // Default: false
}
```

### `sdk.init()`

Initialize all subsystems. Must be called before any other methods.

```typescript
await sdk.init();
```

---

### Agent Methods

#### `sdk.run(userInput, options?)`

Run a conversation turn with the AI agent.

```typescript
const response = await sdk.run('Design a REST API', {
  skill: 'Research',      // Optional: route to a specific skill
  workflow: 'Search',     // Optional: use a specific workflow
});

console.log(response.content);   // The AI's response
console.log(response.done);      // Whether the conversation is complete
console.log(response.metrics);   // { tokensUsed, durationMs, toolsCalled }
```

---

### Memory Methods

#### `sdk.remember(entry)`

Add a memory entry.

```typescript
const entry = await sdk.remember({
  type: 'WORK',                    // WORK | KNOWLEDGE | LEARNING | RELATIONSHIP | OBSERVATION | STATE
  content: 'Completed the API auth module',
  tags: ['api', 'auth', 'completed'],
  source: 'AgentCore',
  importance: 4,                   // 1-5
});

// Returns: { id, timestamp, type, content, tags, source, importance }
```

#### `sdk.recall(query)`

Query memories.

```typescript
const memories = await sdk.recall({
  type: 'KNOWLEDGE',         // Optional: filter by type
  tags: ['api', 'design'],   // Optional: filter by tags (OR logic)
  search: 'REST',            // Optional: full-text search
  since: '2025-01-01',       // Optional: only memories after this date
  limit: 10,                 // Optional: max results (default: unlimited)
});
```

#### `sdk.forget(memoryId)`

Remove a memory entry.

```typescript
await sdk.forget('m1abc-xyz123');
```

#### `sdk.memoryStats()`

Get memory statistics.

```typescript
const stats = await sdk.memoryStats();
// {
//   total: 142,
//   byType: { WORK: 45, KNOWLEDGE: 67, LEARNING: 12, ... },
//   bySource: { AgentCore: 89, Research: 53, ... }
// }
```

---

### Skill Methods

#### `sdk.loadSkill(skillPath)`

Load a skill from a directory (must contain `SKILL.md`).

```typescript
const skill = await sdk.loadSkill('~/skills/Research');
console.log(skill.name);      // 'Research'
console.log(skill.workflows); // [Workflow, Workflow, ...]
console.log(skill.tools);     // [Tool, Tool, ...]
```

#### `sdk.listSkills()`

List all installed skills.

```typescript
const skills = await sdk.listSkills();
// [{ name: 'Research', description: '...', effort: 'medium', ... }, ...]
```

#### `sdk.executeSkill(skillName, workflow?)`

Execute a skill's workflow.

```typescript
const result = await sdk.executeSkill('ArXiv', 'Search');
// {
//   success: true,
//   output: '...',
//   durationMs: 1234,
//   workflow: 'Search',
// }
```

---

### Workflow Methods

#### `sdk.getWorkflow(workflowPath)`

Get a workflow by path or name.

```typescript
const workflow = await sdk.getWorkflow('Research/Paper');
```

#### `sdk.listWorkflows()`

List all available workflows.

```typescript
const workflows = await sdk.listWorkflows();
```

#### `sdk.routeWorkflow(input)`

Route input text to the best matching workflow.

```typescript
const workflow = await sdk.routeWorkflow('Find me papers on transformers');
// Returns the best match or null
```

---

### Hook Methods

#### `sdk.registerHook(hook)`

Register a new hook.

```typescript
await sdk.registerHook({
  name: 'log-session',
  event: 'SessionStart',
  script: 'echo "Session started"',
  runtime: 'bash',
  enabled: true,
});
```

#### `sdk.listHooks(event?)`

List hooks, optionally filtered by event type.

```typescript
const allHooks = await sdk.listHooks();
const startHooks = await sdk.listHooks('SessionStart');
```

#### `sdk.removeHook(name)`

Remove a hook by name.

```typescript
await sdk.removeHook('log-session');
```

**Hook Events:**
- `SessionStart` — Fires when a session begins
- `UserPromptSubmit` — Fires when user submits input
- `PreToolUse` — Fires before a tool is called
- `PostToolUse` — Fires after a tool completes
- `Stop` — Fires when session stops
- `SessionEnd` — Fires when session ends
- `PreCompact` — Fires before context compaction
- `PostCompact` — Fires after context compaction

---

### Algorithm Methods

#### `sdk.assess(task)`

Run the Ideal State Assessment Algorithm on a task.

```typescript
const result = await sdk.assess('Design a task management REST API');

console.log(result.quality);     // 0-100 quality score
console.log(result.gap);         // ['Knowledge gap', 'Resource gap', ...]
console.log(result.transitions); // [{ phase, name, action, expected }, ...]
// Transitions follow the seven-phase loop:
// THINK → PLAN → BUILD → EXECUTE → VERIFY → REFINE → LEARN
```

---

### DA & ISC Methods

#### `sdk.getDA()` / `sdk.updateDA(updates)`

Get or update the Digital Assistant identity.

```typescript
const da = sdk.getDA();
// { name: 'AIONE', fullName: 'Agentic Intelligence ONE', voice: '...', personality: '...' }

await sdk.updateDA({
  name: 'Friday',
  voice: 'en-US-Neural-Female-1',
  personality: 'Helpful, witty, efficient',
});
```

#### `sdk.getISC()` / `sdk.updateISC(updates)`

Get or update the Ideal State Criteria document.

```typescript
const isc = sdk.getISC();
// { problem, vision, scope, principles, constraints, goal, criteria, ... }

await sdk.updateISC({
  problem: 'Need to build a scalable API',
  vision: 'A system that can handle 10k req/s',
  goal: 'Deploy to production within 2 weeks',
});
```

---

## CLI Usage

```bash
# Initialize
aione init

# Run agent
aione run "Design a REST API for task management"

# Memory operations
aione memory add "Completed the auth module" --tag api --tag auth
aione memory search "authentication"
aione memory stats

# Skill operations
aione skills list
aione skills run Research Search
aione skills load ~/skills/ArXiv

# Algorithm
aione algorithm run "design a scalable notification system"

# System info
aione info
```

---

## Data Directory Structure

```
~/.aione/
├── MEMORY/
│   ├── entries.jsonl      # All memory entries (JSONL)
│   └── index.json         # Search index
├── SKILLS/                # Installed skills
│   ├── Research/
│   │   ├── SKILL.md
│   │   ├── Workflows/
│   │   │   ├── Search.md
│   │   │   └── Paper.md
│   │   └── Tools/
│   │       └── search.ts
│   └── ArXiv/
├── WORKFLOWS/             # Standalone workflows
├── HOOKS/                 # Hook definitions
│   └── my-hook.hook.ts
└── USER/
    ├── DA_IDENTITY.md     # DA identity document
    └── ISC.md             # Ideal State Criteria
```

---

## Deployment Guide

### Local Development

```bash
git clone https://github.com/q15004040209-creator/personal-ai-infrastructure-wrap.git
cd personal-ai-infrastructure-wrap
npm install
npm run build
npm link  # Link globally

# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run
aione init
aione info
```

### Production Deployment

#### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
COPY bin/ ./bin/
ENV PATH="/app/bin:$PATH"
CMD ["node", "dist/cli.js", "info"]
```

```bash
docker build -t aione-sdk .
docker run -v ~/.aione:/root/.aione -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY aione-sdk info
```

#### systemd Service (Linux/macOS)

```ini
[Unit]
Description=AIONE SDK Service
After=network.target

[Service]
Type=simple
User=%u
Environment=ANTHROPIC_API_KEY=%i
ExecStart=/usr/local/bin/aione run
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
```

```bash
# Install for user
systemctl --user enable aione@sk-ant-...
systemctl --user start aione@sk-ant-...
```

#### PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start dist/cli.js --name aione -- run "Help me with code review"
pm2 save
pm2 startup
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | — |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | — |
| `AIONE_BASE_DIR` | AIONE data directory | `~/.aione` |
| `DEBUG` | Enable debug logging | `false` |

---

## Examples

### Example 1: Research Assistant

See `examples/research-assistant/` for a complete setup.

```typescript
import { AIONE } from 'aione-sdk';

const sdk = new AIONE({ provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY });
await sdk.init();

// Load research skill
await sdk.loadSkill('./skills/Research');

// Search for papers
const result = await sdk.executeSkill('Research', 'Search');
console.log(result.output);
```

### Example 2: Memory-Augmented Chatbot

```typescript
const sdk = new AIONE({ apiKey: process.env.ANTHROPIC_API_KEY });
await sdk.init();

async function chat(input: string) {
  // Remember the conversation
  await sdk.remember({
    type: 'WORK',
    content: `User said: ${input}`,
    source: 'ChatSession',
    importance: 2,
  });

  // Get relevant memories
  const context = await sdk.recall({ search: input, limit: 3 });

  // Run with context
  const response = await sdk.run(input);

  // Remember the response
  await sdk.remember({
    type: 'WORK',
    content: `Assistant said: ${response.content}`,
    source: 'ChatSession',
    importance: 2,
  });

  return response;
}
```

### Example 3: Algorithm-Driven Task Planning

```typescript
const sdk = new AIONE();
await sdk.init();

// Run the Algorithm
const result = await sdk.assess('Build a real-time collaboration feature for our app');

console.log(`Quality: ${result.quality}/100`);
console.log('Plan:');
for (const t of result.transitions) {
  console.log(`  ${t.phase}. ${t.name}: ${t.action}`);
}
```

---

## Type Definitions

All types are exported from the main package:

```typescript
import {
  AIONE,
  AIONEConfig,
  Skill,
  Workflow,
  Tool,
  MemoryEntry,
  MemoryQuery,
  MemoryStats,
  Hook,
  HookEvent,
  ISC,
  AlgorithmResult,
  AgentResponse,
  DA,
  ExecutionContext,
} from 'aione-sdk';
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ for the Agentic AI future.</strong>
</p>