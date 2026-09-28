import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Post } from '../domain/entities/post'
import { PostIdAndUserIdRequiredError, PostNotFoundError } from './errors'
import { UnreactPostUseCase } from './unreact-post-use-case'

describe('unreactPostUseCase', () => {
  let postRepository: PostRepository
  let useCase: UnreactPostUseCase

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
    useCase = new UnreactPostUseCase(postRepository)
  })

  it('should remove a reaction successfully', async () => {
    const post = new Post({
      id: '1',
      authorId: 'a',
      text: 'Hello',
      reactions: [{ userId: 'user-1', type: 'LIKE' }, { userId: 'user-2', type: 'LOVE' }],
    })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(post)
    vi.spyOn(postRepository, 'unreact').mockResolvedValue(true)

    const response = await useCase.execute({ postId: '1', userId: 'user-1' })

    expect(response.success).toBe(true)
    expect(postRepository.findById).toHaveBeenCalledWith('1')
    expect(postRepository.unreact).toHaveBeenCalledWith('1', 'user-1')
  })

  it('should not update if user has no reaction', async () => {
    const post = new Post({
      id: '1',
      authorId: 'a',
      text: 'Hello',
      reactions: [{ userId: 'user-2', type: 'LOVE' }],
    })
    vi.spyOn(postRepository, 'findById').mockResolvedValue(post)
    vi.spyOn(postRepository, 'unreact').mockResolvedValue(true)

    const response = await useCase.execute({ postId: '1', userId: 'user-1' })

    expect(response.success).toBe(true)
    expect(postRepository.unreact).not.toHaveBeenCalled()
  })

  it('should throw error if post not found', async () => {
    vi.spyOn(postRepository, 'findById').mockResolvedValue(null)
    await expect(useCase.execute({ postId: '1', userId: 'user-1' }))
      .rejects
      .toThrow(PostNotFoundError)
  })

  it('should throw error if required fields are missing', async () => {
    await expect(useCase.execute({ postId: '', userId: 'user-1' }))
      .rejects
      .toThrow(PostIdAndUserIdRequiredError)
  })
})
