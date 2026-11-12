import type { BookmarkRepository } from '../domain/repositories/bookmark-repository'

export interface ListBookmarksRequest {
  readonly userId: string
  readonly page?: number
  readonly limit?: number
}

export interface ListBookmarksResponse {
  readonly data: Array<{ bookmarkId: string, postId: string }>
  readonly total: number
}

export class ListBookmarksUseCase {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  async execute(request: ListBookmarksRequest): Promise<ListBookmarksResponse> {
    const result = await this.bookmarkRepository.findAllByUser(
      request.userId,
      request.page,
      request.limit,
    )
    return {
      data: result.data.map(bm => ({ bookmarkId: bm.id!, postId: bm.postId })),
      total: result.total,
    }
  }
}
