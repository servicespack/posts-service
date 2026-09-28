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
  constructor(private readonly postRepository: PostRepository) {}

  public async execute(request: ReactPostRequest): Promise<ReactPostResponse> {
    if (!request.postId || !request.userId || !request.type) {
      throw new PostIdUserIdAndTypeRequiredError()
    }

    const post = await this.postRepository.findById(request.postId)
    if (!post) {
      throw new PostNotFoundError()
    }

    const success = await this.postRepository.react(request.postId, request.userId, request.type)
    return { success }
  }
}
