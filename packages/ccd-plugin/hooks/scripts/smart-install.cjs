#!/usr/bin/env node

/**
 * CCD Smart Installer
 * Automatically installs Bun if not present
 * Based on claude-mem's smart-install.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.error(`${colors[color]}${message}${colors.reset}`);
}

async function checkBunInstalled() {
  try {
    await execAsync('bun --version');
    return true;
  } catch {
    return false;
  }
}

async function getBunPath() {
  const isWindows = process.platform === 'win32';
  const bunPaths = isWindows
    ? [path.join(os.homedir(), '.bun', 'bin', 'bun.exe')]
    : [
        path.join(os.homedir(), '.bun', 'bin', 'bun'),
        '/usr/local/bin/bun',
        '/opt/homebrew/bin/bun',
      ];

  for (const bunPath of bunPaths) {
    if (fs.existsSync(bunPath)) {
      return bunPath;
    }
  }

  return null;
}

async function installBun() {
  log('📦 Installing Bun...', 'blue');

  const isWindows = process.platform === 'win32';
  const installCmd = isWindows
    ? 'powershell -c "irm bun.sh/install.ps1 | iex"'
    : 'curl -fsSL https://bun.sh/install | bash';

  try {
    await execAsync(installCmd);
    log('✓ Bun installed successfully', 'green');

    // Verify installation
    const bunPath = await getBunPath();
    if (bunPath) {
      log(`✓ Bun binary found at: ${bunPath}`, 'green');
      return true;
    } else {
      log('⚠ Bun installed but binary not found in expected locations', 'yellow');
      log('Please restart your terminal or add Bun to your PATH', 'yellow');
      return false;
    }
  } catch (error) {
    log(`✗ Failed to install Bun: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  try {
    log('🚀 CCD Smart Installer', 'blue');
    log('');

    // Check if Bun is installed
    const bunInstalled = await checkBunInstalled();

    if (bunInstalled) {
      const { stdout } = await execAsync('bun --version');
      log(`✓ Bun is already installed (v${stdout.trim()})`, 'green');
    } else {
      log('⚠ Bun not found, installing...', 'yellow');
      await installBun();
    }

    log('');
    log('✓ Installation complete!', 'green');
    process.exit(0);
  } catch (error) {
    log('');
    log(`✗ Installation failed: ${error.message}`, 'red');
    log('Please install Bun manually: https://bun.sh', 'yellow');
    process.exit(1);
  }
}

main();
