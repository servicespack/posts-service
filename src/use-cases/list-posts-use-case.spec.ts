import type { PaginatedResult, PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Post } from '../domain/entities/post'
import { ListPostsUseCase } from './list-posts-use-case'

describe('listPostsUseCase', () => {
  let postRepository: PostRepository
  let useCase: ListPostsUseCase

  beforeEach(() => {
    postRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      react: vi.fn(),
      unreact: vi.fn(),
    }
    useCase = new ListPostsUseCase(postRepository)
  })

  it('should return a paginated list of posts', async () => {
    const mockPosts = [
      new Post({ id: '1', authorId: 'a1', text: 'Post 1' }),
      new Post({ id: '2', authorId: 'a2', text: 'Post 2' }),
    ]
    const paginatedResult: PaginatedResult<Post> = { data: mockPosts, total: 2 }
    vi.spyOn(postRepository, 'findAll').mockResolvedValue(paginatedResult)

    const response = await useCase.execute()

    expect(response).toEqual(paginatedResult)
    expect(postRepository.findAll).toHaveBeenCalledTimes(1)
    expect(postRepository.findAll).toHaveBeenCalledWith({})
  })

  it('should pass parameters to repository', async () => {
    vi.spyOn(postRepository, 'findAll').mockResolvedValue({ data: [], total: 0 })

    await useCase.execute({ authorId: 'a1', replyToId: 'p1', page: 2, limit: 10, tags: ['tech'] })

    expect(postRepository.findAll).toHaveBeenCalledWith({
      authorId: 'a1',
      replyToId: 'p1',
      page: 2,
      limit: 10,
      tags: ['tech'],
    })
  })

  it('should return an empty list if no posts exist', async () => {
    vi.spyOn(postRepository, 'findAll').mockResolvedValue({ data: [], total: 0 })

    const response = await useCase.execute()

    expect(response).toEqual({ data: [], total: 0 })
    expect(postRepository.findAll).toHaveBeenCalledTimes(1)
  })
})
