import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPostUseCase } from '../../../src/use-cases/GetPostUseCase';
import { PostRepository } from '../../../src/domain/repositories/PostRepository';
import { Post } from '../../../src/domain/entities/Post';

describe('GetPostUseCase', () => {
  let postRepository: PostRepository;
  let useCase: GetPostUseCase;

  beforeEach(() => {
    postRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new GetPostUseCase(postRepository);
  });

  it('should return a post if found', async () => {
    const mockPost = new Post({ id: 'post-id', text: 'Some text' });
    vi.spyOn(postRepository, 'findById').mockResolvedValue(mockPost);

    const response = await useCase.execute({ id: 'post-id' });

    expect(response).toBe(mockPost);
    expect(postRepository.findById).toHaveBeenCalledTimes(1);
    expect(postRepository.findById).toHaveBeenCalledWith('post-id');
  });

  it('should throw an error if post is not found', async () => {
    vi.spyOn(postRepository, 'findById').mockResolvedValue(null);

    await expect(useCase.execute({ id: 'non-existing-id' })).rejects.toThrow('Post not found');
    expect(postRepository.findById).toHaveBeenCalledTimes(1);
    expect(postRepository.findById).toHaveBeenCalledWith('non-existing-id');
  });
});
