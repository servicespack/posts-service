import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetTrendingTagsUseCase } from './get-trending-tags-use-case'

describe('getTrendingTagsUseCase', () => {
  let postRepository: PostRepository
  let cache: ICacheAdapter
  let useCase: GetTrendingTagsUseCase

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
    useCase = new GetTrendingTagsUseCase(postRepository)
  })

  it('should get trending tags successfully', async () => {
    const mockTrending = [
      { tag: 'nodejs', count: 5 },
      { tag: 'typescript', count: 3 },
    ]
    vi.spyOn(postRepository, 'getTrendingTags').mockResolvedValue(mockTrending)

    const response = await useCase.execute({ limit: 5 })

    expect(response).toEqual(mockTrending)
    expect(postRepository.getTrendingTags).toHaveBeenCalledTimes(1)
    expect(postRepository.getTrendingTags).toHaveBeenCalledWith(5)
  })

  it('should use undefined limit as default if not passed', async () => {
    vi.spyOn(postRepository, 'getTrendingTags').mockResolvedValue([])

    await useCase.execute()

    expect(postRepository.getTrendingTags).toHaveBeenCalledWith(undefined)
  })

  it('should return cached result when cache hit', async () => {
    const cachedTrending = [{ tag: 'cached', count: 10 }]
    vi.spyOn(cache, 'get').mockResolvedValue(cachedTrending)

    const useCaseWithCache = new GetTrendingTagsUseCase(postRepository, cache)
    const response = await useCaseWithCache.execute({ limit: 5 })

    expect(response).toEqual(cachedTrending)
    expect(postRepository.getTrendingTags).not.toHaveBeenCalled()
  })

  it('should cache trending tags after fetching from repository on cache miss', async () => {
    const mockTrending = [{ tag: 'nodejs', count: 5 }]
    vi.spyOn(postRepository, 'getTrendingTags').mockResolvedValue(mockTrending)

    const useCaseWithCache = new GetTrendingTagsUseCase(postRepository, cache)
    const response = await useCaseWithCache.execute({ limit: 5 })

    expect(response).toEqual(mockTrending)
    expect(postRepository.getTrendingTags).toHaveBeenCalledTimes(1)
    expect(cache.set).toHaveBeenCalledTimes(1)
    expect(cache.set).toHaveBeenCalledWith('tags:trending:5', mockTrending, 300)
  })

  it('should use default cache key when no limit and no cache', async () => {
    vi.spyOn(postRepository, 'getTrendingTags').mockResolvedValue([])

    await useCase.execute()

    expect(postRepository.getTrendingTags).toHaveBeenCalledWith(undefined)
  })
})
