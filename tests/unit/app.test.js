const request = require('supertest');

// Get our Express app object (we don't need the server part)
const app = require('../../src/app');

const { Fragment } = require('../../src/model/fragment');

jest.mock('../../src/model/fragment');

describe('test app error handling', () => {
  test('should return HTTP 404 response', async () => {
    const res = await request(app).get('/unknownroute273048923');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('not found');
    expect(res.body.error.code).toBe(404);
  });


  test('should return HTTP 500 response', async () => {
    //Mocking to get an error
    Fragment.byId.mockImplementation(() => {
      throw new Error('Internal Server Error');
    });

    const res = await request(app).get('/v1/fragments/12345').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Internal Server Error');
    expect(res.body.error.code).toBe(500);
  });

});
