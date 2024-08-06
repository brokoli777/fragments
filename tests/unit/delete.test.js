// tests/unit/delete.test.js

const request = require('supertest');
const app = require('../../src/app'); 

// jest.mock('../../src/model/fragment');

describe('DELETE /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => 
    request(app).delete('/v1/fragments/1').expect(401)
  );

  // If the wrong username/password pair are invalid, it should not work
  test('incorrect credentials are denied', () => 
    request(app).delete('/v1/fragments/1').auth('hey@email.com', 'badpassweord').expect(401)
  );

  // If the id is not found, it should return a 404 error
  test('fragment not found returns 404', async () => {

    const res = await request(app)
      .delete('/v1/fragments/doesntexistid')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });

  // Authenticated users can delete a fragment successfully
  test('authenticated users can delete a fragment successfully', async () => {
    // create a fragment
    const postRequest = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('yoooooo'));

    const fragmentId = postRequest.body.fragment.id;

    // delete the fragment
    const deleteResponse = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.body.status).toBe('ok');

    // Verify the fragment no longer exists
    const getResponse = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(getResponse.statusCode).toBe(404);
    expect(getResponse.body.status).toBe('error');
    expect(getResponse.body.error.message).toBe('Fragment not found');
  });

});
