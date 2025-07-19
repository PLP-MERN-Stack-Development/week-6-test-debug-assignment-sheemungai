#!/usr/bin/env node
// setup-test-db.js - Script to set up test database

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function setupTestDatabase() {
  try {
    console.log('🚀 Starting test database setup...');
    
    // Create in-memory MongoDB instance
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'test-db',
      },
    });
    
    const mongoUri = mongoServer.getUri();
    console.log('📦 MongoDB Memory Server created at:', mongoUri);
    
    // Connect to the database
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to test database');
    
    // Create test collections and indexes if needed
    const collections = ['users', 'posts', 'comments'];
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.db.collection(collectionName);
      await collection.createIndex({ createdAt: 1 });
      console.log(`📝 Created collection: ${collectionName}`);
    }
    
    // Close connection
    await mongoose.disconnect();
    await mongoServer.stop();
    
    console.log('🎉 Test database setup completed successfully!');
    console.log('');
    console.log('💡 Tips:');
    console.log('- Run "npm test" to run all tests');
    console.log('- Run "npm run test:unit" for unit tests only');
    console.log('- Run "npm run test:integration" for integration tests only');
    console.log('- Run "npm run test:coverage" to see test coverage');
    
  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };
