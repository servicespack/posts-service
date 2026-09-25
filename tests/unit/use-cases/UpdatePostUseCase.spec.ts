import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdatePostUseCase } from '../../../src/use-cases/UpdatePostUseCase';
import { PostRepository } from '../../../src/domain/repositories/PostRepository';

describe('UpdatePostUseCase', () => {
  let postRepository: PostRepository;
  let useCase: UpdatePostUseCase;

  beforeEach(() => {
    postRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new UpdatePostUseCase(postRepository);
  });

  it('should update a post successfully', async () => {
    vi.spyOn(postRepository, 'update').mockResolvedValue(true);

    const response = await useCase.execute({ id: 'post-id', text: 'Updated text' });

    expect(response).toEqual({ updated: true });
    expect(postRepository.update).toHaveBeenCalledTimes(1);
    expect(postRepository.update).toHaveBeenCalledWith('post-id', 'Updated text');
  });

  it('should throw an error if post is not found', async () => {
    vi.spyOn(postRepository, 'update').mockResolvedValue(false);

    await expect(useCase.execute({ id: 'non-existing-id', text: 'Some text' })).rejects.toThrow(
      'Post not found'
    );
    expect(postRepository.update).toHaveBeenCalledTimes(1);
    expect(postRepository.update).toHaveBeenCalledWith('non-existing-id', 'Some text');
  });
});
