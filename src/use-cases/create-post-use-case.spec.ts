import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { INotificationAdapter } from '../domain/adapters/notification-adapter'
import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Post } from '../domain/entities/post'
import { CreatePostUseCase } from './create-post-use-case'
import { AuthorIdRequiredError, ParentPostNotFoundError, TextRequiredError } from './errors'

describe(CreatePostUseCase.name, () => {
  let postRepository: PostRepository
  let notifyAdapter: INotificationAdapter
  let cache: ICacheAdapter
  let useCase: CreatePostUseCase

  beforeEach(() => {
    postRepository = {
      create: vi.fn().mockImplementation(async post => post),
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
      notifyReply: vi.fn().mockResolvedValue(undefined),
      notifyReaction: vi.fn().mockResolvedValue(undefined),
      notifyBookmark: vi.fn().mockResolvedValue(undefined),
    }
    cache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      invalidatePattern: vi.fn().mockResolvedValue(undefined),
    } as unknown as ICacheAdapter
    useCase = new CreatePostUseCase(postRepository)
  })

  it('should create a post successfully', async () => {
    const response = await useCase.execute({ authorId: 'author-1', text: 'Hello World' })

    expect(response).toStrictEqual({ created: true, post: expect.any(Post) })
    expect(response.post.authorId).toBe('author-1')
    expect(response.post.text).toBe('Hello World')
    expect(response.post.tags).toEqual([])
    expect(response.post.replyToId).toBeUndefined()
    expect(postRepository.create).toHaveBeenCalledTimes(1)
    expect(postRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Hello World', authorId: 'author-1', tags: [] }),
    )
  })

  it('should create a post with tags successfully', async () => {
    const response = await useCase.execute({ authorId: 'author-1', text: 'Hello World', tags: ['news', 'tech'] })

    expect(response).toStrictEqual({ created: true, post: expect.any(Post) })
    expect(response.post.tags).toEqual(['news', 'tech'])
  })

  it('should create a reply post successfully', async () => {
    postRepository.findById = vi.fn().mockResolvedValue(new Post({ id: 'parent-1', authorId: 'a', text: 'a' }))

    const response = await useCase.execute({ authorId: 'author-1', text: 'Hello World', replyToId: 'parent-1' })

    expect(response).toStrictEqual({ created: true, post: expect.any(Post) })
    expect(response.post.replyToId).toBe('parent-1')
    expect(postRepository.findById).toHaveBeenCalledTimes(1)
    expect(postRepository.findById).toHaveBeenCalledWith('parent-1')
    expect(postRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ replyToId: 'parent-1' }),
    )
  })

  it('should throw an error if parent post does not exist', async () => {
    postRepository.findById = vi.fn().mockResolvedValue(null)
    await expect(useCase.execute({ authorId: 'author-1', text: 'Hello', replyToId: 'parent-1' })).rejects.toThrowError(ParentPostNotFoundError)
    expect(postRepository.create).not.toHaveBeenCalled()
  })

  it('should throw an error if text is missing', async () => {
    await expect(useCase.execute({ authorId: 'author-1', text: '' })).rejects.toThrowError(TextRequiredError)
    expect(postRepository.create).not.toHaveBeenCalled()
  })

  it('should throw an error if authorId is missing', async () => {
    await expect(useCase.execute({ authorId: '', text: 'Hello' })).rejects.toThrowError(AuthorIdRequiredError)
    expect(postRepository.create).not.toHaveBeenCalled()
  })

  it('should not notify reply when user replies to their own post', async () => {
    postRepository.findById = vi.fn().mockResolvedValue(new Post({ id: 'parent-1', authorId: 'author-1', text: 'a' }))
    const useCaseWithNotify = new CreatePostUseCase(postRepository, notifyAdapter)

    await useCaseWithNotify.execute({ authorId: 'author-1', text: 'Hello', replyToId: 'parent-1' })

    expect(notifyAdapter.notifyReply).not.toHaveBeenCalled()
  })

  it('should notify reply when user replies to another user post', async () => {
    postRepository.findById = vi.fn().mockResolvedValue(new Post({ id: 'parent-1', authorId: 'other-user', text: 'a' }))
    const useCaseWithNotify = new CreatePostUseCase(postRepository, notifyAdapter)

    await useCaseWithNotify.execute({ authorId: 'author-1', text: 'Hello', replyToId: 'parent-1' })

    expect(notifyAdapter.notifyReply).toHaveBeenCalledTimes(1)
    expect(notifyAdapter.notifyReply).toHaveBeenCalledWith({
      userId: 'other-user',
      postId: 'parent-1',
      repliedByUserId: 'author-1',
    })
  })

  it('should not notify reply when there is no replyToId', async () => {
    const useCaseWithNotify = new CreatePostUseCase(postRepository, notifyAdapter)

    await useCaseWithNotify.execute({ authorId: 'author-1', text: 'Hello' })

    expect(notifyAdapter.notifyReply).not.toHaveBeenCalled()
  })

  it('should invalidate cache after creating a post', async () => {
    useCase = new CreatePostUseCase(postRepository, undefined, cache)

    await useCase.execute({ authorId: 'author-1', text: 'Hello' })

    expect(cache.invalidatePattern).toHaveBeenCalledTimes(2)
    expect(cache.invalidatePattern).toHaveBeenCalledWith('posts:*')
    expect(cache.invalidatePattern).toHaveBeenCalledWith('tags:*')
  })

  it('should create a post with tags and pass them to repository', async () => {
    const response = await useCase.execute({ authorId: 'author-1', text: 'Hello', tags: ['news', 'tech'] })

    expect(response.post.tags).toEqual(['news', 'tech'])
    expect(postRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['news', 'tech'], authorId: 'author-1', text: 'Hello' }),
    )
  })
})
