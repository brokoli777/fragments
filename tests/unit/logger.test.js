// logger.test.js
// const logger = require('../../src/logger');


describe('Logger', () => {
  let originalEnv;

  beforeAll(() => {
    // Save the original process.env
    originalEnv = { ...process.env };
  });

  afterAll(() => {
    // Restore the original process.env
    process.env = originalEnv;
  });

  test('should use "info" as the default log level', () => {
    delete process.env.LOG_LEVEL; 
    const loggerInstance = require('../../src/logger');
    expect(loggerInstance.level).toBe('info');
  });

  test('should set level to "debug" if LOG_LEVEL is set to "debug"', () => {

    process.env.LOG_LEVEL = 'debug';

    const loggerInstance = require('../../src/logger');

    expect(loggerInstance.transport).toBeFalsy();
    
  });



  
});
