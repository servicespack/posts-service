import type { BookmarkRepository } from '../domain/repositories/bookmark-repository'
import { BookmarkNotFoundError } from './errors/bookmark-not-found-error'

export interface UnbookmarkPostRequest {
  readonly userId: string
  readonly bookmarkId: string
}

export class UnbookmarkPostUseCase {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async execute(request: UnbookmarkPostRequest): Promise<{ message: string }> {
    const deleted = await this.bookmarkRepository.delete(request.bookmarkId, request.userId)
    if (!deleted) {
      throw new BookmarkNotFoundError()
    }
    return { message: 'Bookmark removed successfully' }
  }
}
