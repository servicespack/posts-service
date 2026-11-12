import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { PaginatedResult, PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Post } from '../domain/entities/post'
import { ListPostsUseCase } from './list-posts-use-case'

describe('listPostsUseCase', () => {
  let postRepository: PostRepository
  let cache: ICacheAdapter
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
      getTrendingTags: vi.fn(),
      findAllReplies: vi.fn(),
    }
    cache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    } as unknown as ICacheAdapter
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

    await useCase.execute({ authorId: 'a1', replyToId: 'p1', page: 2, limit: 10, tags: ['tech'], search: 'hello' })

    expect(postRepository.findAll).toHaveBeenCalledWith({
      authorId: 'a1',
      replyToId: 'p1',
      page: 2,
      limit: 10,
      tags: ['tech'],
      search: 'hello',
    })
  })

  it('should pass parameters with multiple authorIds to repository', async () => {
    vi.spyOn(postRepository, 'findAll').mockResolvedValue({ data: [], total: 0 })

    await useCase.execute({ authorId: ['a1', 'a2'], replyToId: 'p1', page: 2, limit: 10, tags: ['tech'] })

    expect(postRepository.findAll).toHaveBeenCalledWith({
      authorId: ['a1', 'a2'],
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

  it('should return cached result when cache hit', async () => {
    const cachedResult: PaginatedResult<Post> = {
      data: [new Post({ id: '1', authorId: 'a1', text: 'Cached' })],
      total: 1,
    }
    vi.spyOn(cache, 'get').mockResolvedValue(cachedResult)

    const useCaseWithCache = new ListPostsUseCase(postRepository, cache)
    const response = await useCaseWithCache.execute()

    expect(response).toEqual(cachedResult)
    expect(postRepository.findAll).not.toHaveBeenCalled()
  })

  it('should cache result after fetching from repository on cache miss', async () => {
    const paginatedResult: PaginatedResult<Post> = {
      data: [new Post({ id: '1', authorId: 'a1', text: 'Post 1' })],
      total: 1,
    }
    vi.spyOn(postRepository, 'findAll').mockResolvedValue(paginatedResult)

    const useCaseWithCache = new ListPostsUseCase(postRepository, cache)
    const response = await useCaseWithCache.execute()

    expect(response).toEqual(paginatedResult)
    expect(postRepository.findAll).toHaveBeenCalledTimes(1)
    expect(cache.set).toHaveBeenCalledTimes(1)
    expect(cache.set).toHaveBeenCalledWith(
      expect.stringContaining('posts:list'),
      paginatedResult,
      300,
    )
  })

  it('should not share cache entries between different author and tag combinations', async () => {
    vi.spyOn(postRepository, 'findAll').mockResolvedValue({ data: [], total: 0 })
    const useCaseWithCache = new ListPostsUseCase(postRepository, cache)

    await useCaseWithCache.execute({ authorId: ['a,b'] })
    await useCaseWithCache.execute({ authorId: ['a', 'b'] })
    await useCaseWithCache.execute({ tags: ['x|search:y'] })
    await useCaseWithCache.execute({ tags: ['x'], search: 'y' })

    const keys = vi.mocked(cache.set).mock.calls.map(call => call[0])
    expect(new Set(keys).size).toBe(4)
  })

  it('should not cache when cache is not provided', async () => {
    vi.spyOn(postRepository, 'findAll').mockResolvedValue({ data: [], total: 0 })

    await useCase.execute()

    expect(cache.set).not.toHaveBeenCalled()
  })
})
