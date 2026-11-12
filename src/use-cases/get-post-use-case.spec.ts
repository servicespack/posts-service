import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Post } from '../domain/entities/post'
import { PostNotFoundError } from './errors'
import { GetPostUseCase } from './get-post-use-case'

describe('getPostUseCase', () => {
  let postRepository: PostRepository
  let cache: ICacheAdapter
  let useCase: GetPostUseCase

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
    useCase = new GetPostUseCase(postRepository)
  })

  it('should return a post if found', async () => {
    const mockPost = new Post({ id: 'post-id', authorId: 'a1', text: 'Some text' })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(mockPost)

    const response = await useCase.execute({ id: 'post-id' })

    expect(response).toBe(mockPost)
    expect(postRepository.findById).toHaveBeenCalledTimes(1)
    expect(postRepository.findById).toHaveBeenCalledWith('post-id')
  })

  it('should throw an error if post is not found', async () => {
    vi.spyOn(postRepository, 'findById').mockResolvedValue(null)

    await expect(useCase.execute({ id: 'non-existing-id' })).rejects.toThrow(PostNotFoundError)
    expect(postRepository.findById).toHaveBeenCalledTimes(1)
    expect(postRepository.findById).toHaveBeenCalledWith('non-existing-id')
  })

  it('should return cached post without calling repository when cache hit', async () => {
    const cachedPost = new Post({ id: 'post-id', authorId: 'a1', text: 'Cached text' })
    vi.spyOn(cache, 'get').mockResolvedValue(cachedPost)

    const useCaseWithCache = new GetPostUseCase(postRepository, cache)
    const response = await useCaseWithCache.execute({ id: 'post-id' })

    expect(response).toBe(cachedPost)
    expect(postRepository.findById).not.toHaveBeenCalled()
  })

  it('should cache post after fetching from repository on cache miss', async () => {
    const mockPost = new Post({ id: 'post-id', authorId: 'a1', text: 'Some text' })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(mockPost)

    const useCaseWithCache = new GetPostUseCase(postRepository, cache)
    const response = await useCaseWithCache.execute({ id: 'post-id' })

    expect(response).toBe(mockPost)
    expect(postRepository.findById).toHaveBeenCalledTimes(1)
    expect(cache.set).toHaveBeenCalledTimes(1)
    expect(cache.set).toHaveBeenCalledWith(
      expect.stringContaining('posts:get:post-id'),
      mockPost,
      300,
    )
  })

  it('should fetch replies when includeReplies is true', async () => {
    const mockPost = new Post({ id: 'post-id', authorId: 'a1', text: 'Some text' })
    const replies = [new Post({ id: 'reply-1', authorId: 'a2', text: 'Reply', replyToId: 'post-id' })]
    vi.spyOn(postRepository, 'findById').mockResolvedValue(mockPost)
    vi.spyOn(postRepository, 'findAllReplies').mockResolvedValue(replies)

    const useCaseWithCache = new GetPostUseCase(postRepository, cache)
    await useCaseWithCache.execute({ id: 'post-id', includeReplies: true })

    expect(postRepository.findAllReplies).toHaveBeenCalledTimes(1)
    expect(mockPost.replies).toBeDefined()
    expect(mockPost.replies!.length).toBe(1)
  })

  it('should not fetch replies when includeReplies is false', async () => {
    const mockPost = new Post({ id: 'post-id', authorId: 'a1', text: 'Some text' })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(mockPost)

    const useCaseWithCache = new GetPostUseCase(postRepository, cache)
    await useCaseWithCache.execute({ id: 'post-id', includeReplies: false })

    expect(postRepository.findAllReplies).not.toHaveBeenCalled()
    expect(mockPost.replies).toBeUndefined()
  })
})
