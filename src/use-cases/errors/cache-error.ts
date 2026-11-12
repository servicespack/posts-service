export class CacheError extends Error {
  constructor(message = 'Cache operation failed') {
    super(message)
    this.name = 'CacheError'
  }
}
