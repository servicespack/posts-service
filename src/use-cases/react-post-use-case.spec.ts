import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Post } from '../domain/entities/post'
import { PostIdUserIdAndTypeRequiredError, PostNotFoundError } from './errors'
import { ReactPostUseCase } from './react-post-use-case'

describe('reactPostUseCase', () => {
  let postRepository: PostRepository
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
})
