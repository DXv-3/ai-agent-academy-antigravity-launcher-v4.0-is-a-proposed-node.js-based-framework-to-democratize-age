# AGENTS.md — Agent Architecture & Patterns

## What is an Agent?

In AI Agent Academy, an **agent** is an autonomous Node.js process that:
1. Receives a task (via CLI, API, or Antigravity workspace)
2. Uses an AI model (Gemini 3 Pro or Ollama) to reason about the task
3. Executes actions (terminal commands, API calls, file operations, browser actions)
4. Reports results back to the orchestrator or Antigravity workspace

---

## Agent Anatomy

Every agent follows this structure:

```javascript
// agent.js — Standard Agent Template
'use strict';

// 1. Configuration
const CONFIG = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  antigravityHost: process.env.ANTIGRAVITY_HOST || 'http://localhost:3000',
};

// 2. Task Definition
const task = process.argv[2] || 'default task';

// 3. Core Logic
async function run() {
  console.log('🤖 Agent starting:', task);
  
  // a. Plan: use AI to break down the task
  const plan = await planTask(task);
  
  // b. Execute: run each step
  for (const step of plan.steps) {
    await executeStep(step);
  }
  
  // c. Report: return structured results
  return { success: true, task, results: [] };
}

// 4. Entry Point
run().then(console.log).catch(console.error);
```

---

## Agent Types

### 1. Solo Agent
A single agent executing a focused task.

```bash
node dist/agent-research.js "summarize latest transformer papers"
```

**Best for:** Well-defined, single-domain tasks

### 2. Swarm Agent
Multiple agents working in parallel on decomposed subtasks.

```bash
npm run swarm "build and deploy a REST API for user management"
```

**Best for:** Complex tasks that can be parallelized

### 3. Pipeline Agent
Agents chained sequentially, each feeding output to the next.

```
[Research Agent] → [Analysis Agent] → [Report Agent] → [Deploy Agent]
```

**Best for:** Multi-stage workflows with dependencies

### 4. Reactive Agent
An agent that listens for events and responds autonomously.

```javascript
// Triggered by webhook, file change, or schedule
app.post('/webhook', async (req) => {
  await agent.handle(req.body);
});
```

**Best for:** Monitoring, automation, event-driven workflows

---

## Agent Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Lifecycle                       │
├─────────────────────────────────────────────────────────┤
│  1. INIT      → Load config, detect model               │
│  2. PLAN      → AI generates execution plan             │
│  3. PRE-HOOK  → hooks.onAgentStart() approval           │
│  4. EXECUTE   → Run steps with policy checks            │
│  5. RETRY     → On failure, retry up to N times         │
│  6. REPORT    → Structured output + Antigravity deploy  │
│  7. POST-HOOK → hooks.onAgentComplete() cleanup         │
└─────────────────────────────────────────────────────────┘
```

---

## Model Selection

Agents autodetect the best available model:

| Priority | Provider | Model | When Used |
|----------|----------|-------|-----------|
| 1 | Gemini | gemini-3-pro | `GEMINI_API_KEY` is set |
| 2 | Gemini | gemini-3-flash | Gemini key set, speed preferred |
| 3 | Ollama | llama3 | Ollama running locally |
| 4 | Ollama | mistral | Llama3 not available |
| 5 | Template | none | No model available (template-only) |

```javascript
// Autodetect in agent-builder.js
const modelInfo = await detectModel();
// → { provider: 'gemini', model: 'gemini-3-pro' }
```

---

## Swarm Orchestration

The swarm orchestrator decomposes tasks and runs agents in parallel:

```
Task: "Research and summarize AI agent papers from 2025"
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                  Task Decomposer                         │
├─────────────────────────────────────────────────────────┤
│  Subtask 1: Search and collect arXiv sources            │
│  Subtask 2: Analyze and synthesize findings             │
│  Subtask 3: Generate summary report                     │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Worker 1 │  │ Worker 2 │  │ Worker 3 │  ← Parallel
└──────────┘  └──────────┘  └──────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Antigravity Deploy                          │
│  Results aggregated and deployed to workspace           │
└─────────────────────────────────────────────────────────┘
```

---

## MCP Integration

Agents expose their capabilities via the Model Context Protocol (MCP):

```json
// Antigravity mcp.json
{
  "mcpServers": {
    "ai-agent-academy": {
      "command": "node",
      "args": ["src/antigravity-bridge/mcp-server.js"],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    }
  }
}
```

Once connected, Antigravity IDE can:
- Call `academy_build_agent` to build agents via chat
- Call `academy_swarm` to launch parallel agent swarms
- Call `academy_marketplace_publish` to share agents

---

## Policy & Safety

All agent actions pass through `src/antigravity-bridge/hooks.js`:

```javascript
// Before terminal execution:
hooks.approveTerminalCommand('npm run build')
// → { approved: true, reason: 'Matches allowlist' }

hooks.approveTerminalCommand('rm -rf /')
// → { approved: false, reason: 'Blocked by policy', blocked: true }

// Before browser actions:
hooks.approveBrowserAction('navigate', 'https://arxiv.org')
// → { approved: true }

hooks.approveBrowserAction('navigate', 'file:///etc/passwd')
// → { approved: false, reason: 'URL blocked by policy' }
```

---

## Writing Your Own Agent

### Minimal Agent (10 lines)

```javascript
#!/usr/bin/env node
const task = process.argv[2] || 'hello world';

async function run() {
  console.log('🤖 Running:', task);
  // Your logic here
  return { success: true, task };
}

run().then(r => console.log('Done:', r)).catch(console.error);
```

### Full Agent with Gemini

```javascript
#!/usr/bin/env node
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

async function run(task) {
  const result = await model.generateContent(task);
  return result.response.text();
}

run(process.argv[2] || 'Explain AI agents in one sentence')
  .then(console.log)
  .catch(console.error);
```

### Deploy to Antigravity

```bash
# Build from description
node src/agent-builder.js "my agent description"

# Or use a template
node src/agent-templates/index.js research-arxiv

# Or no-code chat
npm run no-code
```

---

## Agent Template Categories

| Category | Count | Examples |
|----------|-------|---------|
| research | 8 | arXiv, web, competitor, patent |
| codegen | 10 | API, React, tests, docs, SQL |
| deploy | 7 | Docker, K8s, Vercel, GCP, Antigravity |
| data-analysis | 7 | CSV, ETL, ML prep, reports |
| web | 6 | scraper, monitor, SEO, a11y |
| api | 10 | GitHub, Slack, Notion, Stripe |
| automation | 8 | files, email, git, backup |
| ml | 8 | classify, RAG, embeddings, finetune |
| content | 6 | blog, social, video, email copy |
| security | 4 | scan, deps, secrets, pentest |
| devops | 4 | IaC, logs, cost, incidents |
| antigravity | 5 | workspace, skills, swarm, MCP |

**Total: 83+ templates** (growing with community contributions)

---

*See `src/agent-templates/index.js` for the full registry*
