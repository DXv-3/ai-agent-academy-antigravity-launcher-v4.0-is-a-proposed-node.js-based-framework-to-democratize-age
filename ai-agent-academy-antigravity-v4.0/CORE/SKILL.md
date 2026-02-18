# SKILL.md — Building Antigravity Skills

## What is a Skill?

In Antigravity IDE, a **Skill** is a packaged capability that extends what the AI assistant can do. Skills are the building blocks of the Antigravity ecosystem — they're how you teach Antigravity new tricks.

AI Agent Academy makes building skills as easy as describing what you want.

---

## Skill vs Agent

| | Agent | Skill |
|---|---|---|
| **Runs** | Standalone process | Inside Antigravity IDE |
| **Triggered by** | CLI, API, schedule | User chat, IDE command |
| **Output** | Files, API calls, reports | IDE actions, responses |
| **Lifecycle** | Start → Execute → End | Always-on, reactive |
| **Packaging** | `.js` file | Antigravity plugin |

---

## Skill Structure

```
ANTIGRAVITY/plugins/my-skill/
├── manifest.json      # Skill metadata and capabilities
├── index.js           # Skill entry point
├── tools/             # Individual tool implementations
│   ├── search.js
│   ├── analyze.js
│   └── deploy.js
└── README.md          # Usage documentation
```

### manifest.json

```json
{
  "name": "my-research-skill",
  "displayName": "Research Assistant",
  "version": "1.0.0",
  "description": "Searches arXiv and summarizes papers",
  "author": "Your Name",
  "antigravityVersion": ">=4.0.0",
  "capabilities": ["terminal", "browser", "files"],
  "tools": [
    {
      "name": "search_papers",
      "description": "Search arXiv for papers on a topic",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" },
          "maxResults": { "type": "number", "default": 10 }
        },
        "required": ["query"]
      }
    },
    {
      "name": "summarize_paper",
      "description": "Summarize a specific arXiv paper",
      "inputSchema": {
        "type": "object",
        "properties": {
          "arxivId": { "type": "string" }
        },
        "required": ["arxivId"]
      }
    }
  ]
}
```

### index.js

```javascript
'use strict';

const tools = {
  search_papers: require('./tools/search'),
  summarize_paper: require('./tools/analyze'),
};

// Antigravity calls this when a tool is invoked
async function handleToolCall(toolName, input) {
  const tool = tools[toolName];
  if (!tool) throw new Error(`Unknown tool: ${toolName}`);
  return tool(input);
}

module.exports = { handleToolCall };
```

---

## Building a Skill with Academy

### Method 1: No-Code (Recommended)

```bash
npm run no-code
# > "build a skill that searches GitHub repos and summarizes READMEs"
# → Skill generated and placed in ANTIGRAVITY/plugins/
```

### Method 2: Template

```bash
node src/agent-templates/index.js antigravity-skill
# → Generates skill scaffold in ANTIGRAVITY/plugins/
```

### Method 3: Manual

1. Create `ANTIGRAVITY/plugins/my-skill/`
2. Add `manifest.json` with tool definitions
3. Implement tools in `index.js`
4. Register with MCP bridge:

```bash
npm run antigravity
# → Prints MCP config to paste into Antigravity
```

---

## Skill Capabilities

Skills can request these capabilities in `manifest.json`:

| Capability | What it enables | Policy |
|------------|----------------|--------|
| `terminal` | Run shell commands | Allowlist enforced |
| `browser` | Navigate web pages | URL allowlist enforced |
| `files` | Read/write files | Workspace-scoped |
| `network` | Make HTTP requests | HTTPS only by default |
| `docker` | Manage containers | Requires explicit approval |
| `deploy` | Deploy to Antigravity | Workspace-scoped |

---

## Skill Patterns

### Pattern 1: Research Skill

```javascript
// tools/search.js
const https = require('https');

async function searchArxiv(query, maxResults = 10) {
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&max_results=${maxResults}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(parseArxivXML(data)));
    }).on('error', reject);
  });
}

function parseArxivXML(xml) {
  // Extract titles and abstracts
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entries.map(entry => ({
    title: entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim(),
    abstract: entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim(),
    id: entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim(),
  }));
}

module.exports = searchArxiv;
```

### Pattern 2: Code Generation Skill

```javascript
// tools/codegen.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateCode(description, language = 'javascript') {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `Generate ${language} code for: ${description}
Return ONLY the code, no markdown fences.`;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = generateCode;
```

### Pattern 3: Deploy Skill

```javascript
// tools/deploy.js
const { execSync } = require('child_process');
const hooks = require('../../../src/antigravity-bridge/hooks');

async function deployToAntigravity(agentPath, workspace) {
  // Pre-deploy hook
  const check = hooks.onBeforeDeploy(agentPath, workspace);
  if (!check.proceed) throw new Error(check.reason);
  
  // Terminal hook
  const cmd = `node ${agentPath}`;
  const approval = hooks.approveTerminalCommand(cmd);
  if (!approval.approved) throw new Error(approval.reason);
  
  execSync(cmd, { stdio: 'inherit' });
  return { deployed: true, path: agentPath, workspace };
}

module.exports = deployToAntigravity;
```

---

## Publishing a Skill

```bash
# Publish to Antigravity marketplace
npm run marketplace:publish ANTIGRAVITY/plugins/my-skill "My Research Skill" "Searches and summarizes papers"

# Or programmatically:
const { publish } = require('./MARKETPLACE/publish');
await publish('./ANTIGRAVITY/plugins/my-skill', 'My Research Skill', 'Description');
```

---

## Skill Development Workflow

```
1. Describe → npm run no-code → "build a skill that..."
2. Review  → Check ANTIGRAVITY/plugins/my-skill/
3. Test    → node ANTIGRAVITY/plugins/my-skill/index.js
4. Connect → npm run antigravity → paste MCP config
5. Use     → Chat with Antigravity: "search for AI papers"
6. Publish → npm run marketplace:publish
```

---

## Best Practices

### ✅ Do
- Keep tools focused (one tool = one capability)
- Return structured JSON from all tools
- Handle errors gracefully with descriptive messages
- Use environment variables for API keys
- Test with both Gemini and Ollama

### ❌ Don't
- Hardcode API keys
- Make tools that do too many things
- Skip the policy hooks for terminal/browser actions
- Publish skills with sensitive data in the code

---

## Skill Registry

The Academy maintains a registry of community skills in `ANTIGRAVITY/plugins/`:

| Skill | Description | Status |
|-------|-------------|--------|
| `research-arxiv` | arXiv paper search and summary | ✅ Built-in |
| `code-review` | AI-powered code review | ✅ Built-in |
| `deploy-gcp` | Deploy to Google Cloud Run | ✅ Built-in |
| `data-analyze` | CSV/JSON data analysis | ✅ Built-in |
| `web-scrape` | Structured web scraping | ✅ Built-in |

*Add your skill to this registry via a pull request!*

---

*See `ANTIGRAVITY/plugins/` for example skill implementations*
