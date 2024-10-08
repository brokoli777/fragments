// tests/unit/auth.test.js

const path = require('path');

describe('Authentication Module Selection', () => {
  beforeAll(() => {
    // Backup original process.env 
    process.env = { ...process.env };
  });

  afterAll(() => {
    // Restore original process.env after testing
    process.env = { ...process.env };
  });


  test('should load Basic Auth module when HTPASSWD_FILE is set and not in production', () => {

    process.env.AWS_COGNITO_POOL_ID = null;
    process.env.AWS_COGNITO_CLIENT_ID = null;
    process.env.HTPASSWD_FILE = path.join(__dirname, 'fake-htpasswd-file');
    process.env.NODE_ENV = 'development'; // Not production

    jest.resetModules();
    
    const authModule = require('../../src/auth');
    expect(authModule).toBe(require('../../src/auth/basic-auth'));
  });

  test('should throw an error if no authorization configuration is found', () => {
    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
    delete process.env.HTPASSWD_FILE;
    process.env.NODE_ENV = 'development';

    jest.resetModules();

    expect(() => require('../../src/auth')).toThrow('missing env vars: no authorization configuration found');
  });


});
