// tests/unit/post.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should save a new fragment and return a successful response
  test('authenticated users get a fragments array', async () => {
    const res = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'text/plain')
    .send(Buffer.from('hello world'));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.ownerId).toBeTruthy();
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.body.fragment.created).toBeTruthy();
    expect(res.body.fragment.updated).toBeTruthy();
    expect(res.body.fragment.id).toBeTruthy();
  });

  //testing a post request without data
  test('authenticated users get a fragments array', async () => {
    const res = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'text/plain')
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
  });

  
});
