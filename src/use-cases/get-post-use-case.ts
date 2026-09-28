import type { Post } from '../domain/entities/post'
import type { PostRepository } from '../domain/repositories/post-repository'
import { PostNotFoundError } from './errors'

export interface GetPostRequest {
  readonly id: string
}

export class GetPostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  public async execute(request: GetPostRequest): Promise<Post> {
    const post = await this.postRepository.findById(request.id)
    if (!post) {
      throw new PostNotFoundError()
    }
    return post
  }
}
