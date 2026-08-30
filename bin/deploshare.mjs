#!/usr/bin/env node

/**
 * DeploShare Developer CLI
 * Instant temporary file and text transfers using 6-digit cryptographic PINs.
 * Usage: npx deploshare [upload|get|text] [options]
 */

import fs from 'fs';
import path from 'path';

const VERSION = '1.0.0';
const DEFAULT_URL = process.env.DEPLOSHARE_URL || 'https://deploshare-livesecure.vercel.app';

// ANSI Color helper
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function printBanner() {
  console.log(`
${colors.blue}${colors.bold}  ____             _       ____  _                   ${colors.reset}
${colors.blue}${colors.bold} |  _ \\  ___ _ __ | | ___ / ___|| |__   __ _ _ __ ___  ${colors.reset}
${colors.cyan}${colors.bold} | | | |/ _ \\ '_ \\| |/ _ \\\\___ \\| '_ \\ / _\` | '__/ _ \\ ${colors.reset}
${colors.cyan}${colors.bold} | |_| |  __/ |_) | | (_) |___) | | | | (_| | | |  __/ ${colors.reset}
${colors.blue}${colors.bold} |____/ \\___| .__/|_|\\___/|____/|_| |_|\\__,_|_|  \\___| ${colors.reset}
${colors.blue}${colors.bold}            |_|                                        ${colors.reset}
${colors.gray}  Code-Only Ephemeral Transfers CLI v${VERSION}${colors.reset}
`);
}

function printHelp() {
  printBanner();
  console.log(`
${colors.bold}USAGE:${colors.reset}
  $ npx deploshare <command> [options]

${colors.bold}COMMANDS:${colors.reset}
  ${colors.cyan}upload <file>${colors.reset}       Upload a file and get a secure 6-digit PIN
  ${colors.cyan}text <string>${colors.reset}       Share an encrypted text snippet / config
  ${colors.cyan}get <code>${colors.reset}          Download or view share by 6-digit PIN
  ${colors.cyan}help, --help${colors.reset}        Show this help documentation
  ${colors.cyan}version, -v${colors.reset}         Show version info

${colors.bold}OPTIONS:${colors.reset}
  --burn            Auto self-destruct share after first download
  --password <pwd>  Optional password protection
  --expiry <sec>    Expiry duration in seconds (default: 86400 / 24h)
  --out <dest>      Custom output path for downloaded file
  --url <url>       Target DeploShare server URL (default: ${DEFAULT_URL})
  --key <api-key>   Developer REST API Key (optional)

${colors.bold}EXAMPLES:${colors.reset}
  $ npx deploshare upload ./dist.zip --burn
  $ npx deploshare text "DATABASE_URL=postgres://..." --password "secret123"
  $ npx deploshare get 583214 --out ./received.zip
`);
}

