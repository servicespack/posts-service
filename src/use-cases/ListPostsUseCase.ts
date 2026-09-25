import type { PostRepository } from '../domain/repositories/PostRepository';
import { Post } from '../domain/entities/Post';

export interface ListPostsResponse {
  readonly data: Post[];
}

export class ListPostsUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  public async execute(): Promise<ListPostsResponse> {
    const posts = await this.postRepository.findAll();
    return { data: posts };
  }
}
