// tests/unit/put.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('PUT /v1/fragments/:id', () => {
  // Unauthenticated requests are denied
  test('unauthenticated requests are denied', () => 
    request(app).put('/v1/fragments/1').expect(401)
  );

  // Requests with incorrect credentials are denied
  test('incorrect credentials are denied', () => 
    request(app).put('/v1/fragments/1').auth('invalid@email.com', 'incorrect_password').expect(401)
  );

  // Fragment not found returns 404
  test('fragment not found returns 404', async () => {
    const res = await request(app)
      .put('/v1/fragments/blahblahblah')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('updated data'));

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });

  // Unsupported media type returns 415
  test('unsupported media type returns 415', async () => {
    // First, create a fragment with a supported type
    const postRequest = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('hello world'));

    const fragmentId = postRequest.body.fragment.id;

    // Attempt to update with an unsupported media type
    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/unsupported')
      .send(Buffer.from('updated data'));

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('unsupported media type');
  });

  
  // Fragment type mismatch returns 400
  test('fragment type mismatch returns 400', async () => {
    
    const postRequest = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('hello world'));

    const fragmentId = postRequest.body.fragment.id;

    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(Buffer.from('<p>updated data</p>'));

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment type did not match');
  });

  // No buffer found in request body returns 400
  test('no buffer found in request body returns 400', async () => {

     const postRequest = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('hello world'));

    const fragmentId = postRequest.body.fragment.id;
      
    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('no buffer found in request body');
  });


  // Successful fragment update
  test('authenticated users can update a fragment successfully', async () => {
    const postRequest = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('hello world'));

    const fragmentId = postRequest.body.fragment.id;

    // Update the fragment
    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('updated data'));

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.id).toBe(fragmentId);
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.body.fragment.size).toBe(Buffer.from('updated data').length);
  });
});
