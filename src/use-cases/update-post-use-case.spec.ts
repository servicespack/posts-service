import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PostNotFoundError, TextRequiredError } from './errors'
import { UpdatePostUseCase } from './update-post-use-case'

describe('updatePostUseCase', () => {
  let postRepository: PostRepository
  let useCase: UpdatePostUseCase

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
    useCase = new UpdatePostUseCase(postRepository)
  })

  it('should update a post successfully', async () => {
    vi.spyOn(postRepository, 'update').mockResolvedValue(true)

    const response = await useCase.execute({ id: 'post-id', text: 'Updated text' })

    expect(response).toEqual({ updated: true })
    expect(postRepository.update).toHaveBeenCalledTimes(1)
    expect(postRepository.update).toHaveBeenCalledWith('post-id', { text: 'Updated text' })
  })

  it('should update a post with tags successfully', async () => {
    vi.spyOn(postRepository, 'update').mockResolvedValue(true)

    const response = await useCase.execute({ id: 'post-id', tags: ['new-tag'] })

    expect(response).toEqual({ updated: true })
    expect(postRepository.update).toHaveBeenCalledTimes(1)
    expect(postRepository.update).toHaveBeenCalledWith('post-id', { tags: ['new-tag'] })
  })

  it('should not update if no data is provided', async () => {
    const response = await useCase.execute({ id: 'post-id' })

    expect(response).toEqual({ updated: false })
    expect(postRepository.update).not.toHaveBeenCalled()
  })

  it('should throw an error if updated text is empty', async () => {
    await expect(useCase.execute({ id: 'post-id', text: '   ' })).rejects.toThrow(
      TextRequiredError,
    )
    expect(postRepository.update).not.toHaveBeenCalled()
  })

  it('should throw an error if post is not found', async () => {
    vi.spyOn(postRepository, 'update').mockResolvedValue(false)

    await expect(useCase.execute({ id: 'non-existing-id', text: 'Some text' })).rejects.toThrow(
      PostNotFoundError,
    )
    expect(postRepository.update).toHaveBeenCalledTimes(1)
    expect(postRepository.update).toHaveBeenCalledWith('non-existing-id', { text: 'Some text' })
  })
})
