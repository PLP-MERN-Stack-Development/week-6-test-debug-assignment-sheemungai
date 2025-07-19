// cypress/e2e/posts.cy.js - E2E tests for posts functionality

describe('Posts Management', () => {
  beforeEach(() => {
    cy.cleanUp();
    
    // Setup API intercepts
    cy.intercept('GET', '**/api/posts').as('getPosts');
    cy.intercept('POST', '**/api/posts').as('createPost');
    cy.intercept('PUT', '**/api/posts/*').as('updatePost');
    cy.intercept('DELETE', '**/api/posts/*').as('deletePost');
    cy.intercept('POST', '**/api/posts/*/like').as('likePost');
    cy.intercept('POST', '**/api/posts/*/comment').as('addComment');
  });

  describe('Posts Display', () => {
    beforeEach(() => {
      // Create test posts via API
      cy.createPost('First Test Post', 'This is the content of the first post');
      cy.createPost('Second Test Post', 'This is the content of the second post');
      
      cy.visitAsUser('/posts');
    });

    it('should display list of posts', () => {
      cy.wait('@getPosts');
      
      cy.get('[data-testid="posts-list"]').should('be.visible');
      cy.get('[data-testid="post-item"]').should('have.length.at.least', 2);
      
      // Check post content
      cy.get('[data-testid="post-title"]').first().should('contain', 'First Test Post');
      cy.get('[data-testid="post-content"]').first()
        .should('contain', 'This is the content of the first post');
    });

    it('should show loading state while fetching posts', () => {
      // Intercept with delay
      cy.intercept('GET', '**/api/posts', {
        delay: 2000,
        fixture: 'posts.json',
      }).as('getPostsDelayed');
      
      cy.visit('/posts');
      
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.wait('@getPostsDelayed');
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
    });

    it('should handle empty posts state', () => {
      cy.intercept('GET', '**/api/posts', {
        statusCode: 200,
        body: {
          success: true,
          data: [],
        },
      }).as('getEmptyPosts');
      
      cy.visit('/posts');
      cy.wait('@getEmptyPosts');
      
      cy.get('[data-testid="empty-posts-message"]')
        .should('contain', 'No posts found');
      cy.get('[data-testid="create-first-post-button"]').should('be.visible');
    });

    it('should handle API error gracefully', () => {
      cy.intercept('GET', '**/api/posts', {
        statusCode: 500,
        body: {
          success: false,
          message: 'Server error',
        },
      }).as('getPostsError');
      
      cy.visit('/posts');
      cy.wait('@getPostsError');
      
      cy.get('[data-testid="error-message"]')
        .should('contain', 'Failed to load posts');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Create Post', () => {
    beforeEach(() => {
      cy.visitAsUser('/posts/create');
    });

    it('should allow user to create a new post', () => {
      // Fill post form
      cy.get('[data-testid="post-title-input"]').type('My New Post');
      cy.get('[data-testid="post-content-textarea"]')
        .type('This is the content of my new post. It has multiple sentences.');
      
      // Submit form
      cy.get('[data-testid="create-post-button"]').click();
      
      cy.waitForApi('@createPost');
      
      // Should redirect to posts list
      cy.url().should('include', '/posts');
      
      // Should show success message
      cy.get('[data-testid="success-message"]')
        .should('contain', 'Post created successfully');
      
      // Should display the new post
      cy.get('[data-testid="post-title"]').first()
        .should('contain', 'My New Post');
    });

    it('should validate required fields', () => {
      // Try to submit empty form
      cy.get('[data-testid="create-post-button"]').click();
      
      cy.get('[data-testid="title-error"]')
        .should('contain', 'Title is required');
      cy.get('[data-testid="content-error"]')
        .should('contain', 'Content is required');
    });

    it('should validate minimum content length', () => {
      cy.get('[data-testid="post-title-input"]').type('Short Title');
      cy.get('[data-testid="post-content-textarea"]').type('Too short');
      
      cy.get('[data-testid="create-post-button"]').click();
      
      cy.get('[data-testid="content-error"]')
        .should('contain', 'Content must be at least');
    });

    it('should show character count for content', () => {
      cy.get('[data-testid="post-content-textarea"]')
        .type('Sample content for testing');
      
      cy.get('[data-testid="content-character-count"]')
        .should('contain', '26 characters');
    });

    it('should save draft automatically', () => {
      cy.get('[data-testid="post-title-input"]').type('Draft Post');
      cy.get('[data-testid="post-content-textarea"]')
        .type('This is a draft post content');
      
      // Wait for auto-save
      cy.wait(3000);
      
      cy.get('[data-testid="draft-saved-indicator"]')
        .should('contain', 'Draft saved');
      
      // Reload page
      cy.reload();
      
      // Should restore draft
      cy.get('[data-testid="post-title-input"]')
        .should('have.value', 'Draft Post');
      cy.get('[data-testid="post-content-textarea"]')
        .should('contain.value', 'This is a draft post content');
    });
  });

  describe('Edit Post', () => {
    let postId;

    beforeEach(() => {
      cy.createPost('Editable Post', 'Original content').then((response) => {
        postId = response.body.data.id;
        cy.visitAsUser(`/posts/${postId}/edit`);
      });
    });

    it('should allow user to edit their own post', () => {
      // Check form is pre-filled
      cy.get('[data-testid="post-title-input"]')
        .should('have.value', 'Editable Post');
      cy.get('[data-testid="post-content-textarea"]')
        .should('contain.value', 'Original content');
      
      // Edit the post
      cy.get('[data-testid="post-title-input"]')
        .clear().type('Updated Post Title');
      cy.get('[data-testid="post-content-textarea"]')
        .clear().type('Updated post content with more details');
      
      cy.get('[data-testid="update-post-button"]').click();
      
      cy.waitForApi('@updatePost');
      
      // Should redirect to post detail
      cy.url().should('include', `/posts/${postId}`);
      
      // Should show updated content
      cy.get('[data-testid="post-title"]')
        .should('contain', 'Updated Post Title');
      cy.get('[data-testid="post-content"]')
        .should('contain', 'Updated post content with more details');
    });

    it('should show confirmation before discarding changes', () => {
      // Make changes
      cy.get('[data-testid="post-title-input"]')
        .clear().type('Changed Title');
      
      // Try to navigate away
      cy.get('[data-testid="cancel-button"]').click();
      
      // Should show confirmation dialog
      cy.get('[data-testid="unsaved-changes-modal"]').should('be.visible');
      cy.get('[data-testid="discard-changes-button"]').should('be.visible');
      cy.get('[data-testid="keep-editing-button"]').should('be.visible');
    });
  });

  describe('Post Interactions', () => {
    let postId;

    beforeEach(() => {
      cy.createPost('Interactive Post', 'Post for testing interactions').then((response) => {
        postId = response.body.data.id;
        cy.visitAsUser(`/posts/${postId}`);
      });
    });

    it('should allow user to like a post', () => {
      cy.get('[data-testid="like-button"]').click();
      
      cy.waitForApi('@likePost');
      
      cy.get('[data-testid="like-count"]').should('contain', '1');
      cy.get('[data-testid="like-button"]').should('have.class', 'liked');
    });

    it('should allow user to unlike a post', () => {
      // Like first
      cy.get('[data-testid="like-button"]').click();
      cy.waitForApi('@likePost');
      
      // Then unlike
      cy.get('[data-testid="like-button"]').click();
      cy.waitForApi('@likePost');
      
      cy.get('[data-testid="like-count"]').should('contain', '0');
      cy.get('[data-testid="like-button"]').should('not.have.class', 'liked');
    });

    it('should allow user to add comments', () => {
      cy.get('[data-testid="comment-input"]')
        .type('This is a test comment');
      cy.get('[data-testid="add-comment-button"]').click();
      
      cy.waitForApi('@addComment');
      
      cy.get('[data-testid="comment-item"]').should('have.length', 1);
      cy.get('[data-testid="comment-text"]')
        .should('contain', 'This is a test comment');
    });

    it('should show comment count', () => {
      // Add multiple comments
      cy.get('[data-testid="comment-input"]')
        .type('First comment');
      cy.get('[data-testid="add-comment-button"]').click();
      cy.waitForApi('@addComment');
      
      cy.get('[data-testid="comment-input"]')
        .type('Second comment');
      cy.get('[data-testid="add-comment-button"]').click();
      cy.waitForApi('@addComment');
      
      cy.get('[data-testid="comment-count"]').should('contain', '2 comments');
    });

    it('should allow user to delete their own post', () => {
      cy.get('[data-testid="post-menu-button"]').click();
      cy.get('[data-testid="delete-post-button"]').click();
      
      // Should show confirmation dialog
      cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible');
      cy.get('[data-testid="confirm-delete-button"]').click();
      
      cy.waitForApi('@deletePost');
      
      // Should redirect to posts list
      cy.url().should('include', '/posts');
      
      // Should show success message
      cy.get('[data-testid="success-message"]')
        .should('contain', 'Post deleted successfully');
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      // Create posts with different content
      cy.createPost('JavaScript Tutorial', 'Learn JavaScript fundamentals');
      cy.createPost('React Components', 'Building reusable React components');
      cy.createPost('Node.js Backend', 'Creating REST APIs with Node.js');
      
      cy.visitAsUser('/posts');
      cy.wait('@getPosts');
    });

    it('should allow searching posts by title', () => {
      cy.get('[data-testid="search-input"]').type('React');
      cy.get('[data-testid="search-button"]').click();
      
      cy.get('[data-testid="post-item"]').should('have.length', 1);
      cy.get('[data-testid="post-title"]')
        .should('contain', 'React Components');
    });

    it('should allow searching posts by content', () => {
      cy.get('[data-testid="search-input"]').type('JavaScript');
      cy.get('[data-testid="search-button"]').click();
      
      cy.get('[data-testid="post-item"]').should('have.length', 1);
      cy.get('[data-testid="post-title"]')
        .should('contain', 'JavaScript Tutorial');
    });

    it('should show no results message for non-matching search', () => {
      cy.get('[data-testid="search-input"]').type('Python');
      cy.get('[data-testid="search-button"]').click();
      
      cy.get('[data-testid="no-search-results"]')
        .should('contain', 'No posts found matching your search');
      cy.get('[data-testid="clear-search-button"]').should('be.visible');
    });

    it('should allow clearing search results', () => {
      cy.get('[data-testid="search-input"]').type('React');
      cy.get('[data-testid="search-button"]').click();
      
      cy.get('[data-testid="clear-search-button"]').click();
      
      cy.get('[data-testid="search-input"]').should('have.value', '');
      cy.get('[data-testid="post-item"]').should('have.length.at.least', 3);
    });
  });
});
