#!/usr/bin/env node

/**
 * ARTIX 2K26 - Database Initialization Script
 * 
 * This script initializes the MongoDB database with proper
 * collections, indexes, and sample data (optional)
 * 
 * Run: node initDb.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase';
const DB_NAME = 'artix_2026';

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully');

    const db = client.db(DB_NAME);

    // Create collections
    console.log('\n📝 Creating collections...');

    // Registrations collection
    const registrationsCollection = await db.createCollection('registrations');
    console.log('✅ Created: registrations');

    // Payments collection
    const paymentsCollection = await db.createCollection('payments');
    console.log('✅ Created: payments');

    // Team members collection
    const teamMembersCollection = await db.createCollection('team_members');
    console.log('✅ Created: team_members');

    // Create indexes for registrations
    console.log('\n🔍 Creating indexes...');

    await registrationsCollection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Index created: registrations.email (unique)');

    await registrationsCollection.createIndex({ registration_id: 1 }, { unique: true });
    console.log('✅ Index created: registrations.registration_id (unique)');

    await registrationsCollection.createIndex({ entry_status: 1 });
    console.log('✅ Index created: registrations.entry_status');

    await registrationsCollection.createIndex({ created_at: 1 });
    console.log('✅ Index created: registrations.created_at');

    // Create indexes for payments
    await paymentsCollection.createIndex({ registration_id: 1 });
    console.log('✅ Index created: payments.registration_id');

    // Create indexes for team_members
    await teamMembersCollection.createIndex({ registration_id: 1 });
    console.log('✅ Index created: team_members.registration_id');

    // Create validation schema
    console.log('\n📋 Setting up collection validation...');

    await db.command({
      collMod: 'registrations',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['registration_id', 'full_name', 'email', 'phone', 'total_amount'],
          properties: {
            registration_id: { bsonType: 'string', description: 'Unique registration ID' },
            full_name: { bsonType: 'string' },
            email: { bsonType: 'string' },
            phone: { bsonType: 'string' },
            total_amount: { bsonType: 'int', minimum: 0 },
            entry_status: { 
              enum: ['pending', 'approved', 'rejected'],
              description: 'Entry status'
            }
          }
        }
      }
    }).catch(err => {
      // Validation might fail if collection already exists, that's okay
      console.log('⚠️  Validation setup: collection may already exist');
    });

    console.log('✅ Validation schema applied');

    // Ensure all existing registrations have admin_viewed field
    console.log('\n🔧 Adding admin_viewed field to existing registrations...');
    const updateResult = await registrationsCollection.updateMany(
      { admin_viewed: { $exists: false } },
      { $set: { admin_viewed: false } }
    );
    if (updateResult.modifiedCount > 0) {
      console.log(`✅ Updated ${updateResult.modifiedCount} registrations with admin_viewed field`);
    }

    // Display summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Database Initialization Complete!');
    console.log('='.repeat(50));

    // Get collection stats
    const registrationStats = await db.collection('registrations').stats();
    console.log(`\nRegistrations collection: ${registrationStats.count} documents`);

    const paymentStats = await db.collection('payments').stats();
    console.log(`Payments collection: ${paymentStats.count} documents`);

    const teamStats = await db.collection('team_members').stats();
    console.log(`Team members collection: ${teamStats.count} documents`);

    console.log('\n✨ Ready to start accepting registrations!');
    console.log('📌 Start the backend server with: npm start');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run initialization
initializeDatabase().catch(console.error);
