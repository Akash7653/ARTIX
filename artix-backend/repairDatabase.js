/**
 * Database Repair Script
 * Fixes duplicate verification IDs by reassigning sequential numbers
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase';
const client = new MongoClient(MONGODB_URI);

async function fixDatabase() {
  try {
    await client.connect();
    const db = client.db('artix_2026');
    const regCollection = db.collection('registrations');
    const counterCollection = db.collection('counters');
    
    console.log('=== DATABASE REPAIR SCRIPT ===\n');
    
    // Step 1: Find all duplicate verification IDs
    console.log('📋 Step 1: Finding duplicate verification IDs...');
    const duplicates = await regCollection.aggregate([
      { $match: { verification_id: { $exists: true, $ne: null } } },
      { $group: { _id: '$verification_id', count: { $sum: 1 }, ids: { $push: '$registration_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    console.log(`Found ${duplicates.length} duplicate verification ID(s)\n`);
    
    if (duplicates.length > 0) {
      // Step 2: Get all registrations with verification_id, sorted by creation time
      console.log('📋 Step 2: Getting all verified registrations in creation order...');
      const allVerified = await regCollection.find({ 
        verification_id: { $exists: true, $ne: null } 
      }).sort({ verification_id_set_at: 1 }).toArray();
      
      console.log(`Found ${allVerified.length} registrations with verification_id\n`);
      
      // Step 3: Reassign sequential IDs
      console.log('🔄 Step 3: Reassigning sequential verification IDs...');
      
      // Re-initialize counter - delete and recreate
      await counterCollection.deleteOne({ _id: 'verification_id' });
      await counterCollection.insertOne({ _id: 'verification_id', sequence_value: 0 });
      console.log('✓ Counter re-initialized');
      
      let reassignCount = 0;
      for (const reg of allVerified) {
        try {
          // Get next sequence using upsert
          const counterResult = await counterCollection.findOneAndUpdate(
            { _id: 'verification_id' },
            { $inc: { sequence_value: 1 } },
            { returnDocument: 'after', upsert: true }
          );
          
          const nextSeq = counterResult?.value?.sequence_value;
          if (typeof nextSeq !== 'number' || nextSeq < 1) {
            console.error(`  ⚠️ Invalid counter state for ${reg.registration_id}`);
            continue;
          }
          const newVerId = `ARTIX2026-${String(nextSeq).padStart(3, '0')}`;
          
          // Update registration with new ID
          await regCollection.updateOne(
            { registration_id: reg.registration_id },
            { $set: { verification_id: newVerId } }
          );
          
          console.log(`  ✓ ${reg.registration_id}: ${reg.verification_id} → ${newVerId}`);
          reassignCount++;
        } catch (e) {
          console.error(`  ❌ Error: ${e.message}`);
        }
      }
      
      console.log(`\n✅ Reassigned ${reassignCount} verification IDs\n`);
    } else {
      console.log('✅ No duplicates found!\n');
    }
    
    // Step 4: Verify the fix
    console.log('📋 Step 4: Verifying fix...');
    const dupCheck = await regCollection.aggregate([
      { $match: { verification_id: { $exists: true, $ne: null } } },
      { $group: { _id: '$verification_id', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (dupCheck.length === 0) {
      console.log('✅ All verification IDs are now unique!\n');
    } else {
      console.log(`⚠️ Still found ${dupCheck.length} duplicates:\n`, dupCheck);
    }
    
    // Show final state
    const finalCounter = await counterCollection.findOne({ _id: 'verification_id' });
    const finalWithVerId = await regCollection.countDocuments({ verification_id: { $exists: true, $ne: null } });
    
    console.log('=== FINAL STATE ===');
    console.log(`Counter: ${finalCounter.sequence_value}`);
    console.log(`Registrations with verification_id: ${finalWithVerId}`);
    console.log('\n=== REPAIR COMPLETE ===\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

fixDatabase();
