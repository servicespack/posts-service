import type { INotificationAdapter } from '../domain/adapters/notification-adapter'
import type { BookmarkRepository } from '../domain/repositories/bookmark-repository'
import type { PostRepository } from '../domain/repositories/post-repository'
import { Bookmark } from '../domain/entities/bookmark'
import { BookmarkAlreadyExistsError, PostNotFoundError } from './errors'

export interface BookmarkPostRequest {
  readonly userId: string
  readonly postId: string
}

export class BookmarkPostUseCase {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly postRepository: PostRepository,
    private readonly notifyAdapter?: INotificationAdapter,
  ) {}

  async execute(request: BookmarkPostRequest): Promise<{ message: string }> {
    const post = await this.postRepository.findById(request.postId)
    if (!post) {
      throw new PostNotFoundError()
    }

    const existing = await this.bookmarkRepository.findByPostAndUser(request.postId, request.userId)
    if (existing) {
      throw new BookmarkAlreadyExistsError()
    }

    const bookmark = new Bookmark({
      userId: request.userId,
      postId: request.postId,
    })

    const created = await this.bookmarkRepository.create(bookmark)
    if (!created) {
      throw new BookmarkAlreadyExistsError()
    }

    try {
      await this.notifyAdapter?.notifyBookmark({ userId: request.userId, postId: request.postId })
    }
    catch {
      // notification failures must not fail a bookmark that was already saved
    }

    return { message: 'Post bookmarked successfully' }
  }
}
