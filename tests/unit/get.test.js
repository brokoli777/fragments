// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  // Test for getting a fragment by id
  test('authenticated users can get a fragment by id', async () => {

    const postRequest = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'text/plain')
    .send(Buffer.from('hello world'));

    const res = await request(app).get(`/v1/fragments/${postRequest.body.fragment.id}`).auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('hello world');
  });

  test('authenticated users can get a fragment by id with .txt extension', async () => {
    const postRequest = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'text/plain')
    .send(Buffer.from('test 123'));

    const res = await request(app).get(`/v1/fragments/${postRequest.body.fragment.id}.txt`).auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(res.headers['content-disposition']).toBe('attachment; filename="fragment.txt"');
    expect(res.text).toBe('test 123');
  });

  test('error when fragment cannot be converted to .txt', async () => {
    const postRequest = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'text/plain')
    .send(Buffer.from('hihihi'));

    const res = await request(app).get(`/v1/fragments/${postRequest.body.fragment.id}.html`).auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Not allowed to convert to specified format');
  });

  
});
