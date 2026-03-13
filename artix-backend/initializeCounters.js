// Initialize counters collection for verification ID generation
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase';

async function initializeCounters() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const countersCollection = db.collection('counters');
    
    // Check if verification_id counter exists
    const existingCounter = await countersCollection.findOne({ _id: 'verification_id' });
    
    if (!existingCounter) {
      console.log('⚠️ Verification ID counter not found. Creating...');
      
      // Get the current max verification ID from existing registrations
      const registrationsCollection = db.collection('registrations');
      const latestReg = await registrationsCollection.findOne(
        { verification_id: { $exists: true, $ne: null } },
        { sort: { verification_id: -1 } }
      );
      
      let startSequence = 1;
      if (latestReg && latestReg.verification_id) {
        // Extract number from verification_id (e.g., "ARTIX2026-001" -> 1)
        const match = latestReg.verification_id.match(/ARTIX2026-(\d+)/);
        if (match) {
          startSequence = parseInt(match[1]) + 1;
          console.log(`📊 Found latest verification ID: ${latestReg.verification_id}, starting from: ${startSequence}`);
        }
      }
      
      await countersCollection.insertOne({
        _id: 'verification_id',
        sequence_value: startSequence
      });
      
      console.log(`✅ Verification ID counter initialized with sequence: ${startSequence}`);
    } else {
      console.log(`✅ Verification ID counter already exists with sequence: ${existingCounter.sequence_value}`);
    }
    
    console.log('🎉 Counters initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing counters:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the initialization
initializeCounters();
