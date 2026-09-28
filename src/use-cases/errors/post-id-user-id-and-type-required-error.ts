export class PostIdUserIdAndTypeRequiredError extends Error {
  constructor() {
    super('PostId, UserId and Type are required')
    this.name = 'PostIdUserIdAndTypeRequiredError'
  }
}
