import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListPostsUseCase } from '../../../src/use-cases/ListPostsUseCase';
import { PostRepository } from '../../../src/domain/repositories/PostRepository';
import { Post } from '../../../src/domain/entities/Post';

describe('ListPostsUseCase', () => {
  let postRepository: PostRepository;
  let useCase: ListPostsUseCase;

  beforeEach(() => {
    postRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new ListPostsUseCase(postRepository);
  });

  it('should return a list of posts', async () => {
    const mockPosts = [
      new Post({ id: '1', text: 'Post 1' }),
      new Post({ id: '2', text: 'Post 2' }),
    ];
    vi.spyOn(postRepository, 'findAll').mockResolvedValue(mockPosts);

    const response = await useCase.execute();

    expect(response).toEqual({ data: mockPosts });
    expect(postRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return an empty list if no posts exist', async () => {
    vi.spyOn(postRepository, 'findAll').mockResolvedValue([]);

    const response = await useCase.execute();

    expect(response).toEqual({ data: [] });
    expect(postRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
