describe('Search', () => {
  beforeEach(() => {
    cy.visit('/#/11155111/swap/')
  })

  it('should be able to find a token by its name', () => {
    cy.get('.open-currency-select-button').first().click()
    cy.get('#token-search-input').type('COW')
    cy.get('#currency-list').contains('COW')
    cy.get('#currency-list').should('not.contain.text', 'GNO')
  })

  it('should be able to find a token by its address', () => {
    cy.get('.open-currency-select-button').first().click()
    cy.get('#token-search-input').type('0x0625aFB445C3B6B7B929342a04A22599fd5dBB59')
    cy.get('#currency-list').contains('COW')
    cy.get('#currency-list').should('not.contain.text', 'GNO')
  })

  it('should be able to find a token by its address with case errors at the beginning', () => {
    cy.get('.open-currency-select-button').first().click()
    cy.get('#token-search-input').type('0x0625aFB445C3B6B7B929342a04A22599fd5dBB59')
    cy.get('#currency-list').contains('COW')
    cy.get('#currency-list').should('not.contain.text', 'GNO')
  })

  it('should be able to find a token by its address with case errors in the address', () => {
    cy.get('.open-currency-select-button').first().click()
    cy.get('#token-search-input').type('0x0625aFB445C3B6B7B929342a04A22599fd5dBB59')
    cy.get('#currency-list').contains('COW')
    cy.get('#currency-list').should('not.contain.text', 'GNO')
  })

  it('should be able to find a token by its address without 0x at the start', () => {
    cy.get('.open-currency-select-button').first().click()
    cy.get('#token-search-input').type('0625aFB445C3B6B7B929342a04A22599fd5dBB59')
    cy.get('#currency-list').contains('COW')
    cy.get('#currency-list').should('not.contain.text', 'GNO')
  })

  it('should be able to find a token by its address when there is a trailing or leading space', () => {
    cy.get('.open-currency-select-button').first().click()
    cy.get('#token-search-input').type(' 0x0625aFB445C3B6B7B929342a04A22599fd5dBB59 ')
    cy.get('#currency-list').contains('COW')
    cy.get('#currency-list').should('not.contain.text', 'GNO')
  })

  it('should be able to find a token by its name when there is a trailing or leading space', () => {
    cy.get('.open-currency-select-button').first().click()
    cy.get('#token-search-input').type(' COW ')
    cy.get('#currency-list').contains('COW')
    cy.get('#currency-list').should('not.contain.text', 'GNO')
  })

  it('should not show import when token is in our lists', () => {
    cy.get('.open-currency-select-button').first().click()
    cy.get('#token-search-input').type('0x0625aFB445C3B6B7B929342a04A22599fd5dBB59')
    cy.get('#currency-list').contains('COW')
    cy.get('#currency-list').should('not.contain.text', 'Import')
  })

  it('should show import when token is unknown to us', () => {
    cy.get('.open-currency-select-button').first().click()
    cy.get('#token-search-input').type('0x779877A7B0D9E8603169DdbD7836e478b4624789')
    cy.get('#currency-import').contains('LINK')
    cy.get('#currency-import').contains('Import')
  })
})
