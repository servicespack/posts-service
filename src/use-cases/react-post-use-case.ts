import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { INotificationAdapter } from '../domain/adapters/notification-adapter'
import type { PostRepository } from '../domain/repositories/post-repository'
import { PostIdUserIdAndTypeRequiredError, PostNotFoundError } from './errors'

export interface ReactPostRequest {
  readonly postId: string
  readonly userId: string
  readonly type: string
}

export interface ReactPostResponse {
  readonly success: boolean
}

export class ReactPostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly notifyAdapter?: INotificationAdapter,
    private readonly cache?: ICacheAdapter,
  ) {}

  public async execute(request: ReactPostRequest): Promise<ReactPostResponse> {
    if (!request.postId || !request.userId || !request.type) {
      throw new PostIdUserIdAndTypeRequiredError()
    }

    const post = await this.postRepository.findById(request.postId)
    if (!post) {
      throw new PostNotFoundError()
    }

    const alreadyHadSameReaction = post.reactions.some(
      r => r.userId === request.userId && r.type === request.type,
    )

    const success = await this.postRepository.react(request.postId, request.userId, request.type)

    await this.invalidateCache()

    if (this.notifyAdapter && post.authorId !== request.userId && !alreadyHadSameReaction) {
      try {
        await this.notifyAdapter.notifyReaction({
          userId: post.authorId,
          postId: request.postId,
          reactedByUserId: request.userId,
          reactionType: request.type,
        })
      }
      catch {
        // notification failures must not fail a reaction that was already saved
      }
    }

    return { success }
  }

  private async invalidateCache() {
    await this.cache?.invalidatePattern('posts:*')
  }
}
