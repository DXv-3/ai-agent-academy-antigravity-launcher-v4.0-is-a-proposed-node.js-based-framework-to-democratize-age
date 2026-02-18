# AI Agent Academy — Tutorials

> From zero to deployed agent in 90 seconds. No coding required.

---

## Table of Contents

1. [Quick Start (90 seconds)](#1-quick-start-90-seconds)
2. [Your First Agent](#2-your-first-agent)
3. [Using Templates](#3-using-templates)
4. [No-Code Chat Mode](#4-no-code-chat-mode)
5. [Swarm Orchestration](#5-swarm-orchestration)
6. [Connecting to Antigravity IDE](#6-connecting-to-antigravity-ide)
7. [Publishing to the Marketplace](#7-publishing-to-the-marketplace)
8. [Building Custom Skills](#8-building-custom-skills)
9. [Docker Deployment](#9-docker-deployment)
10. [Advanced: Custom Templates](#10-advanced-custom-templates)

---

## 1. Quick Start (90 seconds)

### Prerequisites
- Node.js 20+ installed
- (Optional) Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- (Optional) Ollama running locally for offline mode

### Steps

```bash
# 1. Clone and install
git clone <this-repo> ai-agent-academy-antigravity-v4.0
cd ai-agent-academy-antigravity-v4.0
npm install

# 2. (Optional) Set your Gemini API key
export GEMINI_API_KEY=your_key_here

# 3. Build your first agent
node src/agent-builder.js "research agent that summarizes arXiv papers"

# 4. Start the Antigravity bridge
npm run antigravity
```

**That's it!** Your agent is deployed. 🎉

---

## 2. Your First Agent

### Option A: Command Line

```bash
node src/agent-builder.js "web scraper that extracts product prices from Amazon"
```

Output:
```
🚀 [Academy] Building agent for: "web scraper that extracts product prices..."
✅ [Academy] Gemini 3 Pro detected via GEMINI_API_KEY
🤖 [Academy] Using model: gemini/gemini-3-pro
   Generating agent code...
✅ [Academy] Agent written to: dist/agent-web-scraper-that-extracts-product.js
📡 [Academy] Deploying to Antigravity workspace...
✅ [Academy] Agent deployed to Antigravity in <90s! 🎉
```

### Option B: No-Code Chat

```bash
npm run no-code
```

```
╔══════════════════════════════════════════════════════════════╗
║        🚀 AI Agent Academy + Antigravity Launcher v4.0       ║
║                    No-Code Chat Mode                         ║
╚══════════════════════════════════════════════════════════════╝

🔍 Detecting AI model... gemini/gemini-3-pro ✅

💬 Describe the agent you want to build, or type "help" for commands.

You > web scraper that extracts product prices from Amazon

🤖 Building your agent: "web scraper that extracts product prices from Amazon"
   This takes ~90 seconds...

✅ Agent deployed to Antigravity! (1 built this session)
   Path: dist/agent-web-scraper-that-extracts-product.js
```

---

## 3. Using Templates

Browse 100+ pre-built templates:

```bash
# List all templates
node src/agent-templates/index.js list

# List by category
node src/agent-templates/index.js list research
node src/agent-templates/index.js list codegen
node src/agent-templates/index.js list deploy

# Search templates
node src/agent-templates/index.js search arxiv
node src/agent-templates/index.js search docker

# Get template code
node src/agent-templates/index.js get research-arxiv

# Run a template directly
node src/agent-templates/index.js research-arxiv "transformer models 2025"
```

### Popular Templates

| Template ID | What it does |
|-------------|-------------|
| `research-arxiv` | Fetches and summarizes arXiv papers |
| `codegen-api` | Generates a complete REST API |
| `deploy-antigravity` | Deploys to Antigravity workspace |
| `data-csv` | Analyzes CSV files |
| `web-scraper` | Scrapes websites for data |
| `api-github` | Manages GitHub repos |
| `ml-rag` | Builds RAG pipelines |
| `security-scan` | Scans code for vulnerabilities |

---

## 4. No-Code Chat Mode

The chat interface understands natural language:

```bash
npm run no-code
```

### Chat Commands

| What you type | What happens |
|---------------|-------------|
| `"research agent for climate papers"` | Builds and deploys a research agent |
| `list` | Shows all 100+ templates |
| `search arxiv` | Finds arxiv-related templates |
| `use research-arxiv` | Uses a specific template |
| `swarm "analyze 2025 AI trends"` | Launches 3 parallel agents |
| `help` | Shows all commands |
| `exit` | Quits |

### Example Session

```
You > research agent that monitors GitHub for new AI repos

🤖 Building your agent: "research agent that monitors GitHub for new AI repos"
   This takes ~90 seconds...

✅ Agent deployed to Antigravity! (1 built this session)
   Path: dist/agent-research-agent-that-monitors-github.js
💡 Want to scale this up? Type "swarm research agent that monitors GitHub for new AI repos"

You > swarm research agent that monitors GitHub for new AI repos

🌐 Launching swarm for: "research agent that monitors GitHub for new AI repos"

📋 Decomposed into 3 subtasks:
   1. Search and collect sources for: research agent...
   2. Analyze and synthesize findings for: research agent...
   3. Generate summary report for: research agent...

🚀 Launching 3 parallel agents...
  🤖 [Worker 1] Starting: Search and collect sources...
  🤖 [Worker 2] Starting: Analyze and synthesize findings...
  🤖 [Worker 3] Starting: Generate summary report...
  ✅ [Worker 1] Done in 1243ms
  ✅ [Worker 2] Done in 1891ms
  ✅ [Worker 3] Done in 2103ms

📊 Swarm Complete:
   ✅ Completed: 3/3
   ❌ Failed: 0/3
   ⏱  Duration: 2103ms
   Status: SUCCESS

✅ Swarm complete! 3/3 agents succeeded
   Duration: 2103ms
```

---

## 5. Swarm Orchestration

Run multiple agents in parallel for complex tasks:

```bash
# Basic swarm (3 agents)
npm run swarm "build a full-stack todo app with React and Node.js"

# Custom agent count
SWARM_AGENTS=5 npm run swarm "research and summarize 2025 AI papers"

# Programmatic
node -e "
const { orchestrate } = require('./src/swarm-orchestrator/index');
orchestrate('analyze competitor products', 4).then(console.log);
"
```

### How Swarms Work

1. **Decompose**: The task is broken into N subtasks
2. **Route**: Each subtask is matched to the best template
3. **Execute**: All agents run in parallel
4. **Aggregate**: Results are combined
5. **Deploy**: Summary deployed to Antigravity

### Swarm Strategies

| Task Type | Decomposition Strategy |
|-----------|----------------------|
| Research | Collect → Analyze → Summarize |
| Code | Design → Implement → Test → Document |
| Deploy | Validate → Build → Deploy → Verify |
| Data | Collect → Transform → Analyze → Visualize |

---

## 6. Connecting to Antigravity IDE

### Step 1: Start the MCP Bridge

```bash
npm run antigravity
```

Output:
```
🚀 Antigravity MCP Bridge live on http://localhost:3000
   Health: http://localhost:3000/health
   Tools:  http://localhost:3000/mcp/v1/tools

╔══════════════════════════════════════════════════════════════╗
║         📋 Antigravity MCP Config (paste into mcp.json)      ║
╚══════════════════════════════════════════════════════════════╝
{
  "mcpServers": {
    "ai-agent-academy": {
      "command": "node",
      "args": ["/path/to/src/antigravity-bridge/mcp-server.js"],
      "env": {
        "GEMINI_API_KEY": "${GEMINI_API_KEY}"
      }
    }
  }
}

→ Paste the above into Antigravity → Settings → MCP Servers
```

### Step 2: Configure Antigravity

1. Open Antigravity IDE
2. Go to **Settings → MCP Servers**
3. Paste the config printed above
4. Restart Antigravity

### Step 3: Use in Chat

Now in Antigravity chat:
```
You: Build me a research agent that summarizes arXiv papers on transformers

Antigravity: I'll use the AI Agent Academy to build that for you...
[Calls academy_build_agent tool]
✅ Agent built and deployed to your workspace!
```

---

## 7. Publishing to the Marketplace

Share your agents with the Antigravity community:

```bash
# Publish an agent
npm run marketplace:publish

# Or with arguments
node MARKETPLACE/publish.js dist/my-agent.js "My Research Agent" "Summarizes arXiv papers"

# List your published agents
node MARKETPLACE/publish.js list
```

### What Gets Published

```
my-research-agent-1.0.0.zip
├── agent.js          # Your agent code
├── manifest.json     # Metadata
└── README.md         # Auto-generated docs
```

### Marketplace Metadata

```json
{
  "name": "my-research-agent",
  "displayName": "My Research Agent",
  "version": "1.0.0",
  "description": "Summarizes arXiv papers",
  "tags": ["research", "arxiv", "papers"],
  "category": "research",
  "author": "your-username"
}
```

---

## 8. Building Custom Skills

Skills extend Antigravity IDE with new capabilities:

```bash
# Generate a skill scaffold
node src/agent-templates/index.js antigravity-skill

# Or describe it
node src/agent-builder.js "Antigravity skill that searches GitHub and summarizes READMEs"
```

### Skill Structure

```
ANTIGRAVITY/plugins/my-skill/
├── manifest.json    # Tool definitions
├── index.js         # Entry point
└── tools/           # Tool implementations
```

### Register with Antigravity

```bash
npm run antigravity
# → Prints MCP config
# → Paste into Antigravity Settings → MCP Servers
```

See `CORE/SKILL.md` for detailed skill development guide.

---

## 9. Docker Deployment

Run the full Academy stack with Docker:

```bash
# Start everything
docker compose -f docker-compose.academy.yml up

# Start specific services
docker compose -f docker-compose.academy.yml up academy ollama

# With Gemini API key
GEMINI_API_KEY=your_key docker compose -f docker-compose.academy.yml up

# Background mode
docker compose -f docker-compose.academy.yml up -d
```

### Services

| Service | Port | Purpose |
|---------|------|---------|
| `academy` | 3000 | Main academy + MCP bridge |
| `antigravity-bridge` | 3001 | Dedicated MCP server |
| `ollama` | 11434 | Local LLM (offline mode) |
| `gemini-proxy` | 3002 | Gemini/Ollama autodetect |
| `swarm-orchestrator` | — | Background swarm runner |

### ARM64 Support (Apple M1/M2)

The Docker config uses `platform: linux/arm64` for native M1/M2 performance. No Rosetta emulation needed.

---

## 10. Advanced: Custom Templates

Add your own templates to the registry:

### Step 1: Create Template File

```javascript
// src/agent-templates/my-template.js
module.exports = `#!/usr/bin/env node
// My Custom Agent Template
// Task: {{PROMPT}}

const task = process.argv[2] || '{{PROMPT}}';

async function run() {
  console.log('🤖 Running:', task);
  // Your custom logic here
  return { success: true, task };
}

run().then(console.log).catch(console.error);
`;
```

### Step 2: Register in Index

```javascript
// In src/agent-templates/index.js, add to TEMPLATES array:
{
  id: 'my-custom-template',
  name: 'My Custom Template',
  category: 'custom',
  description: 'Does something amazing',
  tags: ['custom', 'amazing']
}
```

### Step 3: Use It

```bash
node src/agent-templates/index.js my-custom-template "my task"
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` | — | Gemini 3 Pro API key |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `ANTIGRAVITY_HOST` | `http://localhost:3000` | Antigravity bridge URL |
| `ANTIGRAVITY_WORKSPACE` | `default` | Target workspace name |
| `ANTIGRAVITY_API_KEY` | — | Marketplace publish key |
| `SWARM_AGENTS` | `3` | Default swarm agent count |
| `SWARM_MAX_AGENTS` | `10` | Maximum swarm agents |
| `ANTIGRAVITY_STRICT_MODE` | `false` | Block non-allowlisted commands |
| `MCP_PORT` | `3000` | MCP bridge port |

---

## Troubleshooting

### "No model provider detected"
→ Set `GEMINI_API_KEY` or start Ollama: `ollama serve`

### "Antigravity bridge not reachable"
→ Run `npm run antigravity` in a separate terminal

### "Agent file not found"
→ Run `node src/agent-builder.js "your description"` first

### "Template not found"
→ Run `node src/agent-templates/index.js list` to see available templates

### Docker issues on M1/M2
→ The compose file uses `platform: linux/arm64` — ensure Docker Desktop is updated

---

## Next Steps

- 📖 Read `CORE/AGENTS.md` for agent architecture deep-dive
- 🔧 Read `CORE/SKILL.md` for building Antigravity skills
- 💡 Read `CORE/SOUL.md` for the project philosophy
- 🛒 Browse the marketplace: `node MARKETPLACE/publish.js list`
- 🤝 Contribute templates: add to `src/agent-templates/index.js`

---

*AI Agent Academy v4.0 — Making agentic AI accessible to everyone*
