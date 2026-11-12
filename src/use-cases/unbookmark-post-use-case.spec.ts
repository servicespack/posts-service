import type { BookmarkRepository } from '../domain/repositories/bookmark-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BookmarkNotFoundError } from './errors'
import { UnbookmarkPostUseCase } from './unbookmark-post-use-case'

describe('unbookmarkPostUseCase', () => {
  let bookmarkRepository: BookmarkRepository
  let useCase: UnbookmarkPostUseCase

  beforeEach(() => {
    bookmarkRepository = {
      create: vi.fn(),
      findAllByUser: vi.fn(),
      findByPostAndUser: vi.fn(),
      delete: vi.fn(),
    }
    useCase = new UnbookmarkPostUseCase(bookmarkRepository)
  })

  it('should remove a bookmark successfully', async () => {
    vi.spyOn(bookmarkRepository, 'delete').mockResolvedValue(true)

    const response = await useCase.execute({ userId: 'user-1', bookmarkId: 'bm-1' })

    expect(response.message).toBe('Bookmark removed successfully')
    expect(bookmarkRepository.delete).toHaveBeenCalledWith('bm-1', 'user-1')
  })

  it('should not remove a bookmark owned by another user', async () => {
    vi.spyOn(bookmarkRepository, 'delete').mockResolvedValue(false)

    await expect(useCase.execute({ userId: 'user-2', bookmarkId: 'bm-1' }))
      .rejects
      .toThrow(BookmarkNotFoundError)
    expect(bookmarkRepository.delete).toHaveBeenCalledWith('bm-1', 'user-2')
  })

  it('should throw BookmarkNotFoundError if bookmark does not exist', async () => {
    vi.spyOn(bookmarkRepository, 'delete').mockResolvedValue(false)

    await expect(useCase.execute({ userId: 'user-1', bookmarkId: 'non-existent' }))
      .rejects
      .toThrow(BookmarkNotFoundError)
  })
})
