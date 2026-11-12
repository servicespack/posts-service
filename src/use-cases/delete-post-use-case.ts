import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { PostRepository } from '../domain/repositories/post-repository'
import { PostNotFoundError } from './errors'

export interface DeletePostRequest {
  readonly id: string
}

export interface DeletePostResponse {
  readonly deleted: boolean
}

export class DeletePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly cache?: ICacheAdapter,
  ) {}

  public async execute(request: DeletePostRequest): Promise<DeletePostResponse> {
    const success = await this.postRepository.delete(request.id)
    if (!success) {
      throw new PostNotFoundError()
    }

    await this.invalidateCache()

    return { deleted: true }
  }

  private async invalidateCache() {
    await this.cache?.invalidatePattern('posts:*')
    await this.cache?.invalidatePattern('tags:*')
  }
}
