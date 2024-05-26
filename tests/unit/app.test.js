const request = require('supertest');

// Get our Express app object (we don't need the server part)
const app = require('../../src/app');

describe('test 404 middleware', () => {
  test('should return HTTP 400 response', async () => {
    const res = await request(app).get('/unknownroute273048923');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('not found');
    expect(res.body.error.code).toBe(404);
  });

});
