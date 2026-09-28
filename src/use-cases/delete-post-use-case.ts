import type { PostRepository } from '../domain/repositories/post-repository'
import { PostNotFoundError } from './errors'

export interface DeletePostRequest {
  readonly id: string
}

export interface DeletePostResponse {
  readonly deleted: boolean
}

export class DeletePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  public async execute(request: DeletePostRequest): Promise<DeletePostResponse> {
    const success = await this.postRepository.delete(request.id)
    if (!success) {
      throw new PostNotFoundError()
    }
    return { deleted: true }
  }
}
