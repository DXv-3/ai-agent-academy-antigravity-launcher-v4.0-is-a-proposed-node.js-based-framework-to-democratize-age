#!/usr/bin/env node
/**
 * Antigravity Bridge — Hooks
 * Simulates Antigravity policy approval for terminal commands and browser actions.
 * In production, these hooks integrate with Antigravity's permission system.
 */

'use strict';

// ─── Policy Rules ─────────────────────────────────────────────────────────────

const TERMINAL_BLOCKLIST = [
  /rm\s+-rf\s+\//,          // Dangerous: rm -rf /
  /sudo\s+rm/,              // Dangerous: sudo rm
  /mkfs/,                   // Dangerous: format disk
  /dd\s+if=.*of=\/dev/,     // Dangerous: disk write
  /curl.*\|\s*bash/,        // Dangerous: curl pipe bash (unless whitelisted)
  /wget.*\|\s*sh/,          // Dangerous: wget pipe sh
  /chmod\s+777\s+\//,       // Dangerous: chmod 777 root
];

const TERMINAL_ALLOWLIST = [
  /^npm\s+(run|install|i|ci|build|test|start)/,
  /^node\s+/,
  /^bun\s+/,
  /^git\s+(add|commit|push|pull|clone|status|log|diff)/,
  /^docker\s+(build|run|compose|ps|logs|stop)/,
  /^ls|^cat|^echo|^pwd|^mkdir|^cp|^mv/,
  /^curl\s+https?:\/\//,
];

const BROWSER_BLOCKLIST = [
  /file:\/\//,              // Local file access
  /chrome-extension:\/\//,  // Extension pages
  /about:blank/,
];

const BROWSER_ALLOWLIST = [
  /^https?:\/\//,           // Standard web URLs
  /localhost/,              // Local dev
  /127\.0\.0\.1/,
];

// ─── Terminal Hook ────────────────────────────────────────────────────────────

/**
 * Approve or deny a terminal command based on Antigravity policy
 * @param {string} cmd - The command to evaluate
 * @param {object} context - Optional context (user, workspace, etc.)
 * @returns {{ approved: boolean, reason: string, sanitized?: string }}
 */
function approveTerminalCommand(cmd, context = {}) {
  if (!cmd || typeof cmd !== 'string') {
    return { approved: false, reason: 'Invalid command' };
  }

  const trimmed = cmd.trim();

  // Check blocklist first
  for (const pattern of TERMINAL_BLOCKLIST) {
    if (pattern.test(trimmed)) {
      console.warn(`[Hooks] BLOCKED terminal command: ${trimmed}`);
      return {
        approved: false,
        reason: `Command blocked by Antigravity policy: matches pattern ${pattern}`,
        blocked: true,
      };
    }
  }

  // Check allowlist
  for (const pattern of TERMINAL_ALLOWLIST) {
    if (pattern.test(trimmed)) {
      console.log(`[Hooks] APPROVED terminal command: ${trimmed}`);
      return {
        approved: true,
        reason: 'Command matches Antigravity allowlist',
        sanitized: trimmed,
      };
    }
  }

  // Default: warn but allow (configurable)
  const defaultAllow = process.env.ANTIGRAVITY_STRICT_MODE !== 'true';
  console.warn(`[Hooks] ${defaultAllow ? 'ALLOWED (warn)' : 'BLOCKED (strict)'} terminal command: ${trimmed}`);

  return {
    approved: defaultAllow,
    reason: defaultAllow
      ? 'Command not in allowlist but allowed in non-strict mode'
      : 'Command not in allowlist and strict mode is enabled',
    warning: 'Command not explicitly whitelisted — review before executing',
  };
}

// ─── Browser Hook ─────────────────────────────────────────────────────────────

/**
 * Approve or deny a browser action based on Antigravity policy
 * @param {string} action - The browser action (navigate, click, fill, etc.)
 * @param {string} url - The target URL
 * @param {object} context - Optional context
 * @returns {{ approved: boolean, reason: string }}
 */
function approveBrowserAction(action, url, context = {}) {
  if (!action) {
    return { approved: false, reason: 'Invalid action' };
  }

  // URL-based checks
  if (url) {
    for (const pattern of BROWSER_BLOCKLIST) {
      if (pattern.test(url)) {
        return {
          approved: false,
          reason: `URL blocked by Antigravity policy: ${url}`,
          blocked: true,
        };
      }
    }

    const isAllowed = BROWSER_ALLOWLIST.some((p) => p.test(url));
    if (!isAllowed) {
      return {
        approved: false,
        reason: `URL not in allowlist: ${url}`,
      };
    }
  }

  // Action-based checks
  const sensitiveActions = ['fill', 'type', 'submit'];
  if (sensitiveActions.includes(action) && context.requiresConfirmation) {
    return {
      approved: false,
      reason: `Action '${action}' requires explicit user confirmation`,
      requiresConfirmation: true,
    };
  }

  console.log(`[Hooks] APPROVED browser action: ${action} → ${url || '(no url)'}`);
  return {
    approved: true,
    reason: 'Browser action approved by Antigravity policy',
    action,
    url,
  };
}

// ─── Agent Lifecycle Hooks ────────────────────────────────────────────────────

/**
 * Hook called before an agent starts
 */
function onAgentStart(agentId, config) {
  console.log(`[Hooks] Agent starting: ${agentId}`);
  return {
    proceed: true,
    agentId,
    startTime: new Date().toISOString(),
    config,
  };
}

/**
 * Hook called when an agent completes
 */
function onAgentComplete(agentId, result) {
  console.log(`[Hooks] Agent completed: ${agentId}`);
  return {
    agentId,
    endTime: new Date().toISOString(),
    result,
    status: 'completed',
  };
}

/**
 * Hook called when an agent errors
 */
function onAgentError(agentId, error) {
  console.error(`[Hooks] Agent error: ${agentId} — ${error.message}`);
  return {
    agentId,
    errorTime: new Date().toISOString(),
    error: error.message,
    status: 'error',
    retry: true,
  };
}

/**
 * Hook called before deploying to Antigravity
 */
function onBeforeDeploy(agentPath, workspace) {
  console.log(`[Hooks] Pre-deploy check: ${agentPath} → ${workspace}`);

  const fs = require('fs');
  if (!fs.existsSync(agentPath)) {
    return { proceed: false, reason: `Agent file not found: ${agentPath}` };
  }

  const stats = fs.statSync(agentPath);
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (stats.size > maxSize) {
    return { proceed: false, reason: `Agent file too large: ${stats.size} bytes (max ${maxSize})` };
  }

  return {
    proceed: true,
    agentPath,
    workspace,
    fileSize: stats.size,
    checkTime: new Date().toISOString(),
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  approveTerminalCommand,
  approveBrowserAction,
  onAgentStart,
  onAgentComplete,
  onAgentError,
  onBeforeDeploy,
};
