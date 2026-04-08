#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const contractsDir = path.resolve(__dirname);
const rootDir = path.resolve(__dirname, '../..');
const backendDir = path.join(rootDir, 'yuppeeai-backend');
const frontendDir = path.join(rootDir, 'yuppeeai-frontend');

try {
  console.log('Building contracts...');
  execSync('npx tsc -p tsconfig.json', {
    cwd: contractsDir,
    stdio: 'inherit'
  });

  const src = path.join(contractsDir, 'dist');
  const packageJsonPath = path.join(contractsDir, 'package.json');

  // Copy to backend
  console.log('Copying contracts to backend...');
  const backendDst = path.join(backendDir, 'node_modules', '@yuppee-ai', 'contracts');
  fs.mkdirSync(path.dirname(backendDst), { recursive: true });
  fs.cpSync(src, backendDst, { recursive: true, force: true });
  fs.copyFileSync(packageJsonPath, path.join(backendDst, 'package.json'));

  // Copy to frontend
  console.log('Copying contracts to frontend...');
  const frontendDst = path.join(frontendDir, 'node_modules', '@yuppee-ai', 'contracts');
  fs.mkdirSync(path.dirname(frontendDst), { recursive: true });
  fs.cpSync(src, frontendDst, { recursive: true, force: true });
  fs.copyFileSync(packageJsonPath, path.join(frontendDst, 'package.json'));

  console.log('✓ Contracts built and installed to consumers');
} catch (error) {
  console.error('✗ Failed to build contracts:', error.message);
  process.exit(1);
}
