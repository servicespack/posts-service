export class BookmarkNotFoundError extends Error {
  constructor() {
    super('Bookmark not found')
    this.name = 'BookmarkNotFoundError'
  }
}
