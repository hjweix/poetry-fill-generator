// Custom commands for poetry-fill-generator E2E tests

/// <reference types="cypress" />

// Extend Cypress namespace with custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Enter poetry content into the input field
       */
      enterPoetryContent(content: string): Chainable<void>;

      /**
       * Select difficulty level
       */
      selectDifficulty(level: 'easy' | 'medium' | 'hard'): Chainable<void>;

      /**
       * Wait for generation to complete
       */
      waitForGeneration(): Chainable<void>;

      /**
       * Verify questions are generated
       */
      verifyQuestionsGenerated(count?: number): Chainable<void>;
    }
  }
}

// Custom command implementations
Cypress.Commands.add('enterPoetryContent', (content: string) => {
  cy.get('[data-testid="poetry-content-input"]')
    .clear()
    .type(content);
});

Cypress.Commands.add('selectDifficulty', (level: 'easy' | 'medium' | 'hard') => {
  cy.get(`[data-testid="difficulty-${level}"]`)
    .should('be.visible')
    .click();
});

Cypress.Commands.add('waitForGeneration', () => {
  cy.get('[data-testid="generate-button"]', { timeout: 10000 })
    .should('not.be.disabled');
});

Cypress.Commands.add('verifyQuestionsGenerated', (count?: number) => {
  cy.get('[data-testid="question-preview"]')
    .should('be.visible');

  if (count !== undefined) {
    cy.get('[data-testid="question-item"]')
      .should('have.length', count);
  } else {
    cy.get('[data-testid="question-item"]')
      .should('have.length.greaterThan', 0);
  }
});

// Clear local storage between tests
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
});

export {};
