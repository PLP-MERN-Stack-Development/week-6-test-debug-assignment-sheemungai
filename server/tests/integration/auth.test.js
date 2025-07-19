// tests/integration/auth.test.js - Integration tests for authentication endpoints

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/models/User');

let mongoServer;

// Setup in-memory MongoDB server before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clean up database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toMatchObject({
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user',
      });
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toBeInstanceOf(Array);
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid username', async () => {
      const userData = {
        username: 'ab', // Too short
        email: 'test@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        username: 'testuser1',
        email: 'duplicate@example.com',
        password: 'Password123',
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to create second user with same email
      const duplicateData = {
        username: 'testuser2',
        email: 'duplicate@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('email already exists');
    });

    it('should return 400 for duplicate username', async () => {
      const userData = {
        username: 'duplicateuser',
        email: 'first@example.com',
        password: 'Password123',
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to create second user with same username
      const duplicateData = {
        username: 'duplicateuser',
        email: 'second@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('username already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user for login tests
      const userData = {
        username: 'loginuser',
        email: 'login@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      testUser = res.body.data.user;
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toMatchObject({
        username: 'loginuser',
        email: 'login@example.com',
      });
      expect(res.body.data.user).toHaveProperty('lastLogin');
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        email: 'login@example.com',
        // password missing
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for inactive user', async () => {
      // Deactivate the user
      await User.findByIdAndUpdate(testUser.id, { isActive: false });

      const loginData = {
        email: 'login@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Account is deactivated');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let user;

    beforeEach(async () => {
      // Register and login a user to get token
      const userData = {
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'Password123',
        firstName: 'Profile',
        lastName: 'User',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      token = res.body.data.token;
      user = res.body.data.user;
    });

    it('should return user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User profile retrieved successfully');
      expect(res.body.data.user).toMatchObject({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Access token is required');
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid or expired token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const userData = {
        username: 'updateuser',
        email: 'update@example.com',
        password: 'Password123',
        firstName: 'Update',
        lastName: 'User',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      token = res.body.data.token;
    });

    it('should update user profile successfully', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        profileImage: 'https://example.com/avatar.jpg',
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Profile updated successfully');
      expect(res.body.data.user).toMatchObject(updates);
    });

    it('should ignore non-allowed fields', async () => {
      const updates = {
        firstName: 'Updated',
        email: 'hacker@example.com', // Should be ignored
        role: 'admin', // Should be ignored
        isActive: false, // Should be ignored
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.data.user.firstName).toBe('Updated');
      expect(res.body.data.user.email).toBe('update@example.com'); // Original email
      expect(res.body.data.user.role).toBe('user'); // Original role
    });

    it('should return 401 when not authenticated', async () => {
      const updates = {
        firstName: 'Unauthorized',
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .send(updates);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;

    beforeEach(async () => {
      const userData = {
        username: 'logoutuser',
        email: 'logout@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      token = res.body.data.token;
    });

    it('should logout successfully when authenticated', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logout successful');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
