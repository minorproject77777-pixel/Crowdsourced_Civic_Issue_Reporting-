process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let app;
let Department;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);

  app = require('../src/app');
  Department = require('../src/models/Department');
}, 60000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('Auth', () => {
  test('registers a new citizen', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Asha Verma',
      email: 'asha@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('citizen');
  });

  test('rejects duplicate email registration', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Asha Verma 2',
      email: 'asha@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'asha@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'asha@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  test('rejects unauthenticated access to /me', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Issue workflow', () => {
  let citizenToken;
  let adminToken;
  let staffToken;
  let staffId;
  let departmentId;
  let issueMongoId;

  beforeAll(async () => {
    const citizen = await request(app).post('/api/auth/register').send({
      name: 'Ravi Kumar',
      email: 'ravi@example.com',
      password: 'password123',
    });
    citizenToken = citizen.body.token;

    const adminUser = await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
    });
    // manually promote to admin for test purposes
    const User = require('../src/models/User');
    await User.findByIdAndUpdate(adminUser.body.user.id, { role: 'admin' });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });
    adminToken = adminLogin.body.token;

    const dept = await Department.create({ name: 'Road Maintenance' });
    departmentId = dept._id.toString();
    const Category = require('../src/models/Category');
    await Category.create({ name: 'Road Maintenance Request' });

    const staffUser = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Staff One', email: 'staff@example.com', password: 'password123', role: 'staff' });
    staffId = staffUser.body.user.id;

    const staffLogin = await request(app).post('/api/auth/login').send({
      email: 'staff@example.com',
      password: 'password123',
    });
    staffToken = staffLogin.body.token;
  });

  test('rejects an issue category that is not active in the database', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Test issue',
        description: 'Issue with an unknown category',
        category: 'Unknown category',
        latitude: 21.2514,
        longitude: 81.6296,
        address: 'MG Road, Raipur',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid issue category/i);
  });

  test('citizen creates an issue with a database category', async () => {
    const res = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('title', 'Large pothole on MG Road')
      .field('description', 'A dangerous pothole causing accidents near the bus stop')
      .field('category', 'Road Maintenance Request')
      .field('latitude', '21.2514')
      .field('longitude', '81.6296')
      .field('address', 'MG Road, Raipur');

    expect(res.status).toBe(201);
    expect(res.body.issue.issueId).toMatch(/^CF-\d+$/);
    expect(res.body.issue.status).toBe('REPORTED');
    expect(res.body.issue.priority).toBeDefined();
    issueMongoId = res.body.issue._id;
  });

  test('fetches the created issue by id', async () => {
    const res = await request(app).get(`/api/issues/${issueMongoId}`);
    expect(res.status).toBe(200);
    expect(res.body.issue.title).toBe('Large pothole on MG Road');
  });

  test('citizen upvotes the issue (and cannot do it twice)', async () => {
    const first = await request(app)
      .post(`/api/issues/${issueMongoId}/upvote`)
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(first.status).toBe(200);
    expect(first.body.upvoteCount).toBe(1);

    const second = await request(app)
      .post(`/api/issues/${issueMongoId}/upvote`)
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(second.status).toBe(409);
  });

  test('citizen comments on the issue', async () => {
    const res = await request(app)
      .post(`/api/issues/${issueMongoId}/comments`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ text: 'This has been here for weeks.' });
    expect(res.status).toBe(201);
    expect(res.body.comment.text).toBe('This has been here for weeks.');
  });

  test('non-admin cannot assign an issue', async () => {
    const res = await request(app)
      .post(`/api/issues/${issueMongoId}/assign`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ departmentId, staffId });
    expect(res.status).toBe(403);
  });

  test('admin cannot mark an issue assigned without selecting staff', async () => {
    const res = await request(app)
      .post(`/api/issues/${issueMongoId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ departmentId });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/select a staff member/i);
  });

  test('admin assigns issue to department and staff', async () => {
    const res = await request(app)
      .post(`/api/issues/${issueMongoId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ departmentId, staffId });
    expect(res.status).toBe(200);
    expect(res.body.issue.status).toBe('ASSIGNED');
  });

  test('staff sees the task in their list', async () => {
    const res = await request(app).get('/api/staff/tasks').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBe(1);
  });

  test('admin moves the issue to RESOLVED', async () => {
    const res = await request(app)
      .post(`/api/issues/${issueMongoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });
    expect(res.status).toBe(200);
    expect(res.body.issue.status).toBe('RESOLVED');
    expect(res.body.issue.resolvedAt).toBeTruthy();
  });

  test('citizen verifies resolution as fixed', async () => {
    const res = await request(app)
      .post(`/api/issues/${issueMongoId}/verify`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ confirmed: true, rating: 5, comment: 'Great job!' });
    expect(res.status).toBe(200);
    expect(res.body.issue.citizenRating).toBe(5);
  });

  test('reopen flow: citizen reports it is NOT actually fixed', async () => {
    // move back to RESOLVED to test the "still exists" branch
    await request(app)
      .post(`/api/issues/${issueMongoId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });

    const res = await request(app)
      .post(`/api/issues/${issueMongoId}/verify`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ confirmed: false, reasonIfNotFixed: 'The pothole is still there.' });

    expect(res.status).toBe(200);
    expect(res.body.issue.status).toBe('REOPENED');
    expect(res.body.issue.reopenCount).toBe(1);
  });

  test('unauthenticated request cannot create an issue', async () => {
    const res = await request(app).post('/api/issues').field('title', 'x');
    expect(res.status).toBe(401);
  });
});
