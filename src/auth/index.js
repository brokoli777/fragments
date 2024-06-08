// src/auth/index.js

const {HTPASSWD_FILE, AWS_COGNITO_POOL_ID, AWS_COGNITO_CLIENT_ID} = process.env;

// Prefer Amazon Cognito
if (AWS_COGNITO_POOL_ID && AWS_COGNITO_CLIENT_ID) {
  module.exports = require('./cognito');
}
// Also allow for an .htpasswd file to be used, but not in production
else if (HTPASSWD_FILE && process.NODE_ENV !== 'production') {
  module.exports = require('./basic-auth');
}
// In all other cases, we need to stop now and fix our config
else {
  throw new Error('missing env vars: no authorization configuration found');
}
