# Week 6 Testing and Debugging Assignment - Demonstration Script

## Overview
This script demonstrates how to run all the tests and verify the implementation meets the assignment requirements.

## Prerequisites
Make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (for integration tests)
- Git

## Setup Instructions

### 1. Install Dependencies

#### Server Dependencies
```bash
cd server
npm install
```

#### Client Dependencies
```bash
cd client
npm install
```

### 2. Environment Configuration

Create `.env` file in the server directory:
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
MONGODB_URI=mongodb://localhost:27017/mern_test_app
```

### 3. Database Setup (for development)
```bash
# Start MongoDB service
# On Windows: net start MongoDB
# On macOS: brew services start mongodb/brew/mongodb-community
# On Linux: sudo systemctl start mongod

# Create test database
cd server
npm run setup-test-db
```

## Running Tests

### 1. Unit Tests

#### Server Unit Tests
```bash
cd server
npm run test:unit
```
Expected Output:
- Tests for authentication utilities
- Tests for logging functionality
- Tests for middleware functions
- Coverage report showing 70%+ coverage

#### Client Unit Tests
```bash
cd client
npm test
```
Expected Output:
- Button component tests (8 tests)
- ErrorBoundary component tests (6 tests)
- useApi hook tests (5 tests)
- Helper function tests (6 tests)
- Coverage report showing 70%+ coverage

### 2. Integration Tests

#### API Integration Tests
```bash
cd server
npm run test:integration
```
Expected Output:
- Authentication endpoints tests (6 tests)
- Posts CRUD operations tests (8 tests)
- Database integration tests
- All tests should pass with proper cleanup

### 3. End-to-End Tests

#### Setup E2E Testing
```bash
cd client
npx cypress install
```

#### Run E2E Tests (Headless)
```bash
cd client
npx cypress run
```

#### Run E2E Tests (Interactive)
```bash
cd client
npx cypress open
```

Expected E2E Test Coverage:
- Authentication flow (registration, login, logout)
- Posts management (create, read, update, delete)
- Navigation and user experience
- Error handling scenarios

### 4. All Tests Together
```bash
# Run comprehensive test suite
cd server && npm run test:all
cd client && npm run test:coverage
cd client && npx cypress run
```

## Debugging Demonstrations

### 1. Browser DevTools
1. Start the development server:
   ```bash
   cd client && npm start
   cd server && npm run dev
   ```

2. Open browser to `http://localhost:3000`
3. Open DevTools (F12)
4. Demonstrate:
   - Console logging for debugging
   - Network tab for API calls
   - React DevTools for component state
   - Performance tab for optimization

### 2. Error Boundary Testing
1. Navigate to a component
2. Trigger an error (modify code temporarily)
3. Observe error boundary catching and displaying error
4. Test recovery actions (retry, refresh)

### 3. API Error Handling
1. Stop the server
2. Try to perform actions that require API calls
3. Observe graceful error handling
4. Restart server and test retry functionality

## Performance Testing

### 1. Load Testing (if implemented)
```bash
# Using the created load test script
cd client
node load-test-script.js
```

### 2. Performance Monitoring
- Check browser Performance tab
- Monitor memory usage
- Test on different devices/screen sizes

## Code Coverage Verification

### Generate Coverage Reports
```bash
# Server coverage
cd server && npm run test:coverage

# Client coverage  
cd client && npm run test:coverage
```

### View Coverage Reports
- Server: Open `server/coverage/lcov-report/index.html`
- Client: Open `client/coverage/lcov-report/index.html`

Expected Coverage Metrics:
- Statements: 70%+
- Branches: 70%+  
- Functions: 70%+
- Lines: 70%+

## Assignment Requirements Checklist

### ✅ Task 1: Jest Testing Framework Setup
- [x] Jest configured for both client and server
- [x] Test scripts added to package.json
- [x] Coverage thresholds set to 70%
- [x] Test environment properly configured

### ✅ Task 2: Unit Testing with React Testing Library
- [x] Button component tests (8 tests)
- [x] ErrorBoundary component tests (6 tests) 
- [x] useApi custom hook tests (5 tests)
- [x] Utility function tests (6 tests)
- [x] Server utility tests (auth, logger, middleware)

### ✅ Task 3: Integration Testing with Supertest
- [x] Authentication API tests (6 tests)
- [x] Posts CRUD API tests (8 tests)
- [x] Database integration tests
- [x] MongoDB Memory Server for test isolation

### ✅ Task 4: End-to-End Testing with Cypress
- [x] Cypress configuration and setup
- [x] Authentication flow tests
- [x] Posts management tests
- [x] Navigation and UX tests
- [x] Error handling scenarios
- [x] Custom commands and utilities

### ✅ Task 5: Debugging Techniques and Tools
- [x] Error boundary implementation
- [x] Console debugging strategies
- [x] Network debugging techniques
- [x] Performance monitoring
- [x] Browser DevTools usage examples

### ✅ Code Coverage Requirements
- [x] 70%+ statement coverage
- [x] 70%+ branch coverage
- [x] 70%+ function coverage
- [x] 70%+ line coverage

## Troubleshooting

### Common Issues and Solutions

#### 1. MongoDB Connection Issues
```bash
# Check MongoDB status
# Windows: sc query MongoDB
# macOS: brew services list | grep mongodb
# Linux: sudo systemctl status mongod

# Restart MongoDB if needed
# Windows: net stop MongoDB && net start MongoDB
# macOS: brew services restart mongodb/brew/mongodb-community
# Linux: sudo systemctl restart mongod
```

#### 2. Port Conflicts
- Server runs on port 5000
- Client runs on port 3000
- Cypress expects these default ports
- Change ports in package.json scripts if needed

#### 3. Test Database Issues
```bash
# Clear test database
cd server
npm run setup-test-db
```

#### 4. Dependency Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Performance Benchmarks

Expected performance metrics:
- Page load time: < 2 seconds
- API response time: < 500ms
- Test execution time: < 30 seconds for unit tests
- E2E test suite: < 5 minutes

## Security Considerations

- JWT tokens expire after 24 hours
- Password hashing with bcryptjs
- Input validation on all endpoints
- CORS configured properly
- Helmet middleware for security headers

## Conclusion

This comprehensive testing implementation demonstrates:
1. **Professional Testing Practices**: Complete test coverage across unit, integration, and E2E levels
2. **Debugging Proficiency**: Multiple debugging techniques and tools
3. **Code Quality**: High test coverage and error handling
4. **Performance Awareness**: Monitoring and optimization strategies
5. **Real-world Application**: Practical MERN stack testing approach

The implementation exceeds the 70% coverage requirement and provides a robust foundation for maintaining code quality in a production environment.
