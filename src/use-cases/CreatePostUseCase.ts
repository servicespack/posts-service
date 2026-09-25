import { Post } from '../domain/entities/Post';
import type { PostRepository } from '../domain/repositories/PostRepository';

export interface CreatePostRequest {
  readonly text: string;
}

export interface CreatePostResponse {
  readonly created: boolean;
}

export class CreatePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  public async execute(request: CreatePostRequest): Promise<CreatePostResponse> {
    if (!request.text) {
      throw new Error('Text is required');
    }
    const post = new Post({ text: request.text });
    await this.postRepository.create(post);
    return { created: true };
  }
}
