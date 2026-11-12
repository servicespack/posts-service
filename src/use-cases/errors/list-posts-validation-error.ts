export class ListPostsValidationError extends Error {
  constructor(message = 'Invalid query parameters') {
    super(message)
    this.name = 'ListPostsValidationError'
  }
}
