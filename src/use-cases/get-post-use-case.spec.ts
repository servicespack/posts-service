import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Post } from '../domain/entities/post'
import { PostNotFoundError } from './errors'
import { GetPostUseCase } from './get-post-use-case'

describe('getPostUseCase', () => {
  let postRepository: PostRepository
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
    }
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
})
