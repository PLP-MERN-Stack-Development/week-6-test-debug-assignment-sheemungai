# Testing Strategy and Debugging Guide

## Overview

This document provides a comprehensive guide to the testing strategies and debugging techniques implemented for the MERN stack application. The testing approach follows industry best practices and covers unit testing, integration testing, and end-to-end testing with a target code coverage of 70% or higher.

## Testing Architecture

### 1. Unit Testing
- **Framework**: Jest with React Testing Library
- **Location**: `client/src/tests/unit/` and `server/tests/unit/`
- **Purpose**: Test individual components, functions, and modules in isolation

### 2. Integration Testing
- **Framework**: Jest with Supertest
- **Location**: `server/tests/integration/`
- **Purpose**: Test API endpoints and database interactions

### 3. End-to-End Testing
- **Framework**: Cypress
- **Location**: `client/cypress/e2e/`
- **Purpose**: Test complete user workflows and application behavior

## Testing Setup

### Jest Configuration

#### Client-side (React)
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js'
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70
    }
  }
};
```

#### Server-side (Node.js)
```javascript
// jest.config.server.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/server/tests/setup.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/tests/**',
    '!server/coverage/**'
  ]
};
```

### Test Database Setup

```javascript
// server/tests/setup-test-db.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

class TestDatabase {
  constructor() {
    this.mongod = null;
    this.connection = null;
  }

  async connect() {
    this.mongod = await MongoMemoryServer.create();
    const uri = this.mongod.getUri();
    
    this.connection = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    return uri;
  }

  async close() {
    if (this.connection) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (this.mongod) {
      await this.mongod.stop();
    }
  }

