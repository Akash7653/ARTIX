import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thrinadhgujjarlapudi_db_user:LsviEx9Ws6LkZ6b4@iot-database.ipijekf.mongodb.net/?appName=IOT-DataBase';

async function findAndDeleteRegistration() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db('artix_2026');
    const registrationsCollection = db.collection('registrations');

    // Search by email
    const registration = await registrationsCollection.findOne({ 
      email: 'thrinadhgujjarlapudi@gmail.com'
    });

    if (!registration) {
      console.log('❌ Registration with email thrinadhgujjarlapudi@gmail.com not found');
      
      // Try to find by name
      const byName = await registrationsCollection.findOne({ 
        full_name: /thrinath/i 
      });
      
      if (byName) {
        console.log('✅ Found by name:');
        console.log(`   ID: ${byName.registration_id}`);
        console.log(`   Name: ${byName.full_name}`);
        console.log(`   Email: ${byName.email}`);
      } else {
        console.log('❌ No registration found with name containing "Thrinath"');
      }
      
      await client.close();
      return;
    }

    console.log(`📋 Found registration:`);
    console.log(`   ID: ${registration.registration_id}`);
    console.log(`   Name: ${registration.full_name}`);
    console.log(`   Email: ${registration.email}`);
    console.log(`   Phone: ${registration.phone}`);
    console.log(`   Status: ${registration.approval_status}`);
    console.log(`   Amount: ₹${registration.total_amount}`);

    // Delete the registration
    const result = await registrationsCollection.deleteOne({ 
      email: 'thrinadhgujjarlapudi@gmail.com'
    });

    if (result.deletedCount > 0) {
      console.log(`\n✅ Successfully deleted registration!`);
      console.log(`   Deletion confirmed: ${result.deletedCount} document(s) removed`);
    } else {
      console.log('❌ Deletion failed');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

findAndDeleteRegistration();
