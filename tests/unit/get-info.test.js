const request = require('supertest');
const { createSuccessResponse } = require('../../src/response');
const app = require('../../src/app'); 

describe('GET /v1/fragments/:id/info', () => {

  test('GET /fragments/:id/info should return fragment info when found', async () => {
    const postRequest = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('hello world'));

    const res = await request(app)
      .get(`/v1/fragments/${postRequest.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(
      JSON.stringify(
        createSuccessResponse({
          fragment: {
            id: postRequest.body.fragment.id,
            ownerId: postRequest.body.fragment.ownerId,
            created: postRequest.body.fragment.created,
            updated: postRequest.body.fragment.updated,
            type: 'text/plain',
            size: 11,
          },
        })
      )
    );

  });

  

  test('GET /fragments/:id should return 404 when fragment not found', async () => {

    const res = await request(app)
      .get(`/v1/fragments/123123/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');

  });

  
});
