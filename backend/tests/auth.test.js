const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User.model');

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('POST /api/auth/register', () => {
  it('should register a new user and return 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'Test1234' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Test User');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 409 for duplicate email', async () => {
    await User.create({ name: 'First', email: 'dup@example.com', password: 'Test1234' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Second', email: 'dup@example.com', password: 'Test1234' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 422 for invalid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create({ name: 'Login User', email: 'login@example.com', password: 'Login1234' });
  });

  it('should login and return 200 with tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Login1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for nonexistent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noone@example.com', password: 'Login1234' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('should return 401 without a refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/health', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});