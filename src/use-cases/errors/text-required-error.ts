export class TextRequiredError extends Error {
  constructor() {
    super('Text is required')
    this.name = 'TextRequiredError'
  }
}
