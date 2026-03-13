import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase';
const client = new MongoClient(MONGODB_URI);

async function checkDb() {
  try {
    await client.connect();
    const db = client.db('artix_2026');
    const regCollection = db.collection('registrations');
    const counterCollection = db.collection('counters');
    
    console.log('=== CHECKING DATABASE ISSUES ===\n');
    
    // Check counter status
    const counter = await counterCollection.findOne({ _id: 'verification_id' });
    console.log('✓ Counter status:', counter);
    
    // Check all registrations with verification_id
    const withVerId = await regCollection.countDocuments({ verification_id: { $exists: true, $ne: null } });
    console.log('✓ Registrations with verification_id:', withVerId);
    
    // Check for duplicate verification IDs
    const dup = await regCollection.aggregate([
      { $match: { verification_id: { $exists: true, $ne: null } } },
      { $group: { _id: '$verification_id', count: { $sum: 1 }, ids: { $push: '$registration_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    console.log('\n✓ Duplicate verification IDs found:', dup.length);
    if (dup.length > 0) {
      console.log('Examples:');
      dup.slice(0, 5).forEach(d => {
        console.log(`  - ID: ${d._id}, Registrations: ${d.ids.join(', ')}`);
      });
    }
    
    // Check if there are registrations with empty/null verification_id but approved
    const approvedNoId = await regCollection.countDocuments({ 
      approval_status: 'approved',
      verification_id: { $in: [null, ''] }
    });
    console.log('\n✓ Approved but no verification_id:', approvedNoId);
    
    // Show sample of recent registrations
    const recent = await regCollection.find({}).sort({ created_at: -1 }).limit(5).toArray();
    console.log('\n✓ Recent registrations (showing approval_status & verification_id):');
    recent.forEach(r => {
      console.log(`  - ${r.registration_id}: approval=${r.approval_status}, verId=${r.verification_id || 'null'}`);
    });
    
    console.log('\n=== CHECKS COMPLETE ===');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

checkDb();
