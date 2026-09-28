export class ParentPostNotFoundError extends Error {
  constructor() {
    super('Parent post not found')
    this.name = 'ParentPostNotFoundError'
  }
}
