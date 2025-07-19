// cypress/e2e/auth.cy.js - E2E tests for authentication

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clean up before each test
    cy.cleanUp();
    
    // Intercept API calls for better test control
    cy.intercept('POST', '**/api/auth/register').as('registerRequest');
    cy.intercept('POST', '**/api/auth/login').as('loginRequest');
    cy.intercept('GET', '**/api/auth/me').as('profileRequest');
  });

  describe('User Registration', () => {
    it('should allow user to register successfully', () => {
      cy.visit('/register');
      
      // Fill registration form
      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('Password123');
      cy.get('[data-testid="confirm-password-input"]').type('Password123');
      cy.get('[data-testid="first-name-input"]').type('Test');
      cy.get('[data-testid="last-name-input"]').type('User');
      
      // Submit form
      cy.get('[data-testid="register-button"]').click();
      
      // Wait for API call
      cy.waitForApi('@registerRequest');
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome, Test User');
    });

    it('should show validation errors for invalid input', () => {
      cy.visit('/register');
      
      // Try to submit empty form
      cy.get('[data-testid="register-button"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="validation-error"]').should('be.visible');
      cy.get('[data-testid="username-error"]').should('contain', 'Username is required');
      cy.get('[data-testid="email-error"]').should('contain', 'Email is required');
      cy.get('[data-testid="password-error"]').should('contain', 'Password is required');
    });

    it('should validate email format', () => {
      cy.visit('/register');
      
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="register-button"]').click();
      
      cy.get('[data-testid="email-error"]').should('contain', 'Please enter a valid email');
    });

    it('should validate password strength', () => {
      cy.visit('/register');
      
      cy.get('[data-testid="password-input"]').type('weak');
      cy.get('[data-testid="register-button"]').click();
      
      cy.get('[data-testid="password-error"]').should('contain', 'Password must contain');
    });

    it('should validate password confirmation match', () => {
      cy.visit('/register');
      
      cy.get('[data-testid="password-input"]').type('Password123');
      cy.get('[data-testid="confirm-password-input"]').type('DifferentPassword');
      cy.get('[data-testid="register-button"]').click();
      
      cy.get('[data-testid="confirm-password-error"]').should('contain', 'Passwords do not match');
    });

    it('should handle server errors gracefully', () => {
      // Simulate server error
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Email already exists',
        },
      }).as('registerError');
      
      cy.visit('/register');
      
      // Fill valid form
      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="email-input"]').type('existing@example.com');
      cy.get('[data-testid="password-input"]').type('Password123');
      cy.get('[data-testid="confirm-password-input"]').type('Password123');
      
      cy.get('[data-testid="register-button"]').click();
      cy.wait('@registerError');
      
      // Should show server error
      cy.get('[data-testid="server-error"]').should('contain', 'Email already exists');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      // Create a test user via API
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/register`,
        body: {
          username: 'loginuser',
          email: 'login@example.com',
          password: 'Password123',
          firstName: 'Login',
          lastName: 'User',
        },
      });
    });

    it('should allow user to login successfully', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('login@example.com');
      cy.get('[data-testid="password-input"]').type('Password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.waitForApi('@loginRequest');
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('contain', 'Login User');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('login@example.com');
      cy.get('[data-testid="password-input"]').type('WrongPassword');
      cy.get('[data-testid="login-button"]').click();
      
      cy.wait('@loginRequest');
      
      cy.get('[data-testid="login-error"]').should('contain', 'Invalid credentials');
      cy.url().should('include', '/login'); // Should stay on login page
    });

    it('should remember user session', () => {
      // Login
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('login@example.com');
      cy.get('[data-testid="password-input"]').type('Password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.waitForApi('@loginRequest');
      
      // Reload page
      cy.reload();
      
      // Should still be logged in
      cy.url().should('include', '/dashboard');
    });

    it('should allow user to logout', () => {
      // Login first
      cy.login('login@example.com', 'Password123');
      cy.visit('/dashboard');
      
      // Logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Should redirect to home
      cy.url().should('not.include', '/dashboard');
      cy.get('[data-testid="login-link"]').should('be.visible');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-testid="login-required-message"]')
        .should('contain', 'Please log in to access this page');
    });

    it('should allow authenticated users to access protected routes', () => {
      cy.visitAsUser('/dashboard');
      
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
    });
  });

  describe('User Profile', () => {
    beforeEach(() => {
      cy.visitAsUser('/profile');
    });

    it('should display user profile information', () => {
      cy.wait('@profileRequest');
      
      cy.get('[data-testid="profile-username"]').should('contain', 'testuser');
      cy.get('[data-testid="profile-email"]').should('contain', 'test@example.com');
      cy.get('[data-testid="profile-name"]').should('contain', 'Test User');
    });

    it('should allow profile updates', () => {
      cy.intercept('PUT', '**/api/auth/profile').as('updateProfile');
      
      cy.get('[data-testid="edit-profile-button"]').click();
      
      // Update profile
      cy.get('[data-testid="first-name-input"]').clear().type('Updated');
      cy.get('[data-testid="last-name-input"]').clear().type('Name');
      cy.get('[data-testid="save-profile-button"]').click();
      
      cy.waitForApi('@updateProfile');
      
      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'Profile updated successfully');
      
      // Should display updated information
      cy.get('[data-testid="profile-name"]').should('contain', 'Updated Name');
    });
  });
});
