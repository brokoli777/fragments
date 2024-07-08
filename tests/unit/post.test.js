// tests/unit/post.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('POST /v1/fragments', () => {
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

  // If the Content-Type is not supported, it should return a 415 error
  test('unsupported media type', async () => {
    const res = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'application/unsupported')
    .send(Buffer.from('hello world'));

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('unsupported media type');
  });

  // Location header is being set correctly
  test('successful fragment creation sets Location header', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('hello world'));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.header.location).toBeTruthy();
  });

  // Able to create text/html fragment creation
  test('authenticated users can create text/html fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(Buffer.from('<p>Hello World</p>'));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.ownerId).toBeTruthy();
    expect(res.body.fragment.type).toBe('text/html');
    expect(res.body.fragment.created).toBeTruthy();
    expect(res.body.fragment.updated).toBeTruthy();
    expect(res.body.fragment.id).toBeTruthy();
  });

  // Able to create application/json fragment 
  test('authenticated users can create application/json fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify({ key: 'value' })));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.ownerId).toBeTruthy();
    expect(res.body.fragment.type).toBe('application/json');
    expect(res.body.fragment.created).toBeTruthy();
    expect(res.body.fragment.updated).toBeTruthy();
    expect(res.body.fragment.id).toBeTruthy();
  });

  
});
