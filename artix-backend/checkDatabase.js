import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase';

async function checkDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db('artix_2026');
    const registrationsCollection = db.collection('registrations');

    // Get count
    const totalCount = await registrationsCollection.countDocuments();
    console.log(`\n📊 Total registrations in database: ${totalCount}`);

    // Get sample registrations
    console.log('\n📋 Sample registrations:');
    const samples = await registrationsCollection.find().limit(5).toArray();
    samples.forEach((reg, index) => {
      console.log(`\n${index + 1}. ${reg.full_name}`);
      console.log(`   ID: ${reg.registration_id}`);
      console.log(`   Email: ${reg.email}`);
      console.log(`   Status: ${reg.approval_status}`);
    });

    // Check for all Rejected registrations
    const rejectedCount = await registrationsCollection.countDocuments({ approval_status: 'rejected' });
    console.log(`\n\n🔴 Total rejected registrations: ${rejectedCount}`);
    
    if (rejectedCount > 0) {
      console.log('\nRejected registrations:');
      const rejected = await registrationsCollection.find({ approval_status: 'rejected' }).toArray();
      rejected.forEach((reg, index) => {
        console.log(`${index + 1}. ${reg.full_name} (${reg.registration_id}) - ${reg.email}`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkDatabase();
