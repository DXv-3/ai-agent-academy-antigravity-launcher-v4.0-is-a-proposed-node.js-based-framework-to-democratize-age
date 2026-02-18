#!/usr/bin/env node
/**
 * AI Agent Academy — Swarm Orchestrator
 * Multi-agent Antigravity workflows with parallel execution
 * Routes tasks to 100+ templates via Gemini/Ollama autodetect
 */

'use strict';

const { EventEmitter } = require('events');
const templates = require('../agent-templates/index');
const hooks = require('../antigravity-bridge/hooks');

// ─── Swarm Configuration ──────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  maxAgents: parseInt(process.env.SWARM_MAX_AGENTS || '10'),
  timeout: parseInt(process.env.SWARM_TIMEOUT || '120000'), // 2 minutes
  retryAttempts: parseInt(process.env.SWARM_RETRY || '2'),
  antigravityHost: process.env.ANTIGRAVITY_HOST || 'http://localhost:3000',
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
};

// ─── Agent Worker ─────────────────────────────────────────────────────────────

class AgentWorker extends EventEmitter {
  constructor(id, task, template) {
    super();
    this.id = id;
    this.task = task;
    this.template = template;
    this.status = 'idle';
    this.startTime = null;
    this.endTime = null;
    this.result = null;
    this.error = null;
  }

  async run() {
    this.status = 'running';
    this.startTime = Date.now();

    const hookResult = hooks.onAgentStart(this.id, { task: this.task, template: this.template?.id });
    if (!hookResult.proceed) {
      this.status = 'blocked';
      this.error = hookResult.reason;
      this.emit('blocked', this);
      return;
    }

    console.log(`  🤖 [Worker ${this.id}] Starting: ${this.task.slice(0, 60)}...`);

    try {
      // Simulate agent execution (replace with real agent runner)
      await this._executeTask();

      this.status = 'completed';
      this.endTime = Date.now();
      this.result = {
        agentId: this.id,
        task: this.task,
        template: this.template?.id,
        duration: this.endTime - this.startTime,
        output: `Completed: ${this.task}`,
      };

      hooks.onAgentComplete(this.id, this.result);
      this.emit('complete', this);
      console.log(`  ✅ [Worker ${this.id}] Done in ${this.endTime - this.startTime}ms`);
    } catch (err) {
      this.status = 'error';
      this.endTime = Date.now();
      this.error = err.message;

      hooks.onAgentError(this.id, err);
      this.emit('error', this, err);
      console.error(`  ❌ [Worker ${this.id}] Error: ${err.message}`);
    }
  }

  async _executeTask() {
    // Simulate variable execution time based on task complexity
    const complexity = this.task.length / 10;
    const delay = Math.min(500 + complexity * 100, 3000);
    await new Promise((r) => setTimeout(r, delay));

    // Simulate occasional failures for retry testing
    if (Math.random() < 0.05) {
      throw new Error(`Simulated transient failure for agent ${this.id}`);
    }
  }
}

// ─── Task Decomposer ──────────────────────────────────────────────────────────

/**
 * Decompose a high-level task into subtasks for parallel execution
 */
function decomposeTasks(task, agentCount) {
  // Smart decomposition based on task keywords
  const taskLower = task.toLowerCase();

  const decompositions = {
    research: [
      `Search and collect sources for: ${task}`,
      `Analyze and synthesize findings for: ${task}`,
      `Generate summary report for: ${task}`,
    ],
    code: [
      `Design architecture for: ${task}`,
      `Implement core logic for: ${task}`,
      `Write tests for: ${task}`,
      `Generate documentation for: ${task}`,
    ],
    deploy: [
      `Validate configuration for: ${task}`,
      `Build artifacts for: ${task}`,
      `Deploy to staging for: ${task}`,
      `Run smoke tests for: ${task}`,
    ],
    data: [
      `Collect and validate data for: ${task}`,
      `Transform and clean data for: ${task}`,
      `Analyze patterns for: ${task}`,
      `Generate visualizations for: ${task}`,
    ],
    default: Array.from({ length: agentCount }, (_, i) => `Subtask ${i + 1} of ${agentCount}: ${task}`),
  };

  let subtasks;
  if (taskLower.includes('research') || taskLower.includes('arxiv') || taskLower.includes('paper')) {
    subtasks = decompositions.research;
  } else if (taskLower.includes('code') || taskLower.includes('build') || taskLower.includes('implement')) {
    subtasks = decompositions.code;
  } else if (taskLower.includes('deploy') || taskLower.includes('release') || taskLower.includes('publish')) {
    subtasks = decompositions.deploy;
  } else if (taskLower.includes('data') || taskLower.includes('analyze') || taskLower.includes('csv')) {
    subtasks = decompositions.data;
  } else {
    subtasks = decompositions.default;
  }

  // Trim to requested agent count
  return subtasks.slice(0, agentCount);
}

/**
 * Select the best template for a subtask
 */
