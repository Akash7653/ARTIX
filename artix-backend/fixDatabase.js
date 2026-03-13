/**
 * Direct Database Fix Script
 * Directly reassigns verification IDs without counter logic
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
    
    console.log('=== DIRECT DATABASE FIX ===\n');
    
    // Get all registrations with verification_id, sorted by creation time
    const allVerified = await regCollection.find({ 
      verification_id: { $exists: true, $ne: null } 
    }).sort({ verification_id_set_at: 1 }).toArray();
    
    console.log(`Found ${allVerified.length} registrations with verification_id\n`);
    
    // Reassign IDs directly
    console.log('🔄 Reassigning verification IDs directly...\n');
    
    let counter = 1;
    for (const reg of allVerified) {
      const newVerId = `ARTIX2026-${String(counter).padStart(3, '0')}`;
      
      const result = await regCollection.updateOne(
        { registration_id: reg.registration_id },
        { $set: { verification_id: newVerId } }
      );
      
      console.log(`  ✓ ${reg.registration_id}: ${reg.verification_id} → ${newVerId}`);
      counter++;
    }
    
    // Update counter to match
    await counterCollection.updateOne(
      { _id: 'verification_id' },
      { $set: { sequence_value: counter - 1 } }
    );
    
    console.log(`\n✅ Reassigned ${allVerified.length} verification IDs`);
    console.log(`✓ Counter updated to ${counter - 1}\n`);
    
    // Verify the fix
    console.log('📋 Verifying fix...\n');
    const dupCheck = await regCollection.aggregate([
      { $match: { verification_id: { $exists: true, $ne: null } } },
      { $group: { _id: '$verification_id', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (dupCheck.length === 0) {
      console.log('✅ All verification IDs are now unique!\n');
    } else {
      console.log(`⚠️ Still found ${dupCheck.length} duplicates`);
    }
    
    // Show final registrations
    const finalRegs = await regCollection.find({ 
      verification_id: { $exists: true, $ne: null } 
    }).sort({ verification_id_set_at: 1 }).toArray();
    
    console.log('Final state:');
    finalRegs.forEach(r => {
      console.log(`  - ${r.registration_id}: ${r.verification_id}`);
    });
    
    const finalCounter = await counterCollection.findOne({ _id: 'verification_id' });
    console.log(`\nCounter value: ${finalCounter?.sequence_value || 'N/A'}`);
    console.log('\n=== FIX COMPLETE ===\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

fixDatabase();
