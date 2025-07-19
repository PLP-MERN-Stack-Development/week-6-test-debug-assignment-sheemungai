// cypress/e2e/error-handling.cy.js - E2E tests for error handling scenarios

describe('Error Handling and Edge Cases', () => {
  beforeEach(() => {
    cy.cleanUp();
  });

  describe('Network Error Handling', () => {
    it('should handle network connection errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '**/api/posts', { forceNetworkError: true }).as('networkError');
      
      cy.visitAsUser('/posts');
      cy.wait('@networkError');
      
      cy.get('[data-testid="error-boundary"]').should('be.visible');
      cy.get('[data-testid="network-error-message"]')
        .should('contain', 'Network connection error');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should allow retry after network error', () => {
      // First call fails
      cy.intercept('GET', '**/api/posts', { forceNetworkError: true }).as('networkError');
      
      cy.visitAsUser('/posts');
      cy.wait('@networkError');
      
      // Setup successful retry
      cy.intercept('GET', '**/api/posts', { fixture: 'posts.json' }).as('retrySuccess');
      
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@retrySuccess');
      
      cy.get('[data-testid="posts-list"]').should('be.visible');
      cy.get('[data-testid="error-boundary"]').should('not.exist');
    });

    it('should handle slow network connections', () => {
      // Simulate slow network
      cy.intercept('GET', '**/api/posts', {
        delay: 10000,
        fixture: 'posts.json',
      }).as('slowRequest');
      
      cy.visitAsUser('/posts');
      
      // Should show loading state
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      
      // Should show timeout warning after some time
      cy.get('[data-testid="slow-connection-warning"]', { timeout: 8000 })
        .should('be.visible')
        .should('contain', 'This is taking longer than expected');
      
      // Cancel the slow request to prevent actual timeout
      cy.get('[data-testid="cancel-request-button"]').click();
    });
  });

  describe('Server Error Responses', () => {
    it('should handle 500 internal server errors', () => {
      cy.intercept('GET', '**/api/posts', {
        statusCode: 500,
        body: {
          success: false,
          message: 'Internal server error',
        },
      }).as('serverError');
      
      cy.visitAsUser('/posts');
      cy.wait('@serverError');
      
      cy.get('[data-testid="server-error-message"]')
        .should('contain', 'Something went wrong on our end');
      cy.get('[data-testid="error-details"]')
        .should('contain', 'Internal server error');
    });

    it('should handle 404 resource not found errors', () => {
      cy.intercept('GET', '**/api/posts/nonexistent', {
        statusCode: 404,
        body: {
          success: false,
          message: 'Post not found',
        },
      }).as('notFound');
      
      cy.visitAsUser('/posts/nonexistent');
      cy.wait('@notFound');
      
      cy.get('[data-testid="not-found-error"]')
        .should('contain', 'The requested content was not found');
      cy.get('[data-testid="go-back-button"]').should('be.visible');
    });

    it('should handle 403 permission errors', () => {
      cy.intercept('PUT', '**/api/posts/*', {
        statusCode: 403,
        body: {
          success: false,
          message: 'You do not have permission to edit this post',
        },
      }).as('permissionError');
      
      cy.createPost('Other User Post', 'Content by another user').then((response) => {
        const postId = response.body.data.id;
        cy.visitAsUser(`/posts/${postId}/edit`);
        
        // Try to update
        cy.get('[data-testid="post-title-input"]').clear().type('Updated Title');
        cy.get('[data-testid="update-post-button"]').click();
        
        cy.wait('@permissionError');
        
        cy.get('[data-testid="permission-error"]')
          .should('contain', 'You do not have permission');
      });
    });

    it('should handle 401 authentication errors', () => {
      cy.intercept('GET', '**/api/posts', {
        statusCode: 401,
        body: {
          success: false,
          message: 'Authentication required',
        },
      }).as('authError');
      
      cy.visit('/posts');
      cy.wait('@authError');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-testid="auth-required-message"]')
        .should('contain', 'Please log in to continue');
    });
  });

  describe('Client-Side Error Handling', () => {
    it('should handle JavaScript runtime errors', () => {
      // Visit a page that will trigger an error
      cy.visit('/posts');
      
      // Trigger a runtime error by calling undefined method
      cy.window().then((win) => {
        // Simulate a runtime error
        win.triggerError = () => {
          throw new Error('Simulated runtime error');
        };
        win.triggerError();
      });
      
      // Error boundary should catch it
      cy.get('[data-testid="error-boundary"]').should('be.visible');
      cy.get('[data-testid="error-message"]')
        .should('contain', 'Something went wrong');
      cy.get('[data-testid="error-details"]')
        .should('contain', 'Simulated runtime error');
    });

    it('should provide error reporting functionality', () => {
      cy.visit('/posts');
      
      // Simulate an error
      cy.window().then((win) => {
        throw new Error('Test error for reporting');
      });
      
      cy.get('[data-testid="error-boundary"]').should('be.visible');
      cy.get('[data-testid="report-error-button"]').should('be.visible');
      
      // Mock error reporting API
      cy.intercept('POST', '**/api/error-reports', {
        statusCode: 200,
        body: { success: true },
      }).as('errorReport');
      
      cy.get('[data-testid="report-error-button"]').click();
      cy.wait('@errorReport');
      
      cy.get('[data-testid="error-reported-message"]')
        .should('contain', 'Error reported successfully');
    });

    it('should handle component rendering errors', () => {
      // Create a component that will fail to render
      cy.visit('/posts');
      
      // Mock a post with invalid data that causes rendering error
      cy.intercept('GET', '**/api/posts', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            {
              id: 1,
              title: null, // This might cause a rendering error
              content: 'Content',
              author: null,
            },
          ],
        },
      }).as('invalidData');
      
      cy.reload();
      cy.wait('@invalidData');
      
      // Should handle gracefully
      cy.get('[data-testid="error-boundary"]').should('be.visible');
      cy.get('[data-testid="refresh-page-button"]').should('be.visible');
    });
  });

  describe('Form Validation Errors', () => {
    it('should handle real-time validation errors', () => {
      cy.visit('/register');
      
      // Enter invalid email and check real-time validation
      cy.get('[data-testid="email-input"]').type('invalid-email').blur();
      cy.get('[data-testid="email-error"]')
        .should('be.visible')
        .should('contain', 'Please enter a valid email');
      
      // Fix the email
      cy.get('[data-testid="email-input"]').clear().type('valid@example.com').blur();
      cy.get('[data-testid="email-error"]').should('not.exist');
    });

    it('should handle server validation errors', () => {
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 422,
        body: {
          success: false,
          message: 'Validation failed',
          errors: {
            email: 'Email already exists',
            username: 'Username must be unique',
          },
        },
      }).as('validationError');
      
      cy.visit('/register');
      
      // Fill form with invalid data
      cy.get('[data-testid="username-input"]').type('existinguser');
      cy.get('[data-testid="email-input"]').type('existing@example.com');
      cy.get('[data-testid="password-input"]').type('Password123');
      cy.get('[data-testid="confirm-password-input"]').type('Password123');
      cy.get('[data-testid="first-name-input"]').type('Test');
      cy.get('[data-testid="last-name-input"]').type('User');
      
      cy.get('[data-testid="register-button"]').click();
      cy.wait('@validationError');
      
      // Should display server validation errors
      cy.get('[data-testid="email-error"]').should('contain', 'Email already exists');
      cy.get('[data-testid="username-error"]').should('contain', 'Username must be unique');
    });
  });

  describe('Rate Limiting and Quota Errors', () => {
    it('should handle rate limit errors', () => {
      cy.intercept('POST', '**/api/posts', {
        statusCode: 429,
        body: {
          success: false,
          message: 'Too many requests',
          retryAfter: 60,
        },
      }).as('rateLimitError');
      
      cy.visitAsUser('/posts/create');
      
      // Fill and submit form
      cy.get('[data-testid="post-title-input"]').type('Rate Limited Post');
      cy.get('[data-testid="post-content-textarea"]').type('Content for rate limit test');
      cy.get('[data-testid="create-post-button"]').click();
      
      cy.wait('@rateLimitError');
      
      cy.get('[data-testid="rate-limit-error"]')
        .should('contain', 'Too many requests');
      cy.get('[data-testid="retry-after-message"]')
        .should('contain', 'Please try again in 60 seconds');
      
      // Should show countdown timer
      cy.get('[data-testid="countdown-timer"]').should('be.visible');
    });
  });

  describe('Offline Handling', () => {
    it('should handle offline state', () => {
      cy.visitAsUser('/posts');
      
      // Simulate going offline
      cy.window().then((win) => {
        win.navigator.onLine = false;
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.get('[data-testid="offline-banner"]')
        .should('be.visible')
        .should('contain', 'You are currently offline');
      
      // Try to create a post while offline
      cy.visit('/posts/create');
      cy.get('[data-testid="post-title-input"]').type('Offline Post');
      cy.get('[data-testid="post-content-textarea"]').type('Created while offline');
      cy.get('[data-testid="create-post-button"]').click();
      
      cy.get('[data-testid="offline-queue-message"]')
        .should('contain', 'Post will be saved when you come back online');
      
      // Simulate coming back online
      cy.window().then((win) => {
        win.navigator.onLine = true;
        win.dispatchEvent(new Event('online'));
      });
      
      cy.get('[data-testid="online-banner"]')
        .should('be.visible')
        .should('contain', 'You are back online');
      
      // Should attempt to sync offline actions
      cy.get('[data-testid="syncing-message"]')
        .should('contain', 'Syncing offline changes');
    });
  });

  describe('Recovery Actions', () => {
    it('should provide clear recovery options for different error types', () => {
      // Test refresh page option
      cy.intercept('GET', '**/api/posts', {
        statusCode: 500,
        body: { success: false, message: 'Server error' },
      }).as('serverError');
      
      cy.visitAsUser('/posts');
      cy.wait('@serverError');
      
      cy.get('[data-testid="refresh-page-button"]').should('be.visible');
      
      // Test go back option
      cy.get('[data-testid="go-back-button"]').should('be.visible');
      
      // Test contact support option
      cy.get('[data-testid="contact-support-button"]').should('be.visible');
      
      // Click contact support
      cy.get('[data-testid="contact-support-button"]').click();
      cy.get('[data-testid="support-modal"]').should('be.visible');
      cy.get('[data-testid="error-details-form"]').should('be.visible');
    });

    it('should maintain user context during error recovery', () => {
      cy.visitAsUser('/posts/create');
      
      // Fill form
      cy.get('[data-testid="post-title-input"]').type('Recovery Test Post');
      cy.get('[data-testid="post-content-textarea"]').type('Content for recovery test');
      
      // Simulate error during save
      cy.intercept('POST', '**/api/posts', {
        statusCode: 500,
        body: { success: false, message: 'Save failed' },
      }).as('saveError');
      
      cy.get('[data-testid="create-post-button"]').click();
      cy.wait('@saveError');
      
      // Error should appear but form content should be preserved
      cy.get('[data-testid="save-error"]').should('be.visible');
      cy.get('[data-testid="post-title-input"]')
        .should('have.value', 'Recovery Test Post');
      cy.get('[data-testid="post-content-textarea"]')
        .should('contain.value', 'Content for recovery test');
      
      // Should offer to save as draft
      cy.get('[data-testid="save-as-draft-button"]').should('be.visible');
    });
  });
});
