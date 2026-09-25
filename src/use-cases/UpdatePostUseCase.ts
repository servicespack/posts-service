import type { PostRepository } from '../domain/repositories/PostRepository';

export interface UpdatePostRequest {
  readonly id: string;
  readonly text: string;
}

export interface UpdatePostResponse {
  readonly updated: boolean;
}

export class UpdatePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  public async execute(request: UpdatePostRequest): Promise<UpdatePostResponse> {
    const success = await this.postRepository.update(request.id, request.text);
    if (!success) {
      throw new Error('Post not found');
    }
    return { updated: true };
  }
}
