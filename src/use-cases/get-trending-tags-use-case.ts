import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { PostRepository } from '../domain/repositories/post-repository'

export interface GetTrendingTagsRequest {
  readonly limit?: number
}

export type GetTrendingTagsResponse = Array<{
  tag: string
  count: number
}>

export class GetTrendingTagsUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly cache?: ICacheAdapter,
  ) {}

  public async execute(request: GetTrendingTagsRequest = {}): Promise<GetTrendingTagsResponse> {
    const cacheKey = `tags:trending:${request.limit ?? 10}`

    if (this.cache) {
      const cached = await this.cache.get<GetTrendingTagsResponse>(cacheKey)
      if (cached) {
        return cached
      }
    }

    const trending = await this.postRepository.getTrendingTags(request.limit)

    if (this.cache) {
      await this.cache.set(cacheKey, trending, 300)
    }

    return trending
  }
}
