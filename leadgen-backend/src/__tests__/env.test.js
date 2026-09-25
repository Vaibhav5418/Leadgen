describe('Environment Variables Config', () => {
  let originalEnv;
  let exitSpy;
  let consoleSpy;

  beforeAll(() => {
    jest.mock('dotenv', () => ({
      config: jest.fn()
    }));
  });

  beforeEach(() => {
    // Save original process.env
    originalEnv = { ...process.env };
    // Clear it out to prevent pollution
    process.env = {};
    
    // Mock process.exit and console.error
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
    
    // Restore mocks
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
    
    // Clear the require cache for env.js so it re-evaluates
    jest.resetModules();
  });

  it('loads successfully when all required env vars are present', () => {
    process.env.JWT_SECRET = 'test_secret';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    
    // Require should not throw
    const env = require('../config/env');
    
    expect(env.JWT_SECRET).toBe('test_secret');
    expect(env.MONGODB_URI).toBe('mongodb://localhost:27017/test');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('throws and exits if JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    expect(() => {
      require('../config/env');
    }).toThrow('Process exited with code 1');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET is missing'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('throws and exits if MONGODB_URI is missing', () => {
    process.env.JWT_SECRET = 'test_secret';
    delete process.env.MONGODB_URI;

    expect(() => {
      require('../config/env');
    }).toThrow('Process exited with code 1');

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MONGODB_URI is missing'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
