#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const contractsDir = path.join(rootDir, 'packages', 'yuppeeai-contracts');
const backendDir = path.resolve(__dirname);

try {
  console.log('Building contracts...');
  execSync('npx tsc -p tsconfig.json', {
    cwd: contractsDir,
    stdio: 'inherit'
  });

  console.log('Copying contracts to backend...');
  const src = path.join(contractsDir, 'dist');
  const dst = path.join(backendDir, 'node_modules', '@yuppee-ai', 'contracts');

  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true, force: true });
  fs.copyFileSync(
    path.join(contractsDir, 'package.json'),
    path.join(dst, 'package.json')
  );

  console.log('✓ Contracts ready for backend deployment');
} catch (error) {
  console.error('✗ Failed to build contracts:', error.message);
  process.exit(1);
}
