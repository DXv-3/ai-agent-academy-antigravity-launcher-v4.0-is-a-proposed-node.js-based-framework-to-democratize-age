#!/usr/bin/env node
/**
 * AI Agent Academy — Marketplace Publisher
 * Zips agent workspace and publishes to Antigravity marketplace
 * Enables viral agent economy and sharing
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Config ───────────────────────────────────────────────────────────────────

const MARKETPLACE_CONFIG = {
  apiEndpoint: process.env.ANTIGRAVITY_MARKETPLACE_API || 'https://antigravity.google/marketplace/api/v1',
  apiKey: process.env.ANTIGRAVITY_API_KEY || null,
  publishDir: path.join(__dirname, '..', 'dist', 'marketplace'),
  maxPackageSize: 50 * 1024 * 1024, // 50MB
};

// ─── Package Builder ──────────────────────────────────────────────────────────

/**
 * Create a marketplace package (zip) from an agent file
 */
async function createPackage(agentPath, metadata) {
  const { name, description, version = '1.0.0', tags = [], category = 'general' } = metadata;

  if (!fs.existsSync(agentPath)) {
    throw new Error(`Agent file not found: ${agentPath}`);
  }

  // Ensure publish dir exists
  if (!fs.existsSync(MARKETPLACE_CONFIG.publishDir)) {
    fs.mkdirSync(MARKETPLACE_CONFIG.publishDir, { recursive: true });
  }

  const packageName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const packageDir = path.join(MARKETPLACE_CONFIG.publishDir, packageName);
  const zipPath = path.join(MARKETPLACE_CONFIG.publishDir, `${packageName}-${version}.zip`);

  // Create package directory
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
  }

  // Copy agent file
  const agentDest = path.join(packageDir, 'agent.js');
  fs.copyFileSync(agentPath, agentDest);

  // Create package manifest
  const manifest = {
    name: packageName,
    displayName: name,
    version,
    description,
    tags,
    category,
    author: process.env.ANTIGRAVITY_USERNAME || 'anonymous',
    publishedAt: new Date().toISOString(),
    runtime: 'node',
    entrypoint: 'agent.js',
    antigravityVersion: '4.0.0',
    engines: { node: '>=20' },
  };

  fs.writeFileSync(
    path.join(packageDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Create README for the package
  const readme = `# ${name}

${description}

## Category
${category}

## Tags
${tags.map((t) => `\`${t}\``).join(', ')}

## Usage

\`\`\`bash
# In Antigravity workspace:
node agent.js "your task here"
\`\`\`

## Requirements
- Node.js >= 20
- Optional: \`GEMINI_API_KEY\` for Gemini 3 Pro
- Optional: Ollama running locally for offline mode

---
*Published via AI Agent Academy v4.0*
`;

  fs.writeFileSync(path.join(packageDir, 'README.md'), readme);

  // Create zip archive
  try {
    execSync(`cd "${MARKETPLACE_CONFIG.publishDir}" && zip -r "${zipPath}" "${packageName}/"`, {
      stdio: 'pipe',
    });
    console.log(`📦 Package created: ${zipPath}`);
  } catch {
    // Fallback: just copy the directory (zip may not be available)
    console.log(`📦 Package directory created: ${packageDir}`);
    return { packageDir, manifest };
  }

  // Check package size
  if (fs.existsSync(zipPath)) {
    const stats = fs.statSync(zipPath);
    if (stats.size > MARKETPLACE_CONFIG.maxPackageSize) {
      throw new Error(`Package too large: ${stats.size} bytes (max ${MARKETPLACE_CONFIG.maxPackageSize})`);
    }
    console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
  }

  return { zipPath, packageDir, manifest };
}

// ─── Marketplace Publisher ────────────────────────────────────────────────────

/**
 * Publish an agent to the Antigravity marketplace
 */
