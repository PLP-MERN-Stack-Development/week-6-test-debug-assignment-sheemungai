// posts.test.js - Integration tests for posts API endpoints

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/auth');

let mongoServer;
let token;
let userId;

// Setup in-memory MongoDB server before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create a test user
  const user = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  });
  userId = user._id;
  token = generateToken(user);
// Clean up after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clean up database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  // Clear all collections except users
  for (const key in collections) {
    const collection = collections[key];
    if (collection.collectionName !== 'users') {
      await collection.deleteMany({});
    }
  }
});

describe('POST /api/posts', () => {
  it('should create a new post when authenticated', async () => {
    const newPost = {
      title: 'New Test Post',
      content: 'This is a new test post content with enough characters to pass validation',
      slug: 'new-test-post',
      category: new mongoose.Types.ObjectId().toString(),
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(newPost);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post).toMatchObject({
      title: newPost.title,
      content: newPost.content,
      slug: newPost.slug,
    });
  });

  it('should return 401 if not authenticated', async () => {
    const newPost = {
      title: 'Unauthorized Post',
      content: 'This should not be created because user is not authenticated',
      slug: 'unauthorized-post',
      category: new mongoose.Types.ObjectId().toString(),
    };

    const res = await request(app)
      .post('/api/posts')
      .send(newPost);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 if validation fails', async () => {
    const invalidPost = {
      // Missing title
      content: 'This post is missing a title',
      slug: 'missing-title',
      category: new mongoose.Types.ObjectId().toString(),
    };

    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidPost);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/posts', () => {
  it('should return all posts with pagination', async () => {
    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('posts');
    expect(res.body.data).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data.posts)).toBe(true);
  });

  it('should handle pagination parameters', async () => {
    const res = await request(app)
      .get('/api/posts?page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      limit: 5,
      total: 0, // No posts created yet
    });
  });
});

describe('GET /api/posts/:id', () => {
  it('should return 400 for invalid ObjectId format', async () => {
    const res = await request(app).get('/api/posts/invalid-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return post data for valid ObjectId', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/posts/${validId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post).toMatchObject({
      id: validId,
      title: 'Sample Post',
    });
  });
});

describe('PUT /api/posts/:id', () => {
  it('should return 401 if not authenticated', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const updates = {
      title: 'Unauthorized Update',
    };

    const res = await request(app)
      .put(`/api/posts/${validId}`)
      .send(updates);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid ObjectId', async () => {
    const updates = {
      title: 'Updated Title',
      content: 'Updated content with enough characters',
    };

    const res = await request(app)
      .put('/api/posts/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should update post with valid data and authentication', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const updates = {
      title: 'Updated Post Title',
      content: 'Updated post content with sufficient length for validation',
    };

    const res = await request(app)
      .put(`/api/posts/${validId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post).toMatchObject({
      id: validId,
      ...updates,
    });
  });
});

describe('DELETE /api/posts/:id', () => {
  it('should return 401 if not authenticated', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/api/posts/${validId}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid ObjectId', async () => {
    const res = await request(app)
      .delete('/api/posts/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should delete post when authenticated', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/posts/${validId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
}); 