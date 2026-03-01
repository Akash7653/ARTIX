#!/usr/bin/env node

/**
 * ARTIX 2K26 - API Testing Script
 * 
 * This script provides utilities for testing all API endpoints
 * Usage: node testAPI.js
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE = 'http://localhost:5000/api';
const ADMIN_PASSWORD = '23J41A69A3';
const ADMIN_EMAIL = 'thrinadhgujjarlapudi@gmail.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warning: `${colors.yellow}!${colors.reset}`,
  };
  console.log(`${prefix[type] || '•'} ${message}`);
}

async function testHealthCheck() {
  console.log('\n' + '='.repeat(50));
  log('Testing Health Check', 'info');
  console.log('='.repeat(50));

  try {
    const response = await axios.get(`${API_BASE}/health`);
    log(`Server Status: ${response.data.message}`, 'success');
    return true;
  } catch (error) {
    log(`Health check failed: ${error.message}`, 'error');
    return false;
  }
}

async function testRegistration() {
  console.log('\n' + '='.repeat(50));
  log('Testing User Registration', 'info');
  console.log('='.repeat(50));

  try {
    // Create a test image file
    const imageBuffer = Buffer.from('fake image data');
    const fileName = 'test-payment.jpg';
    fs.writeFileSync(fileName, imageBuffer);

    const formData = new FormData();
    formData.append('fullName', 'Test User');
    formData.append('email', `test${Date.now()}@example.com`);
    formData.append('phone', '9876543210');
    formData.append('collegeName', 'Malla Reddy Engineering College');
    formData.append('yearOfStudy', '3rd Year');
    formData.append('branch', 'IoT');
    formData.append('rollNumber', 'IOT001');
    formData.append('selectedIndividualEvents', 'registration,mini_canvas');
    formData.append('selectedCombo', '');
    formData.append('teamMembers', '[]');
    formData.append('totalAmount', '250');
    formData.append('paymentScreenshot', fs.createReadStream(fileName));

    const response = await axios.post(`${API_BASE}/register`, formData, {
      headers: formData.getHeaders(),
    });

    log(`Registration successful`, 'success');
    log(`Registration ID: ${response.data.registrationId}`, 'success');
    log(`QR Code generated: ${response.data.entryQRCode ? 'Yes' : 'No'}`, 'success');

    // Store registration ID for later tests
    fs.writeFileSync('.test-reg-id', response.data.registrationId);

    // Clean up
    fs.unlinkSync(fileName);

    return response.data.registrationId;
  } catch (error) {
    log(`Registration failed: ${error.response?.data?.error || error.message}`, 'error');
    return null;
  }
}

async function testVerifyQR(registrationId) {
  console.log('\n' + '='.repeat(50));
  log('Testing QR Verification', 'info');
  console.log('='.repeat(50));

  try {
    const qrData = {
      registrationId,
      name: 'Test User',
      phone: '9876543210',
      selectedEvents: ['registration', 'mini_canvas'],
      teamMembers: [],
      status: 'Pending Entry',
    };

    const response = await axios.post(`${API_BASE}/verify-qr`, { qrData });

    log(`QR Verification successful`, 'success');
    log(`Participant: ${response.data.registration.full_name}`, 'success');
    log(`Entry Status: ${response.data.registration.entry_status}`, 'success');
    return true;
  } catch (error) {
    log(`QR verification failed: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

async function testAdminApproval(registrationId) {
  console.log('\n' + '='.repeat(50));
  log('Testing Admin Entry Approval', 'info');
  console.log('='.repeat(50));

  try {
    const response = await axios.post(`${API_BASE}/admin/approve-entry`, {
      registrationId,
      adminPassword: ADMIN_PASSWORD,
    });

    log(`Entry approval successful`, 'success');
    log(`Status updated to: ${response.data.registration.status}`, 'success');
    return true;
  } catch (error) {
    log(`Admin approval failed: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

async function testGetRegistration(registrationId) {
  console.log('\n' + '='.repeat(50));
  log('Testing Get Registration Details', 'info');
  console.log('='.repeat(50));

  try {
    const response = await axios.get(`${API_BASE}/registration/${registrationId}`);

    log(`Registration retrieved successfully`, 'success');
    log(`Name: ${response.data.registration.full_name}`, 'success');
    log(`Email: ${response.data.registration.email}`, 'success');
    log(`Total Amount: ₹${response.data.registration.total_amount}`, 'success');
    return true;
  } catch (error) {
    log(`Get registration failed: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

async function testGetStats() {
  console.log('\n' + '='.repeat(50));
  log('Testing Admin Statistics', 'info');
  console.log('='.repeat(50));

  try {
    const response = await axios.get(`${API_BASE}/admin/stats`);

    log(`Statistics retrieved successfully`, 'success');
    log(`Total Registrations: ${response.data.totalRegistrations}`, 'success');
    log(`Approved Entries: ${response.data.approvedEntries}`, 'success');
    log(`Pending Entries: ${response.data.pendingEntries}`, 'success');
    log(`Total Revenue: ₹${response.data.totalRevenue}`, 'success');
    return true;
  } catch (error) {
    log(`Get stats failed: ${error.message}`, 'error');
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(48) + '╗');
  console.log('║' + ' ARTIX 2K26 - API Test Suite'.padEnd(49) + '║');
  console.log('╚' + '═'.repeat(48) + '╝');

  // Test health check first
  const healthy = await testHealthCheck();
  if (!healthy) {
    log('Backend is not running. Start it with: npm start', 'error');
    process.exit(1);
  }

  // Run tests
  const registrationId = await testRegistration();

  if (registrationId) {
    await testVerifyQR(registrationId);
    await testAdminApproval(registrationId);
    await testGetRegistration(registrationId);
  }

  await testGetStats();

  console.log('\n' + '='.repeat(50));
  console.log('Test suite completed!');
  console.log('='.repeat(50));
  console.log('\n📌 Next steps:');
  console.log('   1. Run frontend: cd artix-frontend && npm run dev');
  console.log('   2. Visit: http://localhost:5173');
  console.log('   3. Test manual registration through the UI');
  console.log('   4. Test admin scanner at: http://localhost:5173/admin-scan');
}

runAllTests().catch(error => {
  log(`Test script failed: ${error.message}`, 'error');
  process.exit(1);
});
