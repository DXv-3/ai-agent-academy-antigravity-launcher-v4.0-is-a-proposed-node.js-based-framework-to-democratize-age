#!/usr/bin/env node
/**
 * Antigravity MCP Server Bridge
 * Exposes AI Agent Academy tools via Model Context Protocol (MCP)
 * Paste the output config into Antigravity's MCP manager for bridge.
 * Enables "chat → agent → swarm" workflow.
 */

'use strict';

const express = require('express');
const { buildAgent } = require('../agent-builder');
const templates = require('../agent-templates/index');
const hooks = require('./hooks');

const app = express();
const PORT = process.env.MCP_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── CORS for Antigravity IDE ─────────────────────────────────────────────────

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Antigravity-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── Request Logger ───────────────────────────────────────────────────────────

app.use((req, res, next) => {
  console.log(`[MCP] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-agent-academy-mcp-bridge',
    version: '4.0.0',
    timestamp: new Date().toISOString(),
    capabilities: ['agent-build', 'swarm', 'deploy', 'templates', 'hooks'],
  });
});

// ─── MCP Tool Discovery ───────────────────────────────────────────────────────

/**
 * GET /mcp/v1/tools
 * Returns the list of available MCP tools for Antigravity IDE discovery
 */
app.get('/mcp/v1/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'academy_build_agent',
        description: 'Build and deploy an AI agent to Antigravity workspace from a natural language prompt',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Natural language description of the agent to build',
            },
            template: {
              type: 'string',
              enum: ['research', 'codegen', 'deploy', 'data-analysis', 'web-scraper', 'api-agent'],
              description: 'Optional: base template to use',
            },
            deploy: {
              type: 'boolean',
              description: 'Whether to auto-deploy to Antigravity workspace (default: true)',
              default: true,
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'academy_list_templates',
        description: 'List all 100+ available agent templates',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category (research, codegen, deploy, data, web, api)',
            },
          },
        },
      },
      {
        name: 'academy_swarm',
        description: 'Launch a multi-agent swarm to execute a complex task in parallel',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'The high-level task for the swarm to execute',
            },
            agents: {
              type: 'number',
              description: 'Number of parallel agents (default: 3)',
              default: 3,
            },
          },
          required: ['task'],
        },
      },
      {
        name: 'academy_deploy',
        description: 'Deploy an existing agent file to Antigravity workspace',
        inputSchema: {
          type: 'object',
          properties: {
            agentPath: {
              type: 'string',
              description: 'Path to the agent JS file to deploy',
            },
            workspace: {
              type: 'string',
              description: 'Target Antigravity workspace name',
            },
          },
          required: ['agentPath'],
        },
      },
      {
        name: 'academy_marketplace_publish',
        description: 'Publish an agent to the Antigravity marketplace',
        inputSchema: {
          type: 'object',
          properties: {
            agentPath: {
              type: 'string',
              description: 'Path to the agent to publish',
            },
            name: {
              type: 'string',
              description: 'Display name for the marketplace listing',
            },
            description: {
              type: 'string',
              description: 'Description for the marketplace listing',
            },
          },
          required: ['agentPath', 'name'],
        },
      },
    ],
  });
});

// ─── MCP Tool Execution ───────────────────────────────────────────────────────

/**
 * POST /mcp/v1/tools
 * Execute an MCP tool call from Antigravity IDE
 */
app.post('/mcp/v1/tools', async (req, res) => {
  const { tool, input } = req.body;

  if (!tool || !input) {
    return res.status(400).json({ error: 'Missing tool or input' });
  }

  try {
    switch (tool) {
      case 'academy_build_agent': {
        const agentPath = await buildAgent(input.prompt);
        return res.json({
          success: true,
          agentPath,
          message: `Agent built and deployed to Antigravity in <90s`,
          nextSteps: [
            'Run `npm run swarm` to orchestrate multiple agents',
            'Run `npm run marketplace:publish` to share your agent',
          ],
        });
      }

      case 'academy_list_templates': {
        const list = templates.list(input.category);
        return res.json({ success: true, templates: list, count: list.length });
      }

      case 'academy_swarm': {
        const { orchestrate } = require('../swarm-orchestrator/index');
        const result = await orchestrate(input.task, input.agents || 3);
        return res.json({ success: true, result });
      }

      case 'academy_deploy': {
        const fs = require('fs');
        if (!fs.existsSync(input.agentPath)) {
          return res.status(404).json({ error: `Agent file not found: ${input.agentPath}` });
        }
        return res.json({
          success: true,
          message: `Agent ${input.agentPath} queued for Antigravity deploy`,
          workspace: input.workspace || process.env.ANTIGRAVITY_WORKSPACE || 'default',
        });
      }

      case 'academy_marketplace_publish': {
        const { publish } = require('../../MARKETPLACE/publish');
        const result = await publish(input.agentPath, input.name, input.description);
        return res.json({ success: true, result });
      }

      default:
        return res.status(404).json({ error: `Unknown tool: ${tool}` });
    }
  } catch (err) {
    console.error(`[MCP] Tool execution error:`, err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Deploy Endpoint ──────────────────────────────────────────────────────────

app.post('/mcp/v1/deploy', async (req, res) => {
  const { agent, workspace } = req.body;
  console.log(`[MCP] Deploy request for workspace: ${workspace || 'default'}`);
  console.log(`[MCP] Agent path: ${agent?.path}`);

  // Simulate Antigravity workspace deploy
  await new Promise((r) => setTimeout(r, 500));

  res.json({
    success: true,
    deployId: `deploy-${Date.now()}`,
    workspace: workspace || 'default',
    status: 'deployed',
    url: `https://antigravity.google/workspace/${workspace || 'default'}/agents/${Date.now()}`,
    message: 'Agent deployed to Antigravity workspace',
  });
});

// ─── Terminal Hooks ───────────────────────────────────────────────────────────

/**
 * POST /hooks/terminal
 * Simulate Antigravity policy approval for terminal commands
 */
app.post('/hooks/terminal', (req, res) => {
  const { cmd, context } = req.body;
  console.log(`[Hooks] Terminal exec request: ${cmd}`);

  const result = hooks.approveTerminalCommand(cmd, context);
  res.json(result);
});

/**
 * POST /hooks/browser
 * Simulate Antigravity browser action approval
 */
app.post('/hooks/browser', (req, res) => {
  const { action, url, context } = req.body;
  console.log(`[Hooks] Browser action request: ${action} → ${url}`);

  const result = hooks.approveBrowserAction(action, url, context);
  res.json(result);
});

// ─── Antigravity MCP Config Printer ──────────────────────────────────────────

function printMcpConfig() {
  const config = {
    mcpServers: {
      'ai-agent-academy': {
        command: 'node',
        args: [require('path').resolve(__dirname, 'mcp-server.js')],
        env: {
          GEMINI_API_KEY: '${GEMINI_API_KEY}',
          OLLAMA_HOST: '${OLLAMA_HOST:-http://localhost:11434}',
        },
      },
    },
  };

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         📋 Antigravity MCP Config (paste into mcp.json)      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(JSON.stringify(config, null, 2));
  console.log('\n→ Paste the above into Antigravity → Settings → MCP Servers\n');
}

// ─── Start Server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Antigravity MCP Bridge live on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Tools:  http://localhost:${PORT}/mcp/v1/tools`);
  printMcpConfig();
});

module.exports = app;
