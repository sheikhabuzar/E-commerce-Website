const request = require('supertest');
const app = require('../app');
const { sequelize, User } = require('../models'); 
require('dotenv').config();

beforeAll(async () => {
  await sequelize.sync({ force: true }); // reset DB before tests
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth Routes', () => {

  const testUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  };

  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'adminpass'
  };

  test('Customer Registration - POST /api/auth/register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Customer registered');
  });

  test('Admin Registration - POST /api/auth/admin/register', async () => {
    const res = await request(app)
      .post('/api/auth/admin/register')
      .send(adminUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Admin registered');
  });

  test('Login with valid credentials - POST /api/auth/login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('Login with invalid credentials - wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('Login with non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'whatever'
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('User not found');
  });
});
