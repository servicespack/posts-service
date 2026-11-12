import type { INotificationAdapter } from '../domain/adapters/notification-adapter'
import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Post } from '../domain/entities/post'
import { PostIdUserIdAndTypeRequiredError, PostNotFoundError } from './errors'
import { ReactPostUseCase } from './react-post-use-case'

describe('reactPostUseCase', () => {
  let postRepository: PostRepository
  let notifyAdapter: INotificationAdapter
  let useCase: ReactPostUseCase

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
    notifyAdapter = {
      notifyReaction: vi.fn().mockResolvedValue(undefined),
    }
    useCase = new ReactPostUseCase(postRepository)
  })

  it('should add a reaction to a post successfully', async () => {
    const post = new Post({ id: '1', authorId: 'a', text: 'Hello' })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(post)
    vi.spyOn(postRepository, 'react').mockResolvedValue(true)

    const response = await useCase.execute({ postId: '1', userId: 'user-1', type: 'LIKE' })

    expect(response.success).toBe(true)
    expect(postRepository.findById).toHaveBeenCalledWith('1')
    expect(postRepository.react).toHaveBeenCalledWith('1', 'user-1', 'LIKE')
  })

  it('should update an existing reaction if type is different', async () => {
    const post = new Post({
      id: '1',
      authorId: 'a',
      text: 'Hello',
      reactions: [{ userId: 'user-1', type: 'LIKE' }],
    })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(post)
    vi.spyOn(postRepository, 'react').mockResolvedValue(true)

    const response = await useCase.execute({ postId: '1', userId: 'user-1', type: 'LOVE' })

    expect(response.success).toBe(true)
    expect(postRepository.react).toHaveBeenCalledWith('1', 'user-1', 'LOVE')
  })

  it('should not update if existing reaction has same type', async () => {
    const post = new Post({
      id: '1',
      authorId: 'a',
      text: 'Hello',
      reactions: [{ userId: 'user-1', type: 'LIKE' }],
    })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(post)
    vi.spyOn(postRepository, 'react').mockResolvedValue(true)

    const response = await useCase.execute({ postId: '1', userId: 'user-1', type: 'LIKE' })

    expect(response.success).toBe(true)
    expect(postRepository.react).toHaveBeenCalledWith('1', 'user-1', 'LIKE')
  })

  it('should throw error if post not found', async () => {
    vi.spyOn(postRepository, 'findById').mockResolvedValue(null)
    await expect(useCase.execute({ postId: '1', userId: 'user-1', type: 'LIKE' }))
      .rejects
      .toThrow(PostNotFoundError)
  })

  it('should throw error if required fields are missing', async () => {
    await expect(useCase.execute({ postId: '', userId: 'user-1', type: 'LIKE' }))
      .rejects
      .toThrow(PostIdUserIdAndTypeRequiredError)
  })

  it('should not notify reaction when the post author reacts on their own post', async () => {
    const post = new Post({ id: '1', authorId: 'user-1', text: 'Hello' })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(post)
    vi.spyOn(postRepository, 'react').mockResolvedValue(true)

    const useCaseWithNotify = new ReactPostUseCase(postRepository, notifyAdapter)
    await useCaseWithNotify.execute({ postId: '1', userId: 'user-1', type: 'LIKE' })

    expect(notifyAdapter.notifyReaction).not.toHaveBeenCalled()
  })

  it('should notify reaction when another user reacts on the post', async () => {
    const post = new Post({ id: '1', authorId: 'author-1', text: 'Hello' })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(post)
    vi.spyOn(postRepository, 'react').mockResolvedValue(true)

    const useCaseWithNotify = new ReactPostUseCase(postRepository, notifyAdapter)
    await useCaseWithNotify.execute({ postId: '1', userId: 'user-1', type: 'LIKE' })

    expect(notifyAdapter.notifyReaction).toHaveBeenCalledTimes(1)
    expect(notifyAdapter.notifyReaction).toHaveBeenCalledWith({
      userId: 'author-1',
      postId: '1',
      reactedByUserId: 'user-1',
      reactionType: 'LIKE',
    })
  })

  it('should not notify again when the same reaction is repeated', async () => {
    const post = new Post({ id: '1', authorId: 'author-1', text: 'Hello', reactions: [{ userId: 'user-1', type: 'LIKE' }] })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(post)
    vi.spyOn(postRepository, 'react').mockResolvedValue(true)

    const useCaseWithNotify = new ReactPostUseCase(postRepository, notifyAdapter)
    await useCaseWithNotify.execute({ postId: '1', userId: 'user-1', type: 'LIKE' })

    expect(notifyAdapter.notifyReaction).not.toHaveBeenCalled()
  })

  it('should invalidate post cache after reacting', async () => {
    const cache = { invalidatePattern: vi.fn().mockResolvedValue(undefined) } as any
    const post = new Post({ id: '1', authorId: 'author-1', text: 'Hello' })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(post)
    vi.spyOn(postRepository, 'react').mockResolvedValue(true)

    const useCaseWithCache = new ReactPostUseCase(postRepository, undefined, cache)
    await useCaseWithCache.execute({ postId: '1', userId: 'user-1', type: 'LIKE' })

    expect(cache.invalidatePattern).toHaveBeenCalledWith('posts:*')
  })

  it('should not notify reaction when no notifyAdapter is provided', async () => {
    const post = new Post({ id: '1', authorId: 'author-1', text: 'Hello' })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(post)
    vi.spyOn(postRepository, 'react').mockResolvedValue(true)

    await useCase.execute({ postId: '1', userId: 'user-1', type: 'LIKE' })

    expect(notifyAdapter.notifyReaction).not.toHaveBeenCalled()
  })
})
