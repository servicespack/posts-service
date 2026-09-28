import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeletePostUseCase } from './delete-post-use-case'
import { PostNotFoundError } from './errors'

describe('deletePostUseCase', () => {
  let postRepository: PostRepository
  let useCase: DeletePostUseCase

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
    useCase = new DeletePostUseCase(postRepository)
  })

  it('should delete a post successfully', async () => {
    vi.spyOn(postRepository, 'delete').mockResolvedValue(true)

    const response = await useCase.execute({ id: 'post-id' })

    expect(response).toEqual({ deleted: true })
    expect(postRepository.delete).toHaveBeenCalledTimes(1)
    expect(postRepository.delete).toHaveBeenCalledWith('post-id')
  })

  it('should throw an error if post does not exist', async () => {
    vi.spyOn(postRepository, 'delete').mockResolvedValue(false)

    await expect(useCase.execute({ id: 'non-existing-id' })).rejects.toThrow(PostNotFoundError)
    expect(postRepository.delete).toHaveBeenCalledTimes(1)
    expect(postRepository.delete).toHaveBeenCalledWith('non-existing-id')
  })
})
