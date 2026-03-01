#!/usr/bin/env node

/**
 * ARTIX 2K26 - Quick Start Script
 * 
 * This script automates the setup and startup process
 * Usage: node quickStart.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(message, type = 'info') {
  const prefix = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    start: '🚀'
  };
  console.log(`${prefix[type] || '•'} ${message}`);
}

function exec(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
    return output;
  } catch (error) {
    log(`Failed to execute: ${command}`, 'error');
    return null;
  }
}

async function quickStart() {
  console.clear();
  
  log('ARTIX 2K26 - Event Registration System', 'start');
  console.log('='.repeat(50));

  try {
    // Step 1: Check Node.js
    log('Checking Node.js installation...', 'info');
    const nodeVersion = exec('node --version', true);
    if (!nodeVersion) throw new Error('Node.js not found');
    log(`Node.js ${nodeVersion.trim()} found`, 'success');

    // Step 2: Check .env files
    log('Checking environment configuration...', 'info');
    
    const backendEnv = path.join(__dirname, '.env');
    if (!fs.existsSync(backendEnv)) {
      log('Backend .env not found', 'warning');
      fs.writeFileSync(backendEnv, `PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase
FRONTEND_URL=http://localhost:5173
ADMIN_PASSWORD=23J41A69A3
ADMIN_EMAIL=thrinadhgujjarlapudi@gmail.com
`);
      log('Backend .env created with defaults', 'success');
    } else {
      log('Backend .env found', 'success');
    }

    // Step 3: Install backend dependencies
    log('Installing backend dependencies...', 'info');
    if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
      log('Installing npm packages...', 'info');
      exec('npm install');
    } else {
      log('Dependencies already installed', 'success');
    }

    // Step 4: Initialize database
    log('Initializing MongoDB...', 'info');
    exec('node initDb.js');

    // Step 5: Start server
    log('Starting ARTIX backend server...', 'start');
    console.log('\n' + '='.repeat(50));
    console.log('Backend running on: http://localhost:5000');
    console.log('Health check: http://localhost:5000/api/health');
    console.log('='.repeat(50));
    console.log('\n📌 In another terminal, run:');
    console.log('   cd artix-frontend');
    console.log('   npm install');
    console.log('   npm run dev');
    console.log('\n🌐 Then visit http://localhost:5173');

    // Start the server
    exec('node server.js');

  } catch (error) {
    log(`Startup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

quickStart().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
