/**
 * MIGRATION SCRIPT: Mark all existing registrations as "admin_viewed: false"
 * This ensures all existing participants are tracked as "not yet viewed by admin"
 * 
 * Usage: node markExistingAsPending.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'artix_events';

async function markExistingAsNotViewed() {
  let client;
  try {
    console.log('🔄 Connecting to MongoDB...');
    client = new MongoClient(MONGO_URI);
    await client.connect();

    const db = client.db(DB_NAME);
    const registrationsCollection = db.collection('registrations');

    // Check if admin_viewed field exists
    const existingWithField = await registrationsCollection.countDocuments({ admin_viewed: { $exists: true } });
    console.log(`📊 Registrations with admin_viewed field: ${existingWithField}`);

    // Update all documents to add admin_viewed: false if not already set
    const result = await registrationsCollection.updateMany(
      { admin_viewed: { $exists: false } },  // Only update documents that don't have this field
      { $set: { admin_viewed: false } }
    );

    console.log(`✅ Migration complete!`);
    console.log(`   - Matched: ${result.matchedCount} documents`);
    console.log(`   - Modified: ${result.modifiedCount} documents`);
    console.log(`   - All existing registrations marked as "not yet viewed by admin"`);

    // Show sample of updated data
    const sample = await registrationsCollection.findOne();
    if (sample) {
      console.log(`\n📋 Sample registration after update:`);
      console.log(`   registration_id: ${sample.registration_id}`);
      console.log(`   full_name: ${sample.full_name}`);
      console.log(`   approval_status: ${sample.approval_status}`);
      console.log(`   admin_viewed: ${sample.admin_viewed}`);
    }

    await client.close();
    console.log('\n✨ Database migration completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration failed:', err);
    if (client) await client.close();
    process.exit(1);
  }
}

markExistingAsNotViewed();