async function handleUpload(args) {
  const filePath = args[0];
  if (!filePath) {
    console.error(`${colors.red}❌ Error: Please specify a file path to upload.${colors.reset}`);
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`${colors.red}❌ Error: File not found at "${resolved}"${colors.reset}`);
    process.exit(1);
  }

  const stats = fs.statSync(resolved);
  const fileName = path.basename(resolved);
  const fileBytes = fs.readFileSync(resolved);

  const burn = args.includes('--burn');
  const pwdIdx = args.indexOf('--password');
  const password = pwdIdx > -1 ? args[pwdIdx + 1] : undefined;
  const expIdx = args.indexOf('--expiry');
  const expiry = expIdx > -1 ? parseInt(args[expIdx + 1], 10) : 86400;
  const keyIdx = args.indexOf('--key');
  const apiKey = keyIdx > -1 ? args[keyIdx + 1] : process.env.DEPLOSHARE_API_KEY;
  const urlIdx = args.indexOf('--url');
  const baseUrl = urlIdx > -1 ? args[urlIdx + 1] : DEFAULT_URL;

  console.log(`${colors.cyan}📦 Packaging & Transmitting "${fileName}" (${(stats.size / 1024).toFixed(1)} KB)...${colors.reset}`);

  try {
    const formData = new FormData();
    const blob = new Blob([fileBytes]);
    formData.append('file', blob, fileName);
    formData.append('type', 'file');
    formData.append('expirySeconds', String(expiry));
    if (burn) formData.append('burnAfterDownload', 'true');
    if (password) formData.append('password', password);

    const headers = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(`${baseUrl}/api/v1/shares`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      console.error(`${colors.red}❌ Upload Failed: ${json.error || 'Server error'}${colors.reset}`);
      process.exit(1);
    }

    const { shareCode, expiresAt, accessUrl } = json.data;

    console.log(`
${colors.green}${colors.bold}====================================================${colors.reset}
${colors.green}${colors.bold}  ✅ FILE UPLOADED SECURELY VIA DEPLOSHARE          ${colors.reset}
${colors.green}${colors.bold}====================================================${colors.reset}

  ${colors.bold}🔑 6-DIGIT CODE:${colors.reset}   ${colors.cyan}${colors.bold}${shareCode}${colors.reset}
  ${colors.bold}🔗 DIRECT ACCESS:${colors.reset}  ${accessUrl || `${baseUrl}/access?code=${shareCode}`}
  ${colors.bold}⏳ EXPIRES AT:${colors.reset}     ${new Date(expiresAt).toLocaleString()}
  ${colors.bold}🔥 BURN MODE:${colors.reset}      ${burn ? `${colors.yellow}ENABLED (Self-destructs on download)${colors.reset}` : 'Standard'}
  ${colors.bold}🔒 PASSWORD:${colors.reset}       ${password ? 'Configured' : 'None'}

${colors.gray}  Recipient can run: npx deploshare get ${shareCode}${colors.reset}
`);
  } catch (err) {
    console.error(`${colors.red}❌ Network Error: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

async function handleText(args) {
  const content = args[0];
  if (!content) {
    console.error(`${colors.red}❌ Error: Please provide text content to share.${colors.reset}`);
    process.exit(1);
  }

  const burn = args.includes('--burn');
  const pwdIdx = args.indexOf('--password');
  const password = pwdIdx > -1 ? args[pwdIdx + 1] : undefined;
  const expIdx = args.indexOf('--expiry');
  const expiry = expIdx > -1 ? parseInt(args[expIdx + 1], 10) : 86400;
  const keyIdx = args.indexOf('--key');
  const apiKey = keyIdx > -1 ? args[keyIdx + 1] : process.env.DEPLOSHARE_API_KEY;
  const urlIdx = args.indexOf('--url');
  const baseUrl = urlIdx > -1 ? args[urlIdx + 1] : DEFAULT_URL;

  console.log(`${colors.cyan}🔒 Encrypting & Transmitting Text Snippet (${content.length} chars)...${colors.reset}`);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(`${baseUrl}/api/v1/shares`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'text',
        textContent: content,
        expirySeconds: expiry,
        burnAfterDownload: burn,
        password,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      console.error(`${colors.red}❌ Share Failed: ${json.error || 'Server error'}${colors.reset}`);
      process.exit(1);
    }

    const { shareCode, expiresAt, accessUrl } = json.data;

    console.log(`
${colors.green}${colors.bold}====================================================${colors.reset}
${colors.green}${colors.bold}  ✅ TEXT SNIPPET SHARED SECURELY                   ${colors.reset}
${colors.green}${colors.bold}====================================================${colors.reset}

  ${colors.bold}🔑 6-DIGIT CODE:${colors.reset}   ${colors.cyan}${colors.bold}${shareCode}${colors.reset}
  ${colors.bold}🔗 DIRECT ACCESS:${colors.reset}  ${accessUrl || `${baseUrl}/access?code=${shareCode}`}
  ${colors.bold}⏳ EXPIRES AT:${colors.reset}     ${new Date(expiresAt).toLocaleString()}
  ${colors.bold}🔥 BURN MODE:${colors.reset}      ${burn ? 'ENABLED' : 'Standard'}
`);
  } catch (err) {
    console.error(`${colors.red}❌ Network Error: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

async function handleGet(args) {
  const code = args[0];
  if (!code || !/^[0-9]{6}$/.test(code.trim())) {
    console.error(`${colors.red}❌ Error: Please provide a valid 6-digit numeric PIN.${colors.reset}`);
    process.exit(1);
  }

  const pwdIdx = args.indexOf('--password');
  const password = pwdIdx > -1 ? args[pwdIdx + 1] : undefined;
  const outIdx = args.indexOf('--out');
  const outPath = outIdx > -1 ? args[outIdx + 1] : undefined;
  const urlIdx = args.indexOf('--url');
  const baseUrl = urlIdx > -1 ? args[urlIdx + 1] : DEFAULT_URL;

  console.log(`${colors.cyan}🔍 Querying DeploShare node for PIN: ${code}...${colors.reset}`);

  try {
    const headers = {};
    if (password) headers['x-share-password'] = password;

    const res = await fetch(`${baseUrl}/api/v1/shares/${code}`, {
      headers,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      console.error(`${colors.red}❌ Access Failed: ${json.error || 'Share not found or expired'}${colors.reset}`);
      process.exit(1);
    }

    const share = json.data;

    if (share.type === 'text') {
      console.log(`
${colors.green}${colors.bold}================ TEXT CONTENT ====================${colors.reset}
${share.textContent || 'No text content.'}
${colors.green}${colors.bold}====================================================${colors.reset}
`);
    } else {
      console.log(`${colors.cyan}📥 Fetching file binary for "${share.fileName || 'download'}"...${colors.reset}`);

      const dlRes = await fetch(`${baseUrl}/api/v1/shares/${code}/download`, { headers });
      if (!dlRes.ok) {
        console.error(`${colors.red}❌ Download Error: Failed to fetch download stream.${colors.reset}`);
        process.exit(1);
      }

      const buffer = Buffer.from(await dlRes.arrayBuffer());
      const destName = outPath || share.fileName || `deploshare_${code}.bin`;
      const destResolved = path.resolve(process.cwd(), destName);

      fs.writeFileSync(destResolved, buffer);
      console.log(`${colors.green}${colors.bold}✅ File downloaded successfully to:${colors.reset} ${destResolved} (${(buffer.length / 1024).toFixed(1)} KB)`);
    }
  } catch (err) {
    console.error(`${colors.red}❌ Fetch Error: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

// CLI Command Router
const rawArgs = process.argv.slice(2);
const command = rawArgs[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === 'version' || command === '--version' || command === '-v') {
  console.log(`DeploShare CLI v${VERSION}`);
  process.exit(0);
}

if (command === 'upload') {
  handleUpload(rawArgs.slice(1));
} else if (command === 'text') {
  handleText(rawArgs.slice(1));
} else if (command === 'get') {
  handleGet(rawArgs.slice(1));
} else {
  console.error(`${colors.red}Unknown command: "${command}". Run "npx deploshare --help" for usage.${colors.reset}`);
  process.exit(1);
}
