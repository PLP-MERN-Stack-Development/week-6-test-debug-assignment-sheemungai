// cypress/support/commands.js - Custom Cypress commands

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email,
      password,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    const token = response.body.data.token;
    window.localStorage.setItem('authToken', token);
    return response.body.data;
  });
});

// Register command
Cypress.Commands.add('register', (userData) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: userData,
  }).then((response) => {
    expect(response.status).to.eq(201);
    const token = response.body.data.token;
    window.localStorage.setItem('authToken', token);
    return response.body.data;
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('authToken');
});

// Create post command
Cypress.Commands.add('createPost', (postData) => {
  const token = window.localStorage.getItem('authToken');
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/posts`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: postData,
  });
});

// Visit page as authenticated user
Cypress.Commands.add('visitAsUser', (path = '/') => {
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User',
  };

  // Try to login first, if fails then register
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email: userData.email,
      password: userData.password,
    },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      window.localStorage.setItem('authToken', response.body.data.token);
    } else {
      // Register new user
      cy.register(userData);
    }
    cy.visit(path);
  });
});

// Get form validation error
Cypress.Commands.add('getValidationError', () => {
  return cy.get('[data-testid="validation-error"]');
});

// Custom assertion for API responses
Cypress.Commands.add('shouldBeSuccessResponse', (subject) => {
  expect(subject.body).to.have.property('success', true);
  expect(subject.status).to.be.oneOf([200, 201]);
});

// Custom assertion for error responses
Cypress.Commands.add('shouldBeErrorResponse', (subject, expectedStatus = 400) => {
  expect(subject.body).to.have.property('success', false);
  expect(subject.status).to.eq(expectedStatus);
});

// Type with delay (useful for testing real user behavior)
Cypress.Commands.add('typeSlowly', { prevSubject: 'element' }, (subject, text, delay = 100) => {
  return cy.wrap(subject).type(text, { delay });
});

// Wait for API call to complete
Cypress.Commands.add('waitForApi', (alias) => {
  return cy.wait(alias).its('response.statusCode').should('be.oneOf', [200, 201, 204]);
});

// Clear all local storage and cookies
Cypress.Commands.add('cleanUp', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Take screenshot with custom name
Cypress.Commands.add('screenshotWithName', (name) => {
  cy.screenshot(`${Cypress.currentTest.title}-${name}`);
});
