import type { PostRepository } from '../domain/repositories/post-repository'
import { PostIdAndUserIdRequiredError, PostNotFoundError } from './errors'

export interface UnreactPostRequest {
  readonly postId: string
  readonly userId: string
}

export interface UnreactPostResponse {
  readonly success: boolean
}

export class UnreactPostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  public async execute(request: UnreactPostRequest): Promise<UnreactPostResponse> {
    if (!request.postId || !request.userId) {
      throw new PostIdAndUserIdRequiredError()
    }

    const post = await this.postRepository.findById(request.postId)
    if (!post) {
      throw new PostNotFoundError()
    }

    const hasReaction = post.reactions.some(r => r.userId === request.userId)
    if (!hasReaction) {
      return { success: true }
    }

    const success = await this.postRepository.unreact(request.postId, request.userId)
    return { success }
  }
}
