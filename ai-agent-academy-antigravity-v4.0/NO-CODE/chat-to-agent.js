#!/usr/bin/env node
/**
 * AI Agent Academy — No-Code Chat-to-Agent
 * Zero-knowledge users: type a description → get a deployed Antigravity agent in 90s
 * Supports interactive chat mode and single-shot CLI mode
 */

'use strict';

const readline = require('readline');
const { buildAgent, detectModel } = require('../src/agent-builder');
const { orchestrate } = require('../src/swarm-orchestrator/index');
const templates = require('../src/agent-templates/index');

// ─── Chat Interface ───────────────────────────────────────────────────────────

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// ─── Intent Detection ─────────────────────────────────────────────────────────

function detectIntent(input) {
  const lower = input.toLowerCase().trim();

  if (['help', '?', 'h'].includes(lower)) return 'help';
  if (['list', 'templates', 'ls'].includes(lower)) return 'list-templates';
  if (['exit', 'quit', 'q', 'bye'].includes(lower)) return 'exit';
  if (lower.startsWith('search ')) return 'search';
  if (lower.startsWith('swarm ')) return 'swarm';
  if (lower.startsWith('use ')) return 'use-template';
  if (lower.startsWith('deploy ')) return 'deploy';
  if (lower.length > 5) return 'build-agent';

  return 'unknown';
}

// ─── Response Handlers ────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🤖 AI Agent Academy — No-Code Chat Mode            ║
╠══════════════════════════════════════════════════════════════╣
║  Just describe what you want and I'll build it!              ║
║                                                              ║
║  Examples:                                                   ║
║  > "research agent that summarizes arXiv papers"             ║
║  > "web scraper for product prices"                          ║
║  > "deploy my app to Google Cloud Run"                       ║
║                                                              ║
║  Commands:                                                   ║
║  list              → Show all 100+ templates                 ║
║  search <query>    → Search templates                        ║
║  use <template-id> → Use a specific template                 ║
║  swarm <task>      → Launch multi-agent swarm                ║
║  help              → Show this help                          ║
║  exit              → Quit                                    ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function showTemplates(category) {
  const list = templates.list(category);
  const cats = templates.categories();

  console.log(`\n📦 Available Templates (${list.length} total):`);
  console.log(`   Categories: ${cats.join(', ')}\n`);

  const grouped = {};
  list.forEach((t) => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });

  Object.entries(grouped).forEach(([cat, items]) => {
    console.log(`  📁 ${cat.toUpperCase()} (${items.length})`);
    items.slice(0, 5).forEach((t) => console.log(`     [${t.id}] ${t.name}`));
    if (items.length > 5) console.log(`     ... and ${items.length - 5} more`);
  });

  console.log(`\n  💡 Tip: Type "search <keyword>" to find specific templates`);
}

// ─── Conversation State ───────────────────────────────────────────────────────

const state = {
  sessionId: `session-${Date.now()}`,
  agentsBuilt: 0,
  history: [],
  modelInfo: null,
};

// ─── Main Chat Loop ───────────────────────────────────────────────────────────

async function chat() {
  console.clear();
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║        🚀 AI Agent Academy + Antigravity Launcher v4.0       ║
║                    No-Code Chat Mode                         ║
╚══════════════════════════════════════════════════════════════╝
`);

  // Detect model on startup
  process.stdout.write('🔍 Detecting AI model... ');
  state.modelInfo = await detectModel();
  console.log(`${state.modelInfo.provider}/${state.modelInfo.model} ✅`);

  console.log(`\n💬 Describe the agent you want to build, or type "help" for commands.\n`);

  while (true) {
    const input = await ask('You > ');
    const trimmed = input.trim();

    if (!trimmed) continue;

    state.history.push({ role: 'user', content: trimmed, time: new Date().toISOString() });

    const intent = detectIntent(trimmed);

    try {
      switch (intent) {
        case 'help':
          showHelp();
          break;

        case 'list-templates':
          showTemplates();
          break;

        case 'search': {
          const query = trimmed.slice(7).trim();
          const results = templates.search(query);
          console.log(`\n🔍 Found ${results.length} templates for "${query}":`);
          results.forEach((t) => console.log(`  [${t.id}] ${t.name} — ${t.description}`));
          if (results.length === 0) console.log('  No templates found. Try a different keyword.');
          console.log();
          break;
        }

        case 'use-template': {
          const templateId = trimmed.slice(4).trim();
          const template = templates.get(templateId);
          if (!template) {
            console.log(`\n❌ Template not found: ${templateId}`);
            console.log('   Type "list" to see all templates\n');
          } else {
            console.log(`\n🤖 Building agent from template: ${template.name}`);
            const agentPath = await buildAgent(template.description);
            state.agentsBuilt++;
            console.log(`\n✅ Agent ready! (${state.agentsBuilt} built this session)`);
            console.log(`   Path: ${agentPath}`);
            console.log(`   💡 Want to launch a swarm? Type "swarm ${template.description}"\n`);
          }
          break;
        }

        case 'swarm': {
          const task = trimmed.slice(6).trim();
          console.log(`\n🌐 Launching swarm for: "${task}"`);
          const agentCount = parseInt(process.env.SWARM_AGENTS || '3');
          const result = await orchestrate(task, agentCount);
          console.log(`\n✅ Swarm complete! ${result.completed}/${result.agentCount} agents succeeded`);
          console.log(`   Duration: ${result.duration}ms\n`);
          break;
        }

        case 'deploy': {
          const target = trimmed.slice(7).trim();
          console.log(`\n📡 Deploying to Antigravity: ${target}`);
          const agentPath = await buildAgent(`deploy agent for: ${target}`);
          state.agentsBuilt++;
          console.log(`\n✅ Deployed! Agent at: ${agentPath}\n`);
          break;
        }

        case 'build-agent': {
          console.log(`\n🤖 Building your agent: "${trimmed}"`);
          console.log('   This takes ~90 seconds...\n');

          const agentPath = await buildAgent(trimmed);
          state.agentsBuilt++;

          console.log(`\n✅ Agent deployed to Antigravity! (${state.agentsBuilt} built this session)`);
          console.log(`   Path: ${agentPath}`);

          // Suggest next steps
          const suggestions = [
            '💡 Want to scale this up? Type "swarm ' + trimmed.slice(0, 30) + '"',
            '💡 Want to publish to marketplace? Run: npm run marketplace:publish',
            '💡 Want to see all templates? Type "list"',
          ];
          console.log(`\n${suggestions[state.agentsBuilt % suggestions.length]}\n`);
          break;
        }

        case 'exit':
          console.log(`\n👋 Thanks for using AI Agent Academy! Built ${state.agentsBuilt} agents this session.\n`);
          rl.close();
          process.exit(0);

        default:
          console.log(`\n🤔 I didn't understand that. Type "help" for available commands.\n`);
      }
    } catch (err) {
      console.error(`\n❌ Error: ${err.message}\n`);
    }
  }
}

// ─── Single-shot CLI Mode ─────────────────────────────────────────────────────

async function singleShot(prompt) {
  console.log(`🚀 No-code agent build: "${prompt}"`);
  const agentPath = await buildAgent(prompt);
  console.log(`✅ Done! Agent at: ${agentPath}`);
  process.exit(0);
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

const prompt = process.argv.slice(2).join(' ');

if (prompt) {
  // Single-shot mode: node NO-CODE/chat-to-agent.js "my agent description"
  singleShot(prompt).catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
} else {
  // Interactive chat mode
  chat().catch((err) => {
    console.error('Fatal:', err.message);
    rl.close();
    process.exit(1);
  });
}
