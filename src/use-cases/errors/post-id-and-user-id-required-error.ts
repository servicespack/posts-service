export class PostIdAndUserIdRequiredError extends Error {
  constructor() {
    super('PostId and UserId are required')
    this.name = 'PostIdAndUserIdRequiredError'
  }
}
