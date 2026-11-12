import type { BookmarkRepository } from '../domain/repositories/bookmark-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListBookmarksUseCase } from './list-bookmarks-use-case'

describe('listBookmarksUseCase', () => {
  let bookmarkRepository: BookmarkRepository
  let useCase: ListBookmarksUseCase

  beforeEach(() => {
    bookmarkRepository = {
      create: vi.fn(),
      findAllByUser: vi.fn(),
      findByPostAndUser: vi.fn(),
      delete: vi.fn(),
      deleteByPostAndUser: vi.fn(),
    }
    useCase = new ListBookmarksUseCase(bookmarkRepository)
  })

  it('should list bookmarks for a user', async () => {
    const mockBookmarks = [
      { id: 'bm-1', userId: 'u1', postId: 'p1', createdAt: new Date() },
      { id: 'bm-2', userId: 'u1', postId: 'p2', createdAt: new Date() },
    ]
    vi.spyOn(bookmarkRepository, 'findAllByUser').mockResolvedValue({
      data: mockBookmarks,
      total: 2,
    })

    const response = await useCase.execute({ userId: 'u1' })

    expect(response.data).toEqual([
      { bookmarkId: 'bm-1', postId: 'p1' },
      { bookmarkId: 'bm-2', postId: 'p2' },
    ])
    expect(response.total).toBe(2)
  })

  it('should pass pagination parameters to the repository', async () => {
    vi.spyOn(bookmarkRepository, 'findAllByUser').mockResolvedValue({ data: [], total: 0 })

    await useCase.execute({ userId: 'u1', page: 2, limit: 10 })

    expect(bookmarkRepository.findAllByUser).toHaveBeenCalledWith('u1', 2, 10)
  })

  it('should return empty list when user has no bookmarks', async () => {
    vi.spyOn(bookmarkRepository, 'findAllByUser').mockResolvedValue({ data: [], total: 0 })

    const response = await useCase.execute({ userId: 'u1' })

    expect(response.data).toEqual([])
    expect(response.total).toBe(0)
  })
})
