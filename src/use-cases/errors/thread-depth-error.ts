export class ThreadDepthExceededError extends Error {
  constructor(maxDepth: number) {
    super(`Thread depth exceeded maximum allowed depth of ${maxDepth}`)
    this.name = 'ThreadDepthExceededError'
  }
}