function selectTemplate(subtask) {
  const taskLower = subtask.toLowerCase();

  if (taskLower.includes('arxiv') || taskLower.includes('paper') || taskLower.includes('research')) {
    return templates.get('research-arxiv');
  }
  if (taskLower.includes('code') || taskLower.includes('implement')) {
    return templates.get('codegen-api');
  }
  if (taskLower.includes('deploy') || taskLower.includes('release')) {
    return templates.get('deploy-antigravity');
  }
  if (taskLower.includes('data') || taskLower.includes('analyze')) {
    return templates.get('data-csv');
  }
  if (taskLower.includes('test')) {
    return templates.get('codegen-tests');
  }
  if (taskLower.includes('doc')) {
    return templates.get('codegen-docs');
  }

  // Default: research-web
  return templates.get('research-web');
}

// ─── Swarm Orchestrator ───────────────────────────────────────────────────────

class SwarmOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.workers = new Map();
    this.results = [];
    this.errors = [];
  }

  /**
   * Orchestrate a task across multiple parallel agents
   */
  async orchestrate(task, agentCount = 3) {
    const count = Math.min(agentCount, this.config.maxAgents);
    console.log(`\n🌐 Swarm Orchestrator starting`);
    console.log(`   Task: ${task}`);
    console.log(`   Agents: ${count}`);
    console.log(`   Max agents: ${this.config.maxAgents}`);

    // Decompose task into subtasks
    const subtasks = decomposeTasks(task, count);
    console.log(`\n📋 Decomposed into ${subtasks.length} subtasks:`);
    subtasks.forEach((st, i) => console.log(`   ${i + 1}. ${st.slice(0, 70)}...`));

    // Create workers
    const workers = subtasks.map((subtask, i) => {
      const template = selectTemplate(subtask);
      const worker = new AgentWorker(`agent-${i + 1}`, subtask, template);

      worker.on('complete', (w) => {
        this.results.push(w.result);
        this.emit('agentComplete', w);
      });

      worker.on('error', (w, err) => {
        this.errors.push({ agentId: w.id, error: err.message });
        this.emit('agentError', w, err);
      });

      return worker;
    });

    // Execute all workers in parallel
    console.log(`\n🚀 Launching ${workers.length} parallel agents...`);
    const startTime = Date.now();

    await Promise.allSettled(workers.map((w) => w.run()));

    const duration = Date.now() - startTime;
    const completed = workers.filter((w) => w.status === 'completed').length;
    const failed = workers.filter((w) => w.status === 'error').length;

    const summary = {
      task,
      agentCount: workers.length,
      completed,
      failed,
      duration,
      results: this.results,
      errors: this.errors,
      status: failed === 0 ? 'success' : completed > 0 ? 'partial' : 'failed',
    };

    console.log(`\n📊 Swarm Complete:`);
    console.log(`   ✅ Completed: ${completed}/${workers.length}`);
    console.log(`   ❌ Failed: ${failed}/${workers.length}`);
    console.log(`   ⏱  Duration: ${duration}ms`);
    console.log(`   Status: ${summary.status.toUpperCase()}`);

    // Deploy results to Antigravity
    await this._deployResults(summary);

    return summary;
  }

  async _deployResults(summary) {
    console.log(`\n📡 Deploying swarm results to Antigravity...`);
    try {
      const http = require('http');
      const body = JSON.stringify({
        type: 'swarm-results',
        summary,
        workspace: process.env.ANTIGRAVITY_WORKSPACE || 'default',
      });

      await new Promise((resolve, reject) => {
        const req = http.request(
          `${this.config.antigravityHost}/mcp/v1/deploy`,
          { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
          (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
              console.log(`   ✅ Results deployed to Antigravity`);
              resolve(data);
            });
          }
        );
        req.on('error', reject);
        req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
        req.write(body);
        req.end();
      });
    } catch (err) {
      console.log(`   ⚠️  Antigravity bridge not reachable — results saved locally`);
      // Save locally as fallback
      const fs = require('fs');
      const path = require('path');
      const outDir = path.join(__dirname, '..', '..', 'dist');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const outFile = path.join(outDir, `swarm-results-${Date.now()}.json`);
      fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
      console.log(`   💾 Results saved to: ${outFile}`);
    }
  }
}

// ─── Exported orchestrate function ───────────────────────────────────────────

async function orchestrate(task, agentCount = 3) {
  const swarm = new SwarmOrchestrator();
  return swarm.orchestrate(task, agentCount);
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────

if (require.main === module) {
  const task = process.argv.slice(2).join(' ') || 'default research task on AI agents';
  const agentCount = parseInt(process.env.SWARM_AGENTS || '3');

  orchestrate(task, agentCount)
    .then((result) => {
      console.log('\n🎉 Swarm orchestration complete!');
      process.exit(result.status === 'failed' ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal swarm error:', err.message);
      process.exit(1);
    });
}

module.exports = { orchestrate, SwarmOrchestrator, AgentWorker, decomposeTasks, selectTemplate };
