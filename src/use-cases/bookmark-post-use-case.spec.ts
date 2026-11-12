import type { INotificationAdapter } from '../domain/adapters/notification-adapter'
import type { BookmarkRepository } from '../domain/repositories/bookmark-repository'
import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Bookmark } from '../domain/entities/bookmark'
import { Post } from '../domain/entities/post'
import { BookmarkPostUseCase } from './bookmark-post-use-case'
import { BookmarkAlreadyExistsError, PostNotFoundError } from './errors'

describe('bookmarkPostUseCase', () => {
  let bookmarkRepository: BookmarkRepository
  let postRepository: PostRepository
  let mockNotify: INotificationAdapter
  let useCase: BookmarkPostUseCase

  beforeEach(() => {
    bookmarkRepository = {
      create: vi.fn(),
      findAllByUser: vi.fn(),
      findByPostAndUser: vi.fn(),
      delete: vi.fn(),
    }
    postRepository = {
      findById: vi.fn().mockResolvedValue(new Post({ id: '1', authorId: 'author-1', text: 'Hello' })),
    } as unknown as PostRepository
    mockNotify = {
      notifyBookmark: vi.fn().mockResolvedValue(undefined),
      notifyReaction: vi.fn().mockResolvedValue(undefined),
      notifyReply: vi.fn().mockResolvedValue(undefined),
    }
    useCase = new BookmarkPostUseCase(bookmarkRepository, postRepository, mockNotify)
  })

  it('should bookmark a post successfully', async () => {
    vi.spyOn(bookmarkRepository, 'findByPostAndUser').mockResolvedValue(null)
    vi.spyOn(bookmarkRepository, 'create').mockResolvedValue(true)

    const response = await useCase.execute({
      postId: '1',
      userId: 'user-1',
    })

    expect(response.message).toBe('Post bookmarked successfully')
    expect(bookmarkRepository.findByPostAndUser).toHaveBeenCalledWith('1', 'user-1')
    expect(bookmarkRepository.create).toHaveBeenCalledOnce()
    expect(mockNotify.notifyBookmark).toHaveBeenCalledWith({
      userId: 'user-1',
      postId: '1',
    })
  })

  it('should throw PostNotFoundError and not create a bookmark if the post does not exist', async () => {
    vi.spyOn(postRepository, 'findById').mockResolvedValue(null)

    await expect(useCase.execute({ postId: '1', userId: 'user-1' })).rejects.toThrow(PostNotFoundError)
    expect(bookmarkRepository.create).not.toHaveBeenCalled()
  })

  it('should throw if bookmark already exists', async () => {
    vi.spyOn(bookmarkRepository, 'findByPostAndUser').mockResolvedValue({} as any)

    await expect(
      useCase.execute({
        postId: '1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(BookmarkAlreadyExistsError)
    expect(bookmarkRepository.create).not.toHaveBeenCalled()
  })

  it('should notify bookmark creation after successful bookmark', async () => {
    vi.spyOn(bookmarkRepository, 'findByPostAndUser').mockResolvedValue(null)
    vi.spyOn(bookmarkRepository, 'create').mockResolvedValue(true)

    await useCase.execute({ postId: '1', userId: 'user-1' })

    expect(mockNotify.notifyBookmark).toHaveBeenCalledWith({
      userId: 'user-1',
      postId: '1',
    })
  })

  it('should throw BookmarkAlreadyExistsError if creation hits the unique constraint', async () => {
    vi.spyOn(bookmarkRepository, 'findByPostAndUser').mockResolvedValue(null)
    vi.spyOn(bookmarkRepository, 'create').mockResolvedValue(false)

    await expect(useCase.execute({ postId: '1', userId: 'user-1' })).rejects.toThrow(BookmarkAlreadyExistsError)
    expect(mockNotify.notifyBookmark).not.toHaveBeenCalled()
  })

  it('should still return success if notification fails after bookmarking', async () => {
    vi.spyOn(bookmarkRepository, 'findByPostAndUser').mockResolvedValue(null)
    vi.spyOn(bookmarkRepository, 'create').mockResolvedValue(true)
    vi.spyOn(mockNotify, 'notifyBookmark').mockRejectedValue(new Error('notify down'))

    const response = await useCase.execute({ postId: '1', userId: 'user-1' })

    expect(response.message).toBe('Post bookmarked successfully')
  })

  it('should create a Bookmark entity with correct properties', async () => {
    vi.spyOn(bookmarkRepository, 'findByPostAndUser').mockResolvedValue(null)
    vi.spyOn(bookmarkRepository, 'create').mockImplementation(async (bookmark) => {
      expect(bookmark).toBeInstanceOf(Bookmark)
      expect(bookmark.userId).toBe('user-1')
      expect(bookmark.postId).toBe('1')
      return true
    })

    await useCase.execute({ postId: '1', userId: 'user-1' })
  })

  it('should not notify bookmark when no notifyAdapter is provided', async () => {
    const useCaseWithoutNotify = new BookmarkPostUseCase(bookmarkRepository, postRepository)
    vi.spyOn(bookmarkRepository, 'findByPostAndUser').mockResolvedValue(null)
    vi.spyOn(bookmarkRepository, 'create').mockResolvedValue(true)

    await useCaseWithoutNotify.execute({ postId: '1', userId: 'user-1' })

    expect(mockNotify.notifyBookmark).not.toHaveBeenCalled()
  })
})