async function publish(agentPath, name, description = '', options = {}) {
  console.log(`\n🛒 Publishing to Antigravity Marketplace`);
  console.log(`   Agent: ${agentPath}`);
  console.log(`   Name: ${name}`);

  // 1. Create package
  const { zipPath, packageDir, manifest } = await createPackage(agentPath, {
    name,
    description: description || `AI agent: ${name}`,
    version: options.version || '1.0.0',
    tags: options.tags || [],
    category: options.category || 'general',
  });

  // 2. Attempt to publish to Antigravity marketplace API
  if (MARKETPLACE_CONFIG.apiKey) {
    try {
      const http = require('https');
      const packageData = zipPath && fs.existsSync(zipPath)
        ? fs.readFileSync(zipPath)
        : Buffer.from(JSON.stringify(manifest));

      const result = await new Promise((resolve, reject) => {
        const req = http.request(
          `${MARKETPLACE_CONFIG.apiEndpoint}/publish`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/zip',
              'Authorization': `Bearer ${MARKETPLACE_CONFIG.apiKey}`,
              'X-Package-Name': manifest.name,
              'X-Package-Version': manifest.version,
            },
          },
          (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch {
                resolve({ raw: data });
              }
            });
          }
        );
        req.on('error', reject);
        req.write(packageData);
        req.end();
      });

      console.log(`\n✅ Published to Antigravity Marketplace!`);
      console.log(`   URL: https://antigravity.google/marketplace/${manifest.name}`);
      console.log(`   Version: ${manifest.version}`);
      return { success: true, manifest, marketplaceUrl: result.url, result };
    } catch (err) {
      console.warn(`\n⚠️  Marketplace API not reachable: ${err.message}`);
      console.log('   Package saved locally for manual upload');
    }
  } else {
    console.log(`\n⚠️  No ANTIGRAVITY_API_KEY set — package saved locally`);
    console.log(`   Set ANTIGRAVITY_API_KEY to publish to the live marketplace`);
  }

  // 3. Local publish summary
  const localUrl = `file://${packageDir}`;
  console.log(`\n📦 Package ready for manual upload:`);
  console.log(`   Directory: ${packageDir}`);
  if (zipPath && fs.existsSync(zipPath)) {
    console.log(`   Zip: ${zipPath}`);
  }
  console.log(`   Manifest: ${JSON.stringify(manifest, null, 2)}`);
  console.log(`\n💡 To publish manually:`);
  console.log(`   1. Go to https://antigravity.google/marketplace/publish`);
  console.log(`   2. Upload the zip file: ${zipPath || packageDir}`);
  console.log(`   3. Fill in the metadata from manifest.json`);

  return { success: true, manifest, localUrl, packageDir };
}

// ─── List Published Agents ────────────────────────────────────────────────────

function listPublished() {
  const publishDir = MARKETPLACE_CONFIG.publishDir;
  if (!fs.existsSync(publishDir)) {
    console.log('No published agents yet. Run `npm run marketplace:publish` to publish one.');
    return [];
  }

  const packages = fs.readdirSync(publishDir)
    .filter((f) => fs.statSync(path.join(publishDir, f)).isDirectory())
    .map((dir) => {
      const manifestPath = path.join(publishDir, dir, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      }
      return { name: dir };
    });

  console.log(`\n📋 Published Agents (${packages.length}):`);
  packages.forEach((p) => {
    console.log(`  [${p.name}] ${p.displayName || p.name} v${p.version || '?'} — ${p.description || ''}`);
  });

  return packages;
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'list') {
    listPublished();
    process.exit(0);
  }

  const agentPath = args[0] || path.join(__dirname, '..', 'dist', 'agent.js');
  const name = args[1] || path.basename(agentPath, '.js');
  const description = args.slice(2).join(' ') || `AI agent: ${name}`;

  if (!fs.existsSync(agentPath)) {
    console.error(`❌ Agent file not found: ${agentPath}`);
    console.log('Usage: node MARKETPLACE/publish.js <agent-path> <name> [description]');
    console.log('Example: node MARKETPLACE/publish.js dist/agent.js "My Research Agent" "Summarizes arXiv papers"');
    process.exit(1);
  }

  publish(agentPath, name, description)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Publish error:', err.message);
      process.exit(1);
    });
}

module.exports = { publish, createPackage, listPublished };
