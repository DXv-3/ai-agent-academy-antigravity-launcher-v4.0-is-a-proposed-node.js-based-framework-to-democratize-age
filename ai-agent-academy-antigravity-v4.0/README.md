# 🚀 AI Agent Academy + Antigravity Launcher v4.0

> **Democratize agentic AI.** Build, deploy, and share AI agents in 90 seconds — no coding required.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Antigravity](https://img.shields.io/badge/Antigravity-v4.0-purple)](https://antigravity.google)
[![Templates](https://img.shields.io/badge/Templates-100%2B-orange)](src/agent-templates/index.js)

---

## What is this?

AI Agent Academy is a Node.js framework that makes building autonomous AI agents as easy as describing what you want. It integrates natively with **Google's Antigravity IDE** — the agent-first development platform powered by Gemini 3 models — enabling:

- 🤖 **No-code agent building**: Chat → Agent → Deployed in 90 seconds
- 🌐 **Swarm orchestration**: Run 100+ agents in parallel
- 🔌 **MCP server bridge**: Connect to Antigravity IDE via Model Context Protocol
- 🛒 **Marketplace**: Publish and share agents with the community
- 📦 **100+ templates**: arXiv research, code generation, deployment, data analysis, and more

---

## Quick Start

```bash
# Clone and install
git clone <this-repo> ai-agent-academy-antigravity-v4.0
cd ai-agent-academy-antigravity-v4.0
npm install

# Optional: set Gemini API key (or use Ollama for offline mode)
export GEMINI_API_KEY=your_key_here

# Build your first agent
node src/agent-builder.js "research agent that summarizes arXiv papers"

# Start the Antigravity MCP bridge
npm run antigravity
```

**Or use Docker:**

```bash
GEMINI_API_KEY=your_key docker compose -f docker-compose.academy.yml up
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run academy` | Start the agent builder |
| `npm run antigravity` | Start the Antigravity MCP bridge |
| `npm run "build research agent"` | Build a research agent from template |
| `npm run swarm` | Launch multi-agent swarm orchestrator |
| `npm run no-code` | Interactive no-code chat mode |
| `npm run marketplace:publish` | Publish agent to marketplace |
| `npm run teach` | View tutorials |

---

## No-Code Mode

Zero coding required. Just describe what you want:

```bash
npm run no-code
```

```
You > research agent that monitors GitHub for new AI repos

🤖 Building your agent...
✅ Agent deployed to Antigravity in <90s!
```

---

## Swarm Orchestration

Run multiple agents in parallel:

```bash
npm run swarm "analyze 2025 AI research trends"
```

```
🌐 Swarm Orchestrator starting
   Task: analyze 2025 AI research trends
   Agents: 3

📋 Decomposed into 3 subtasks:
   1. Search and collect sources...
   2. Analyze and synthesize findings...
   3. Generate summary report...

🚀 Launching 3 parallel agents...
  ✅ [Worker 1] Done in 1243ms
  ✅ [Worker 2] Done in 1891ms
  ✅ [Worker 3] Done in 2103ms

📊 Swarm Complete: 3/3 ✅ | Duration: 2103ms
```

---

## Antigravity MCP Integration

Connect to Antigravity IDE in 3 steps:

**1. Start the bridge:**
```bash
npm run antigravity
```

**2. Copy the printed MCP config:**
```json
{
  "mcpServers": {
    "ai-agent-academy": {
      "command": "node",
      "args": ["src/antigravity-bridge/mcp-server.js"]
    }
  }
}
```

**3. Paste into Antigravity → Settings → MCP Servers**

Now Antigravity can build and deploy agents via chat! 🎉

---

## 100+ Agent Templates

```bash
# List all templates
node src/agent-templates/index.js list

# Search templates
node src/agent-templates/index.js search arxiv

# Use a template
node src/agent-templates/index.js research-arxiv "transformer models 2025"
```

### Template Categories

| Category | Count | Examples |
|----------|-------|---------|
| 🔬 Research | 8 | arXiv, web, competitor, patent, news |
| 💻 Code Generation | 10 | REST API, React, tests, docs, SQL |
| 🚀 Deployment | 7 | Docker, K8s, Vercel, GCP, Antigravity |
| 📊 Data Analysis | 7 | CSV, ETL, ML prep, reports, viz |
| 🌐 Web | 6 | Scraper, monitor, SEO, a11y |
| 🔗 API Integration | 10 | GitHub, Slack, Notion, Stripe, Gemini |
| ⚙️ Automation | 8 | Files, email, git, backup, CI/CD |
| 🧠 Machine Learning | 8 | Classify, RAG, embeddings, finetune |
| ✍️ Content | 6 | Blog, social, video, email copy |
| 🔒 Security | 4 | Scan, deps, secrets, pentest |
| 🛠️ DevOps | 4 | IaC, logs, cost, incidents |
| 🪐 Antigravity Native | 5 | Workspace, skills, swarm, MCP |

---

## Project Structure

```
ai-agent-academy-antigravity-v4.0/
├── package.json                    # Dependencies and scripts
├── docker-compose.academy.yml      # Full Docker stack
├── src/
│   ├── agent-builder.js            # Core: prompt → agent → deploy
│   ├── antigravity-bridge/
│   │   ├── mcp-server.js           # MCP server for Antigravity IDE
│   │   └── hooks.js                # Policy approval hooks
│   ├── agent-templates/
│   │   └── index.js                # 100+ template registry
│   └── swarm-orchestrator/
│       └── index.js                # Multi-agent parallel execution
├── CORE/
│   ├── SOUL.md                     # Project philosophy
│   ├── AGENTS.md                   # Agent architecture guide
│   └── SKILL.md                    # Antigravity skill building guide
├── NO-CODE/
│   └── chat-to-agent.js            # Interactive no-code chat interface
├── ANTIGRAVITY/
│   └── plugins/                    # Antigravity skill plugins
├── MARKETPLACE/
│   └── publish.js                  # Marketplace publisher
├── TEACH/
│   └── tutorials.md                # Step-by-step tutorials
└── dist/                           # Generated agents (auto-created)
```

---

## Model Support

| Provider | Model | Setup |
|----------|-------|-------|
| **Gemini** | gemini-3-pro | Set `GEMINI_API_KEY` |
| **Gemini** | gemini-3-flash | Set `GEMINI_API_KEY` |
| **Ollama** | llama3, mistral | Run `ollama serve` |
| **Template** | none | No setup needed (fallback) |

Autodetects the best available model. Falls back gracefully.

---

## Environment Variables

```bash
GEMINI_API_KEY=...              # Gemini 3 Pro API key
OLLAMA_HOST=http://localhost:11434  # Ollama server
ANTIGRAVITY_HOST=http://localhost:3000  # MCP bridge
ANTIGRAVITY_WORKSPACE=default   # Target workspace
ANTIGRAVITY_API_KEY=...         # Marketplace publish key
SWARM_AGENTS=3                  # Default swarm size
ANTIGRAVITY_STRICT_MODE=false   # Block non-allowlisted commands
```

---

## Docker Stack

```bash
# Full stack (Ollama + Gemini proxy + Academy + Swarm)
docker compose -f docker-compose.academy.yml up

# ARM64 native (Apple M1/M2/M3)
# Already configured with platform: linux/arm64
```

Services:
- **academy** (`:3000`) — Main agent builder + MCP bridge
- **antigravity-bridge** (`:3001`) — Dedicated MCP server
- **ollama** (`:11434`) — Local LLM for offline mode
- **gemini-proxy** (`:3002`) — Model autodetect proxy
- **swarm-orchestrator** — Background swarm runner

---

## Safety & Policy

All agent actions pass through policy hooks:

```javascript
// Terminal commands are checked against allowlist
hooks.approveTerminalCommand('npm run build')  // ✅ Approved
hooks.approveTerminalCommand('rm -rf /')       // ❌ Blocked

// Browser actions are URL-validated
hooks.approveBrowserAction('navigate', 'https://arxiv.org')  // ✅ Approved
hooks.approveBrowserAction('navigate', 'file:///etc/passwd') // ❌ Blocked
```

---

## Publishing to Marketplace

```bash
# Publish your agent
node MARKETPLACE/publish.js dist/my-agent.js "My Agent Name" "Description"

# List published agents
node MARKETPLACE/publish.js list
```

---

## Contributing

1. Fork this repo
2. Add your template to `src/agent-templates/index.js`
3. Test: `node src/agent-templates/index.js your-template-id`
4. Submit a PR

---

## Tutorials

```bash
npm run teach
```

Or read `TEACH/tutorials.md` for:
- Quick start guide
- No-code chat walkthrough
- Swarm orchestration examples
- Antigravity IDE integration
- Marketplace publishing
- Building custom skills
- Docker deployment

---

## Architecture

```
User Input (chat/CLI)
       │
       ▼
┌─────────────────┐
│  agent-builder  │ ← Detects model (Gemini/Ollama)
│  (no-code mode) │ ← Generates agent code
└────────┬────────┘ ← Writes to dist/
         │
         ▼
┌─────────────────┐
│  MCP Bridge     │ ← Exposes tools to Antigravity IDE
│  (mcp-server)   │ ← Handles deploy requests
└────────┬────────┘ ← Runs policy hooks
         │
         ▼
┌─────────────────┐
│  Antigravity    │ ← Workspace deployment
│  Workspace      │ ← Agent execution
└─────────────────┘
```

---

## License

MIT — Use freely, build boldly, share generously.

---

*AI Agent Academy v4.0 — Built for the agentic future* 🚀
