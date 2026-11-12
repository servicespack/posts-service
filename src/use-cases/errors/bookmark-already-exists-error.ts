export class BookmarkAlreadyExistsError extends Error {
  constructor() {
    super('Bookmark already exists')
    this.name = 'BookmarkAlreadyExistsError'
  }
}