  async clear() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

module.exports = TestDatabase;
```

## Testing Examples

### Unit Testing Examples

#### Component Testing (React)
```javascript
// client/src/tests/unit/Button.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../../components/Button/Button';

describe('Button Component', () => {
  test('renders button with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies correct CSS classes for variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });

  test('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### Hook Testing
```javascript
// client/src/tests/unit/useApi.test.js
import { renderHook, act } from '@testing-library/react';
import useApi from '../../hooks/useApi';

// Mock fetch
global.fetch = jest.fn();

describe('useApi Hook', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should handle successful API call', async () => {
    const mockData = { id: 1, name: 'Test' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      const data = await result.current.request('/api/test');
      expect(data).toEqual(mockData);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

#### Utility Function Testing
```javascript
// client/src/tests/unit/helpers.test.js
import { formatDate, truncateText, isValidEmail } from '../../utils/helpers';

describe('Helper Functions', () => {
  describe('formatDate', () => {
    test('formats date correctly', () => {
      const date = new Date('2023-12-01T10:00:00.000Z');
      expect(formatDate(date)).toBe('December 1, 2023');
    });

    test('handles invalid date', () => {
      expect(formatDate(null)).toBe('Invalid Date');
      expect(formatDate('invalid')).toBe('Invalid Date');
    });
  });

  describe('truncateText', () => {
    test('truncates text when longer than maxLength', () => {
      const text = 'This is a very long text that needs to be truncated';
      expect(truncateText(text, 20)).toBe('This is a very long...');
    });

    test('returns original text when shorter than maxLength', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe('Short text');
    });
  });

  describe('isValidEmail', () => {
    test('validates correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });
});
```

### Integration Testing Examples

#### API Endpoint Testing
```javascript
// server/tests/integration/posts.test.js
const request = require('supertest');
const app = require('../../app');
const TestDatabase = require('../setup-test-db');
const User = require('../../models/User');
const Post = require('../../models/Post');

describe('Posts API', () => {
  let testDb;
  let authToken;
  let testUser;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.connect();
  });

  afterAll(async () => {
    await testDb.close();
  });

  beforeEach(async () => {
    await testDb.clear();
    
    // Create test user and get auth token
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
  });

  describe('GET /api/posts', () => {
    test('should return all posts', async () => {
      // Create test posts
      await Post.create([
        {
          title: 'Post 1',
          content: 'Content 1',
          author: testUser._id
        },
        {
          title: 'Post 2',
          content: 'Content 2',
          author: testUser._id
        }
      ]);

      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toBe('Post 1');
    });

    test('should return empty array when no posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/posts', () => {
    test('should create new post', async () => {
      const postData = {
        title: 'New Post',
        content: 'This is a new post content'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(postData.title);
      expect(response.body.data.content).toBe(postData.content);
      expect(response.body.data.author).toBe(testUser._id.toString());
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});
```

### End-to-End Testing Examples

#### User Authentication Flow
```javascript
// client/cypress/e2e/auth.cy.js
describe('Authentication Flow', () => {
  it('should allow complete registration and login flow', () => {
    // Registration
    cy.visit('/register');
    cy.get('[data-testid="username-input"]').type('newuser');
    cy.get('[data-testid="email-input"]').type('newuser@example.com');
    cy.get('[data-testid="password-input"]').type('Password123');
    cy.get('[data-testid="confirm-password-input"]').type('Password123');
    cy.get('[data-testid="first-name-input"]').type('New');
    cy.get('[data-testid="last-name-input"]').type('User');
    
    cy.get('[data-testid="register-button"]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome, New User');
    
    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();
    
    // Login with created account
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('newuser@example.com');
    cy.get('[data-testid="password-input"]').type('Password123');
    cy.get('[data-testid="login-button"]').click();
    
    // Should be logged in
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('contain', 'New User');
  });
});
```

## Debugging Techniques

### 1. Browser Developer Tools

#### Console Debugging
```javascript
// Add debug logs in development
const DEBUG = process.env.NODE_ENV === 'development';

function debugLog(message, data) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}:`, data);
  }
}

// Usage in components
const MyComponent = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    debugLog('Component mounted', { componentName: 'MyComponent' });
    
    fetchData()
      .then(result => {
        debugLog('Data fetched successfully', result);
        setData(result);
      })
      .catch(error => {
        debugLog('Error fetching data', error);
        console.error('Fetch error:', error);
      });
  }, []);

  return <div>{/* component JSX */}</div>;
};
```

#### Network Tab Analysis
```javascript
// Add request/response logging
const apiClient = {
  async request(url, options = {}) {
    const startTime = performance.now();
    
    try {
      console.log(`[API] ${options.method || 'GET'} ${url}`, {
        headers: options.headers,
        body: options.body
      });
      
      const response = await fetch(url, options);
      const endTime = performance.now();
      
      console.log(`[API] Response ${response.status} in ${endTime - startTime}ms`, {
        url,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      console.error(`[API] Error after ${endTime - startTime}ms:`, error);
      throw error;
    }
  }
};
```

### 2. React DevTools

#### Component State Inspection
```javascript
// Add displayName for easier debugging
const Button = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};
Button.displayName = 'Button';

// Add custom hooks with descriptive names
const useApiData = (url) => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });
  
  // Use meaningful variable names for debugging
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (isMounted) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({ data: null, loading: false, error });
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [url]);
  
  return state;
};
useApiData.displayName = 'useApiData';
```

### 3. Error Boundary Implementation

```javascript
// client/src/components/ErrorBoundary/ErrorBoundary.js
import React from 'react';
import { logger } from '../../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    const errorDetails = {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: this.props.userId || 'anonymous'
    };
    
    logger.error('React Error Boundary caught an error:', errorDetails);
    
    // Send error to monitoring service
    this.reportError(errorDetails);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  reportError = async (errorDetails) => {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" data-testid="error-boundary">
          <h2>Something went wrong!</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details (ID: {this.state.errorId})</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
          <div className="error-actions">
            <button 
              onClick={this.handleRetry}
              data-testid="retry-button"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              data-testid="refresh-page-button"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => this.reportError()}
              data-testid="report-error-button"
            >
              Report Error
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 4. Server-Side Debugging

#### Logging Middleware
```javascript
// server/middleware/logging.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mern-app' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id
    });
    
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = { logger, requestLogger };
```

### 5. Performance Monitoring

#### Client-Side Performance
```javascript
// client/src/utils/performance.js
export const performanceMonitor = {
  measureRender: (componentName, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (end - start > 16) { // Longer than one frame (60fps)
      console.warn(`Slow render detected in ${componentName}: ${end - start}ms`);
    }
    
    return result;
  },

  measureAsyncOperation: async (operationName, asyncFn) => {
    const start = performance.now();
    try {
      const result = await asyncFn();
      const end = performance.now();
      
      console.log(`${operationName} completed in ${end - start}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`${operationName} failed after ${end - start}ms:`, error);
      throw error;
    }
  },

  logPageLoad: () => {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      
      console.log('Page Load Performance:', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.navigationStart
      });
    });
  }
};
```

## Testing Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names that explain the expected behavior
- Keep tests focused on a single behavior
- Use beforeEach/afterEach for common setup/cleanup

### 2. Mocking Strategy
```javascript
// Mock external dependencies
jest.mock('axios');
const mockedAxios = axios;

// Mock specific functions
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock modules with custom implementation
jest.mock('../../utils/api', () => ({
  fetchUserData: jest.fn(),
  createPost: jest.fn()
}));
```

### 3. Test Data Management
```javascript
// Use factories for consistent test data
const createTestUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  ...overrides
});

const createTestPost = (overrides = {}) => ({
  id: 1,
  title: 'Test Post',
  content: 'Test content',
  author: createTestUser(),
  createdAt: new Date().toISOString(),
  ...overrides
});
```

### 4. Coverage Goals
- Statements: 70%+
- Branches: 70%+
- Functions: 70%+
- Lines: 70%+

Focus on testing:
- Critical business logic
- Error handling paths
- User interaction flows
- API integrations

## Conclusion

This comprehensive testing and debugging strategy ensures code quality, reliability, and maintainability. The combination of unit, integration, and end-to-end tests provides confidence in the application's behavior across all levels. The debugging techniques and tools outlined here help identify and resolve issues quickly during development and production.

Remember to run tests frequently during development and maintain high test coverage to catch issues early in the development cycle.
