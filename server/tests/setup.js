// tests/setup.js - Test setup and configuration

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup test database before all tests
beforeAll(async () => {
  try {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the test database
    await mongoose.connect(mongoUri);

    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    process.exit(1);
  }
});

// Clean up database between tests
afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;
    
    // Clear all collections
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from test database:', error);
  }
});

// Global test timeout
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}
