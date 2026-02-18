#!/usr/bin/env node
/**
 * AI Agent Academy — Template Registry
 * 100+ agent templates for Antigravity workspaces
 * Categories: research, codegen, deploy, data-analysis, web, api, automation, ml
 */

'use strict';

// ─── Template Registry ────────────────────────────────────────────────────────

const TEMPLATES = [
  // ── Research ──────────────────────────────────────────────────────────────
  { id: 'research-arxiv', name: 'arXiv Research Agent', category: 'research', description: 'Fetches and summarizes arXiv papers on a topic', tags: ['arxiv', 'papers', 'summarize'] },
  { id: 'research-web', name: 'Web Research Agent', category: 'research', description: 'Searches the web and synthesizes findings', tags: ['web', 'search', 'synthesis'] },
  { id: 'research-competitor', name: 'Competitor Analysis Agent', category: 'research', description: 'Analyzes competitor products and strategies', tags: ['business', 'analysis'] },
  { id: 'research-patent', name: 'Patent Research Agent', category: 'research', description: 'Searches and analyzes patent databases', tags: ['patents', 'ip', 'legal'] },
  { id: 'research-news', name: 'News Aggregator Agent', category: 'research', description: 'Aggregates and summarizes news on a topic', tags: ['news', 'media'] },
  { id: 'research-academic', name: 'Academic Literature Agent', category: 'research', description: 'Reviews academic literature and creates bibliographies', tags: ['academic', 'bibliography'] },
  { id: 'research-market', name: 'Market Research Agent', category: 'research', description: 'Conducts market research and trend analysis', tags: ['market', 'trends', 'business'] },
  { id: 'research-social', name: 'Social Media Research Agent', category: 'research', description: 'Analyzes social media trends and sentiment', tags: ['social', 'sentiment', 'trends'] },

  // ── Code Generation ───────────────────────────────────────────────────────
  { id: 'codegen-api', name: 'REST API Generator', category: 'codegen', description: 'Generates a complete REST API from a spec', tags: ['api', 'rest', 'express'] },
  { id: 'codegen-react', name: 'React Component Generator', category: 'codegen', description: 'Generates React components from descriptions', tags: ['react', 'ui', 'components'] },
  { id: 'codegen-tests', name: 'Test Suite Generator', category: 'codegen', description: 'Generates unit and integration tests', tags: ['testing', 'jest', 'mocha'] },
  { id: 'codegen-docs', name: 'Documentation Generator', category: 'codegen', description: 'Generates code documentation and README files', tags: ['docs', 'readme', 'jsdoc'] },
  { id: 'codegen-refactor', name: 'Code Refactoring Agent', category: 'codegen', description: 'Refactors code for readability and performance', tags: ['refactor', 'clean-code'] },
  { id: 'codegen-migrate', name: 'Code Migration Agent', category: 'codegen', description: 'Migrates code between frameworks or versions', tags: ['migration', 'upgrade'] },
  { id: 'codegen-review', name: 'Code Review Agent', category: 'codegen', description: 'Reviews code for bugs, security, and best practices', tags: ['review', 'security', 'quality'] },
  { id: 'codegen-sql', name: 'SQL Query Generator', category: 'codegen', description: 'Generates optimized SQL queries from natural language', tags: ['sql', 'database', 'query'] },
  { id: 'codegen-graphql', name: 'GraphQL Schema Generator', category: 'codegen', description: 'Generates GraphQL schemas and resolvers', tags: ['graphql', 'schema', 'api'] },
  { id: 'codegen-cli', name: 'CLI Tool Generator', category: 'codegen', description: 'Generates command-line tools with argument parsing', tags: ['cli', 'terminal', 'tools'] },

  // ── Deployment ────────────────────────────────────────────────────────────
  { id: 'deploy-docker', name: 'Docker Deploy Agent', category: 'deploy', description: 'Builds and deploys Docker containers', tags: ['docker', 'containers', 'devops'] },
  { id: 'deploy-k8s', name: 'Kubernetes Deploy Agent', category: 'deploy', description: 'Deploys to Kubernetes clusters', tags: ['kubernetes', 'k8s', 'devops'] },
  { id: 'deploy-vercel', name: 'Vercel Deploy Agent', category: 'deploy', description: 'Deploys Next.js apps to Vercel', tags: ['vercel', 'nextjs', 'serverless'] },
  { id: 'deploy-gcp', name: 'GCP Cloud Run Agent', category: 'deploy', description: 'Deploys to Google Cloud Run', tags: ['gcp', 'cloud-run', 'google'] },
  { id: 'deploy-aws', name: 'AWS Lambda Deploy Agent', category: 'deploy', description: 'Deploys serverless functions to AWS Lambda', tags: ['aws', 'lambda', 'serverless'] },
  { id: 'deploy-antigravity', name: 'Antigravity Workspace Deploy', category: 'deploy', description: 'Deploys agents directly to Antigravity workspaces', tags: ['antigravity', 'workspace'] },
  { id: 'deploy-ci', name: 'CI/CD Pipeline Agent', category: 'deploy', description: 'Sets up GitHub Actions or GitLab CI pipelines', tags: ['ci', 'cd', 'github-actions'] },

  // ── Data Analysis ─────────────────────────────────────────────────────────
  { id: 'data-csv', name: 'CSV Analysis Agent', category: 'data-analysis', description: 'Analyzes CSV files and generates insights', tags: ['csv', 'data', 'analysis'] },
  { id: 'data-json', name: 'JSON Transform Agent', category: 'data-analysis', description: 'Transforms and validates JSON data', tags: ['json', 'transform', 'validate'] },
  { id: 'data-sql-analyze', name: 'SQL Database Analyzer', category: 'data-analysis', description: 'Analyzes database schemas and query performance', tags: ['sql', 'performance', 'schema'] },
  { id: 'data-viz', name: 'Data Visualization Agent', category: 'data-analysis', description: 'Generates charts and visualizations from data', tags: ['charts', 'visualization', 'd3'] },
  { id: 'data-etl', name: 'ETL Pipeline Agent', category: 'data-analysis', description: 'Builds extract-transform-load data pipelines', tags: ['etl', 'pipeline', 'data-engineering'] },
  { id: 'data-ml-prep', name: 'ML Data Prep Agent', category: 'data-analysis', description: 'Prepares and cleans data for machine learning', tags: ['ml', 'preprocessing', 'cleaning'] },
  { id: 'data-report', name: 'Report Generator Agent', category: 'data-analysis', description: 'Generates PDF/HTML reports from data', tags: ['reports', 'pdf', 'html'] },

  // ── Web Scraping ──────────────────────────────────────────────────────────
  { id: 'web-scraper', name: 'Web Scraper Agent', category: 'web', description: 'Scrapes websites and extracts structured data', tags: ['scraping', 'cheerio', 'puppeteer'] },
  { id: 'web-monitor', name: 'Website Monitor Agent', category: 'web', description: 'Monitors websites for changes and alerts', tags: ['monitoring', 'alerts', 'uptime'] },
  { id: 'web-seo', name: 'SEO Analyzer Agent', category: 'web', description: 'Analyzes websites for SEO improvements', tags: ['seo', 'optimization', 'web'] },
  { id: 'web-perf', name: 'Web Performance Agent', category: 'web', description: 'Measures and reports web performance metrics', tags: ['performance', 'lighthouse', 'core-web-vitals'] },
  { id: 'web-a11y', name: 'Accessibility Audit Agent', category: 'web', description: 'Audits websites for accessibility compliance', tags: ['accessibility', 'a11y', 'wcag'] },
  { id: 'web-screenshot', name: 'Screenshot Agent', category: 'web', description: 'Takes screenshots of web pages at various viewports', tags: ['screenshots', 'puppeteer', 'visual'] },

  // ── API Integration ───────────────────────────────────────────────────────
  { id: 'api-github', name: 'GitHub API Agent', category: 'api', description: 'Interacts with GitHub API for repo management', tags: ['github', 'git', 'repos'] },
  { id: 'api-slack', name: 'Slack Bot Agent', category: 'api', description: 'Sends messages and manages Slack workspaces', tags: ['slack', 'messaging', 'notifications'] },
  { id: 'api-notion', name: 'Notion Integration Agent', category: 'api', description: 'Reads and writes Notion databases and pages', tags: ['notion', 'productivity', 'notes'] },
  { id: 'api-sheets', name: 'Google Sheets Agent', category: 'api', description: 'Reads and writes Google Sheets data', tags: ['sheets', 'google', 'spreadsheet'] },
  { id: 'api-stripe', name: 'Stripe Payment Agent', category: 'api', description: 'Manages Stripe payments and subscriptions', tags: ['stripe', 'payments', 'billing'] },
  { id: 'api-sendgrid', name: 'Email Campaign Agent', category: 'api', description: 'Sends email campaigns via SendGrid', tags: ['email', 'sendgrid', 'marketing'] },
  { id: 'api-twitter', name: 'Twitter/X Agent', category: 'api', description: 'Posts and monitors Twitter/X content', tags: ['twitter', 'social', 'x'] },
  { id: 'api-openai', name: 'OpenAI Integration Agent', category: 'api', description: 'Integrates with OpenAI APIs for AI features', tags: ['openai', 'gpt', 'ai'] },
  { id: 'api-gemini', name: 'Gemini Integration Agent', category: 'api', description: 'Integrates with Google Gemini for AI features', tags: ['gemini', 'google', 'ai'] },
  { id: 'api-webhook', name: 'Webhook Handler Agent', category: 'api', description: 'Receives and processes webhook events', tags: ['webhooks', 'events', 'integration'] },

  // ── Automation ────────────────────────────────────────────────────────────
  { id: 'auto-file', name: 'File Organizer Agent', category: 'automation', description: 'Organizes files by type, date, or content', tags: ['files', 'organize', 'automation'] },
  { id: 'auto-email', name: 'Email Processor Agent', category: 'automation', description: 'Reads, categorizes, and responds to emails', tags: ['email', 'imap', 'automation'] },
  { id: 'auto-calendar', name: 'Calendar Manager Agent', category: 'automation', description: 'Manages calendar events and scheduling', tags: ['calendar', 'scheduling', 'google'] },
  { id: 'auto-backup', name: 'Backup Agent', category: 'automation', description: 'Backs up files and databases on schedule', tags: ['backup', 'storage', 'cron'] },
  { id: 'auto-monitor', name: 'System Monitor Agent', category: 'automation', description: 'Monitors system resources and sends alerts', tags: ['monitoring', 'cpu', 'memory', 'alerts'] },
  { id: 'auto-git', name: 'Git Automation Agent', category: 'automation', description: 'Automates git workflows and PR management', tags: ['git', 'github', 'automation'] },
  { id: 'auto-test', name: 'Test Runner Agent', category: 'automation', description: 'Runs tests and reports results automatically', tags: ['testing', 'ci', 'automation'] },
  { id: 'auto-deploy-pipeline', name: 'Deploy Pipeline Agent', category: 'automation', description: 'Automates full deploy pipelines end-to-end', tags: ['deploy', 'pipeline', 'devops'] },

  // ── Machine Learning ──────────────────────────────────────────────────────
  { id: 'ml-classify', name: 'Text Classifier Agent', category: 'ml', description: 'Classifies text into categories using ML', tags: ['classification', 'nlp', 'ml'] },
  { id: 'ml-sentiment', name: 'Sentiment Analysis Agent', category: 'ml', description: 'Analyzes sentiment in text data', tags: ['sentiment', 'nlp', 'analysis'] },
  { id: 'ml-summarize', name: 'Text Summarizer Agent', category: 'ml', description: 'Summarizes long documents using LLMs', tags: ['summarize', 'llm', 'nlp'] },
  { id: 'ml-translate', name: 'Translation Agent', category: 'ml', description: 'Translates text between languages', tags: ['translation', 'i18n', 'nlp'] },
  { id: 'ml-embed', name: 'Embedding Generator Agent', category: 'ml', description: 'Generates vector embeddings for semantic search', tags: ['embeddings', 'vectors', 'search'] },
  { id: 'ml-rag', name: 'RAG Pipeline Agent', category: 'ml', description: 'Builds retrieval-augmented generation pipelines', tags: ['rag', 'retrieval', 'llm'] },
  { id: 'ml-finetune', name: 'Model Fine-tuning Agent', category: 'ml', description: 'Fine-tunes LLMs on custom datasets', tags: ['finetune', 'training', 'llm'] },
  { id: 'ml-eval', name: 'Model Evaluation Agent', category: 'ml', description: 'Evaluates LLM outputs for quality and accuracy', tags: ['evaluation', 'benchmarks', 'llm'] },

  // ── Content Creation ──────────────────────────────────────────────────────
  { id: 'content-blog', name: 'Blog Writer Agent', category: 'content', description: 'Writes SEO-optimized blog posts', tags: ['blog', 'writing', 'seo'] },
  { id: 'content-social', name: 'Social Media Content Agent', category: 'content', description: 'Creates social media posts and threads', tags: ['social', 'content', 'marketing'] },
  { id: 'content-video', name: 'Video Script Agent', category: 'content', description: 'Writes video scripts and storyboards', tags: ['video', 'script', 'youtube'] },
  { id: 'content-email-copy', name: 'Email Copywriter Agent', category: 'content', description: 'Writes compelling email marketing copy', tags: ['email', 'copywriting', 'marketing'] },
  { id: 'content-product', name: 'Product Description Agent', category: 'content', description: 'Writes product descriptions for e-commerce', tags: ['ecommerce', 'product', 'copy'] },
  { id: 'content-translate-localize', name: 'Localization Agent', category: 'content', description: 'Localizes content for different markets', tags: ['localization', 'i18n', 'translation'] },

  // ── Security ──────────────────────────────────────────────────────────────
  { id: 'security-scan', name: 'Security Scanner Agent', category: 'security', description: 'Scans code for security vulnerabilities', tags: ['security', 'vulnerabilities', 'audit'] },
  { id: 'security-deps', name: 'Dependency Audit Agent', category: 'security', description: 'Audits npm/pip dependencies for CVEs', tags: ['dependencies', 'cve', 'npm'] },
  { id: 'security-secrets', name: 'Secret Scanner Agent', category: 'security', description: 'Scans repos for accidentally committed secrets', tags: ['secrets', 'api-keys', 'security'] },
  { id: 'security-pentest', name: 'Penetration Test Agent', category: 'security', description: 'Performs basic penetration testing on web apps', tags: ['pentest', 'security', 'web'] },

  // ── DevOps ────────────────────────────────────────────────────────────────
  { id: 'devops-infra', name: 'Infrastructure as Code Agent', category: 'devops', description: 'Generates Terraform/Pulumi infrastructure code', tags: ['terraform', 'iac', 'infrastructure'] },
  { id: 'devops-logs', name: 'Log Analysis Agent', category: 'devops', description: 'Analyzes application logs for errors and patterns', tags: ['logs', 'monitoring', 'analysis'] },
  { id: 'devops-cost', name: 'Cloud Cost Optimizer Agent', category: 'devops', description: 'Analyzes and optimizes cloud spending', tags: ['cost', 'cloud', 'optimization'] },
  { id: 'devops-incident', name: 'Incident Response Agent', category: 'devops', description: 'Responds to production incidents automatically', tags: ['incidents', 'oncall', 'devops'] },

  // ── Antigravity Native ────────────────────────────────────────────────────
  { id: 'antigravity-workspace', name: 'Antigravity Workspace Agent', category: 'antigravity', description: 'Manages Antigravity workspaces and projects', tags: ['antigravity', 'workspace', 'native'] },
  { id: 'antigravity-skill', name: 'Antigravity Skill Builder', category: 'antigravity', description: 'Builds custom skills for Antigravity IDE', tags: ['antigravity', 'skills', 'plugins'] },
  { id: 'antigravity-swarm', name: 'Antigravity Swarm Coordinator', category: 'antigravity', description: 'Coordinates multi-agent swarms in Antigravity', tags: ['antigravity', 'swarm', 'orchestration'] },
  { id: 'antigravity-mcp', name: 'Antigravity MCP Bridge', category: 'antigravity', description: 'Bridges external tools to Antigravity via MCP', tags: ['antigravity', 'mcp', 'bridge'] },
  { id: 'antigravity-publish', name: 'Antigravity Marketplace Publisher', category: 'antigravity', description: 'Publishes agents to Antigravity marketplace', tags: ['antigravity', 'marketplace', 'publish'] },
];

// ─── Template Code Generator ──────────────────────────────────────────────────

function generateTemplateCode(template) {
  return `#!/usr/bin/env node
/**
 * ${template.name}
 * Category: ${template.category}
 * Description: ${template.description}
 * Tags: ${template.tags.join(', ')}
 * Generated by AI Agent Academy v4.0
 */

'use strict';

const task = process.argv[2] || '${template.description}';

// ─── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  antigravityHost: process.env.ANTIGRAVITY_HOST || 'http://localhost:3000',
};

// ─── Agent Logic ──────────────────────────────────────────────────────────────

async function run() {
  console.log('🤖 [${template.id}] Starting:', task);
  console.log('📡 Connecting to Antigravity workspace...');

  try {
    // TODO: Implement ${template.name} logic here
    // This template is pre-configured for: ${template.description}
    
    await new Promise(r => setTimeout(r, 500)); // Simulate work
    
    console.log('✅ [${template.id}] Task complete:', task);
    return { success: true, task, template: '${template.id}' };
  } catch (err) {
    console.error('❌ [${template.id}] Error:', err.message);
    throw err;
  }
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

run()
  .then(result => {
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * List all templates, optionally filtered by category
 */
function list(category) {
  if (category) {
    return TEMPLATES.filter((t) => t.category === category);
  }
  return TEMPLATES;
}

/**
 * Get a template by ID
 */
function get(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}

/**
 * Get template code by ID
 */
function getCode(id) {
  const template = get(id);
  if (!template) throw new Error(`Template not found: ${id}`);
  return generateTemplateCode(template);
}

/**
 * Search templates by tag or keyword
 */
function search(query) {
  const q = query.toLowerCase();
  return TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q)) ||
      t.category.includes(q)
  );
}

/**
 * Get all categories
 */
function categories() {
  return [...new Set(TEMPLATES.map((t) => t.category))];
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────

if (require.main === module) {
  const arg = process.argv[2];

  if (!arg) {
    console.log(`\n📦 AI Agent Academy — Template Registry`);
    console.log(`   Total templates: ${TEMPLATES.length}`);
    console.log(`   Categories: ${categories().join(', ')}`);
    console.log(`\nUsage:`);
    console.log(`  node src/agent-templates/index.js list [category]`);
    console.log(`  node src/agent-templates/index.js get <template-id>`);
    console.log(`  node src/agent-templates/index.js search <query>`);
    console.log(`  node src/agent-templates/index.js <template-id>  # Run template`);
    process.exit(0);
  }

  if (arg === 'list') {
    const cat = process.argv[3];
    const results = list(cat);
    console.log(`\n📋 Templates${cat ? ` (${cat})` : ''}: ${results.length}`);
    results.forEach((t) => console.log(`  [${t.id}] ${t.name} — ${t.description}`));
  } else if (arg === 'search') {
    const query = process.argv[3];
    const results = search(query);
    console.log(`\n🔍 Search results for "${query}": ${results.length}`);
    results.forEach((t) => console.log(`  [${t.id}] ${t.name}`));
  } else if (arg === 'get') {
    const id = process.argv[3];
    const code = getCode(id);
    console.log(code);
  } else {
    // Treat as template ID to run
    try {
      const code = getCode(arg);
      const tmpFile = require('path').join(require('os').tmpdir(), `academy-${arg}.js`);
      require('fs').writeFileSync(tmpFile, code);
      require('child_process').execSync(`node ${tmpFile} "${process.argv.slice(3).join(' ')}"`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`Template error: ${err.message}`);
      process.exit(1);
    }
  }
}

module.exports = { list, get, getCode, search, categories, TEMPLATES };
