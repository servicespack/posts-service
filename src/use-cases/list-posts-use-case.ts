import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { Post } from '../domain/entities/post'
import type { PostRepository } from '../domain/repositories/post-repository'

export interface ListPostsRequest {
  readonly authorId?: string | string[]
  readonly tags?: string[]
  readonly replyToId?: string
  readonly page?: number
  readonly limit?: number
  readonly search?: string
}

export interface ListPostsResponse {
  readonly data: Post[]
  readonly total: number
}

export class ListPostsUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly cache?: ICacheAdapter,
  ) {}

  public async execute(request: ListPostsRequest = {}): Promise<ListPostsResponse> {
    const cacheKey = this.getCacheKey(request)

    if (this.cache) {
      const cached = await this.cache.get<ListPostsResponse>(cacheKey)
      if (cached) {
        return cached
      }
    }

    const result = await this.postRepository.findAll({
      authorId: request.authorId,
      tags: request.tags,
      replyToId: request.replyToId,
      page: request.page,
      limit: request.limit,
      search: request.search,
    })

    if (this.cache) {
      await this.cache.set(cacheKey, result, 300)
    }

    return result
  }

  private getCacheKey(params: ListPostsRequest): string {
    const parts = ['posts:list']
    if (params.authorId) {
      const authorIds = [params.authorId].flat().map(encodeURIComponent).sort()
      parts.push(`author:${authorIds.join(',')}`)
    }
    if (params.tags?.length) {
      parts.push(`tags:${params.tags.map(encodeURIComponent).sort().join(',')}`)
    }
    if (params.replyToId) {
      parts.push(`replyTo:${encodeURIComponent(params.replyToId)}`)
    }
    if (params.search) {
      parts.push(`search:${encodeURIComponent(params.search)}`)
    }
    parts.push(`p:${params.page ?? 1}:l:${params.limit ?? 10}`)
    return parts.join('|')
  }
}
