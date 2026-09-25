import type { PostRepository } from '../domain/repositories/PostRepository';
import { Post } from '../domain/entities/Post';

export interface GetPostRequest {
  readonly id: string;
}

export class GetPostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  public async execute(request: GetPostRequest): Promise<Post> {
    const post = await this.postRepository.findById(request.id);
    if (!post) {
      throw new Error('Post not found');
    }
    return post;
  }
}
