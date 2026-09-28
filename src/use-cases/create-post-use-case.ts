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
  constructor(private readonly postRepository: PostRepository) {}

  public async execute(request: CreatePostRequest): Promise<CreatePostResponse> {
    if (!request.authorId) {
      throw new AuthorIdRequiredError()
    }
    if (!request.text) {
      throw new TextRequiredError()
    }

    if (request.replyToId) {
      const parentPost = await this.postRepository.findById(request.replyToId)
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
    return { created: true, post: createdPost }
  }
}
