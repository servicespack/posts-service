export class AuthorIdRequiredError extends Error {
  constructor() {
    super('AuthorId is required')
    this.name = 'AuthorIdRequiredError'
  }
}
