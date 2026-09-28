import type { Post } from '../domain/entities/post'
import type { PostRepository } from '../domain/repositories/post-repository'

export interface ListPostsRequest {
  readonly authorId?: string
  readonly tags?: string[]
  readonly replyToId?: string
  readonly page?: number
  readonly limit?: number
}

export interface ListPostsResponse {
  readonly data: Post[]
  readonly total: number
}

export class ListPostsUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  public async execute(request: ListPostsRequest = {}): Promise<ListPostsResponse> {
    const result = await this.postRepository.findAll({
      authorId: request.authorId,
      tags: request.tags,
      replyToId: request.replyToId,
      page: request.page,
      limit: request.limit,
    })
    return result
  }
}
