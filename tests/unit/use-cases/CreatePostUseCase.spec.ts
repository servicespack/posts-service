import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePostUseCase } from '../../../src/use-cases/CreatePostUseCase';
import { PostRepository } from '../../../src/domain/repositories/PostRepository';

describe('CreatePostUseCase', () => {
  let postRepository: PostRepository;
  let useCase: CreatePostUseCase;

  beforeEach(() => {
    postRepository = {
      create: vi.fn().mockImplementation(async (post) => post),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new CreatePostUseCase(postRepository);
  });

  it('should create a post successfully', async () => {
    const response = await useCase.execute({ text: 'Hello World' });

    expect(response).toEqual({ created: true });
    expect(postRepository.create).toHaveBeenCalledTimes(1);
    expect(postRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Hello World' })
    );
  });

  it('should throw an error if text is empty', async () => {
    await expect(useCase.execute({ text: '' })).rejects.toThrow('Text is required');
    expect(postRepository.create).not.toHaveBeenCalled();
  });
});
