import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { PostRepository } from '../domain/repositories/post-repository'
import { PostNotFoundError, TextRequiredError } from './errors'

export interface UpdatePostRequest {
  readonly id: string
  readonly text?: string
  readonly tags?: string[]
}

export interface UpdatePostResponse {
  readonly updated: boolean
}

export class UpdatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly cache?: ICacheAdapter,
  ) {}

  public async execute(request: UpdatePostRequest): Promise<UpdatePostResponse> {
    const updateData: any = {}
    if (request.text !== undefined) {
      if (!request.text.trim()) {
        throw new TextRequiredError()
      }
      updateData.text = request.text
    }
    if (request.tags !== undefined)
      updateData.tags = request.tags

    if (Object.keys(updateData).length === 0) {
      return { updated: false }
    }

    const success = await this.postRepository.update(request.id, updateData)
    if (!success) {
      throw new PostNotFoundError()
    }

    await this.invalidateCache()

    return { updated: true }
  }

  private async invalidateCache() {
    await this.cache?.invalidatePattern('posts:*')
    await this.cache?.invalidatePattern('tags:*')
  }
}
