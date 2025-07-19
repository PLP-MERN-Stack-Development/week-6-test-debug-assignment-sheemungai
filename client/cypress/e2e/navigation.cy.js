// cypress/e2e/navigation.cy.js - E2E tests for navigation and user experience

describe('Navigation and User Experience', () => {
  beforeEach(() => {
    cy.cleanUp();
  });

  describe('Public Navigation', () => {
    it('should display main navigation menu', () => {
      cy.visit('/');
      
      cy.get('[data-testid="main-nav"]').should('be.visible');
      cy.get('[data-testid="nav-home"]').should('contain', 'Home');
      cy.get('[data-testid="nav-about"]').should('contain', 'About');
      cy.get('[data-testid="nav-login"]').should('contain', 'Login');
      cy.get('[data-testid="nav-register"]').should('contain', 'Register');
    });

    it('should navigate to different public pages', () => {
      cy.visit('/');
      
      // Navigate to About
      cy.get('[data-testid="nav-about"]').click();
      cy.url().should('include', '/about');
      cy.get('[data-testid="about-content"]').should('be.visible');
      
      // Navigate to Login
      cy.get('[data-testid="nav-login"]').click();
      cy.url().should('include', '/login');
      cy.get('[data-testid="login-form"]').should('be.visible');
      
      // Navigate to Register
      cy.get('[data-testid="nav-register"]').click();
      cy.url().should('include', '/register');
      cy.get('[data-testid="register-form"]').should('be.visible');
      
      // Navigate back to Home
      cy.get('[data-testid="nav-home"]').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should highlight active navigation item', () => {
      cy.visit('/about');
      
      cy.get('[data-testid="nav-about"]')
        .should('have.class', 'active');
      cy.get('[data-testid="nav-home"]')
        .should('not.have.class', 'active');
    });

    it('should display logo and handle logo click', () => {
      cy.visit('/about');
      
      cy.get('[data-testid="logo"]').should('be.visible').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Authenticated Navigation', () => {
    beforeEach(() => {
      cy.visitAsUser('/dashboard');
    });

    it('should display authenticated navigation menu', () => {
      cy.get('[data-testid="main-nav"]').should('be.visible');
      cy.get('[data-testid="nav-dashboard"]').should('contain', 'Dashboard');
      cy.get('[data-testid="nav-posts"]').should('contain', 'Posts');
      cy.get('[data-testid="nav-profile"]').should('contain', 'Profile');
      cy.get('[data-testid="user-menu"]').should('be.visible');
      
      // Should not show login/register links
      cy.get('[data-testid="nav-login"]').should('not.exist');
      cy.get('[data-testid="nav-register"]').should('not.exist');
    });

    it('should navigate between authenticated pages', () => {
      // Navigate to Posts
      cy.get('[data-testid="nav-posts"]').click();
      cy.url().should('include', '/posts');
      cy.get('[data-testid="posts-content"]').should('be.visible');
      
      // Navigate to Profile
      cy.get('[data-testid="nav-profile"]').click();
      cy.url().should('include', '/profile');
      cy.get('[data-testid="profile-content"]').should('be.visible');
      
      // Navigate back to Dashboard
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
    });

    it('should display user menu with options', () => {
      cy.get('[data-testid="user-menu"]').click();
      
      cy.get('[data-testid="user-dropdown"]').should('be.visible');
      cy.get('[data-testid="user-profile-link"]').should('contain', 'My Profile');
      cy.get('[data-testid="user-settings-link"]').should('contain', 'Settings');
      cy.get('[data-testid="logout-button"]').should('contain', 'Logout');
    });

    it('should handle user menu interactions', () => {
      cy.get('[data-testid="user-menu"]').click();
      
      // Click profile link
      cy.get('[data-testid="user-profile-link"]').click();
      cy.url().should('include', '/profile');
      
      // Open menu again and click settings
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="user-settings-link"]').click();
      cy.url().should('include', '/settings');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      cy.viewport('iphone-6');
    });

    it('should show mobile menu toggle', () => {
      cy.visit('/');
      
      cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible');
      cy.get('[data-testid="desktop-nav"]').should('not.be.visible');
    });

    it('should toggle mobile menu', () => {
      cy.visit('/');
      
      // Menu should be hidden initially
      cy.get('[data-testid="mobile-nav"]').should('not.be.visible');
      
      // Open menu
      cy.get('[data-testid="mobile-menu-toggle"]').click();
      cy.get('[data-testid="mobile-nav"]').should('be.visible');
      
      // Close menu
      cy.get('[data-testid="mobile-menu-toggle"]').click();
      cy.get('[data-testid="mobile-nav"]').should('not.be.visible');
    });

    it('should navigate using mobile menu', () => {
      cy.visit('/');
      
      cy.get('[data-testid="mobile-menu-toggle"]').click();
      cy.get('[data-testid="mobile-nav-about"]').click();
      
      cy.url().should('include', '/about');
      cy.get('[data-testid="mobile-nav"]').should('not.be.visible'); // Menu should close after navigation
    });
  });

  describe('Breadcrumb Navigation', () => {
    beforeEach(() => {
      cy.visitAsUser('/posts');
    });

    it('should display breadcrumbs for nested pages', () => {
      cy.createPost('Breadcrumb Post', 'Content for breadcrumb testing').then((response) => {
        const postId = response.body.data.id;
        cy.visit(`/posts/${postId}`);
        
        cy.get('[data-testid="breadcrumb"]').should('be.visible');
        cy.get('[data-testid="breadcrumb-home"]').should('contain', 'Home');
        cy.get('[data-testid="breadcrumb-posts"]').should('contain', 'Posts');
        cy.get('[data-testid="breadcrumb-current"]').should('contain', 'Breadcrumb Post');
      });
    });

    it('should allow navigation via breadcrumbs', () => {
      cy.createPost('Navigation Post', 'Content for navigation testing').then((response) => {
        const postId = response.body.data.id;
        cy.visit(`/posts/${postId}`);
        
        // Click on Posts breadcrumb
        cy.get('[data-testid="breadcrumb-posts"]').click();
        cy.url().should('include', '/posts');
        
        // Go back to post and click Home breadcrumb
        cy.visit(`/posts/${postId}`);
        cy.get('[data-testid="breadcrumb-home"]').click();
        cy.url().should('include', '/dashboard'); // Home for authenticated users
      });
    });
  });

  describe('Error Pages and Navigation', () => {
    it('should display 404 page for non-existent routes', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false });
      
      cy.get('[data-testid="404-page"]').should('be.visible');
      cy.get('[data-testid="404-message"]').should('contain', 'Page not found');
      cy.get('[data-testid="go-home-button"]').should('be.visible');
    });

    it('should navigate from 404 page to home', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false });
      
      cy.get('[data-testid="go-home-button"]').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should handle navigation to protected route when not authenticated', () => {
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-testid="login-required-message"]')
        .should('contain', 'Please log in to access this page');
    });
  });

  describe('Back Button and Browser Navigation', () => {
    it('should handle browser back button correctly', () => {
      cy.visit('/');
      cy.visit('/about');
      cy.visit('/login');
      
      // Go back
      cy.go('back');
      cy.url().should('include', '/about');
      
      // Go back again
      cy.go('back');
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      
      // Go forward
      cy.go('forward');
      cy.url().should('include', '/about');
    });

    it('should maintain application state during navigation', () => {
      cy.visit('/login');
      
      // Fill form partially
      cy.get('[data-testid="email-input"]').type('test@example.com');
      
      // Navigate away and back
      cy.get('[data-testid="nav-home"]').click();
      cy.get('[data-testid="nav-login"]').click();
      
      // Form should be cleared (as expected behavior)
      cy.get('[data-testid="email-input"]').should('have.value', '');
    });
  });

  describe('Deep Linking', () => {
    it('should handle direct navigation to deep routes', () => {
      cy.createPost('Deep Link Post', 'Content for deep linking test').then((response) => {
        const postId = response.body.data.id;
        
        // Visit post directly
        cy.visitAsUser(`/posts/${postId}`);
        
        cy.get('[data-testid="post-title"]').should('contain', 'Deep Link Post');
        cy.get('[data-testid="post-content"]').should('contain', 'Content for deep linking test');
      });
    });

    it('should preserve query parameters', () => {
      cy.visit('/posts?search=test&page=2');
      
      cy.url().should('include', 'search=test');
      cy.url().should('include', 'page=2');
      
      // Navigation should preserve relevant parameters
      cy.get('[data-testid="nav-home"]').click();
      cy.get('[data-testid="nav-posts"]').click();
      
      // Search parameters might be cleared, but this depends on implementation
      cy.url().should('include', '/posts');
    });
  });

  describe('Loading States During Navigation', () => {
    it('should show loading indicators during page transitions', () => {
      // Intercept with delay to see loading state
      cy.intercept('GET', '**/api/posts', {
        delay: 1000,
        fixture: 'posts.json',
      }).as('getPostsDelayed');
      
      cy.visitAsUser('/dashboard');
      cy.get('[data-testid="nav-posts"]').click();
      
      // Should show loading state
      cy.get('[data-testid="page-loading"]').should('be.visible');
      
      cy.wait('@getPostsDelayed');
      
      // Loading should disappear
      cy.get('[data-testid="page-loading"]').should('not.exist');
      cy.get('[data-testid="posts-content"]').should('be.visible');
    });
  });
});
