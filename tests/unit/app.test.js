const request = require('supertest');

// Get our Express app object (we don't need the server part)
const app = require('../../src/app');

// const { createErrorResponse } = require('../../src/response');

// jest.mock('../../src/response');

describe('test 404 middleware', () => {
  test('should return HTTP 404 response', async () => {
    const res = await request(app).get('/unknownroute273048923');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('not found');
    expect(res.body.error.code).toBe(404);
  });


test('should return server error message', async () => {
  const res = await request(app).get('/v1/fragments/12345').auth('user1@email.com', 'password1');
  expect(res.statusCode).toBe(500);
  expect(res.body.status).toBe('error');
  expect(res.body.error.message).toBe('Fragment not found');
  expect(res.body.error.code).toBe(500);

});

});
