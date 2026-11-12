import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { INotificationAdapter } from '../domain/adapters/notification-adapter'
import type { PostRepository } from '../domain/repositories/post-repository'
import { Post } from '../domain/entities/post'
import { AuthorIdRequiredError, ParentPostNotFoundError, TextRequiredError } from './errors'

export interface CreatePostRequest {
  readonly authorId: string
  readonly text: string
  readonly tags?: string[]
  readonly replyToId?: string
}

export interface CreatePostResponse {
  readonly created: boolean
  readonly post: Post
}

export class CreatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly notifyAdapter?: INotificationAdapter,
    private readonly cache?: ICacheAdapter,
  ) {}

  public async execute(request: CreatePostRequest): Promise<CreatePostResponse> {
    if (!request.authorId) {
      throw new AuthorIdRequiredError()
    }
    if (!request.text) {
      throw new TextRequiredError()
    }

    let parentPost: Post | null = null

    if (request.replyToId) {
      parentPost = await this.postRepository.findById(request.replyToId)
      if (!parentPost) {
        throw new ParentPostNotFoundError()
      }
    }

    const post = new Post({
      authorId: request.authorId,
      text: request.text,
      tags: request.tags ?? [],
      replyToId: request.replyToId,
    })
    const createdPost = await this.postRepository.create(post)

    if (this.notifyAdapter && parentPost && parentPost.authorId !== request.authorId) {
      try {
        await this.notifyAdapter.notifyReply({
          userId: parentPost.authorId,
          postId: request.replyToId!,
          repliedByUserId: request.authorId,
        })
      }
      catch {
        // notification failures must not fail a post that was already saved
      }
    }

    await this.invalidateCache()

    return { created: true, post: createdPost }
  }

  private async invalidateCache() {
    await this.cache?.invalidatePattern('posts:*')
    await this.cache?.invalidatePattern('tags:*')
  }
}
