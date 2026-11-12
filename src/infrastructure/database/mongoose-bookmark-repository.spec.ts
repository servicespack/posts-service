import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Bookmark } from '../../domain/entities/bookmark'
import { BookmarkModel } from './models/bookmark-model'
import { MongooseBookmarkRepository } from './mongoose-bookmark-repository'

vi.mock('./models/bookmark-model')

describe('mongooseBookmarkRepository', () => {
  let repository: MongooseBookmarkRepository

  beforeEach(() => {
    repository = new MongooseBookmarkRepository()
    vi.resetAllMocks()
  })

  it('should create a bookmark successfully', async () => {
    const createdModel = { _id: { toString: () => 'bm-1' }, userId: 'u1', postId: 'p1', createdAt: new Date(), updatedAt: new Date() }
    BookmarkModel.create.mockResolvedValue(createdModel)
    const result = await repository.create(new Bookmark({ userId: 'u1', postId: 'p1' }))
    expect(result).toBe(true)
    expect(BookmarkModel.create).toHaveBeenCalled()
  })

  it('should return false when the bookmark already exists (duplicate key)', async () => {
    BookmarkModel.create.mockRejectedValue(Object.assign(new Error('E11000 duplicate key'), { code: 11000 }))
    const result = await repository.create(new Bookmark({ userId: 'u1', postId: 'p1' }))
    expect(result).toBe(false)
  })

  it('should rethrow unexpected create errors', async () => {
    BookmarkModel.create.mockRejectedValue(new Error('DB error'))
    await expect(repository.create(new Bookmark({ userId: 'u1', postId: 'p1' }))).rejects.toThrow('DB error')
  })

  it('should find all bookmarks for a user with pagination', async () => {
    const mockDoc = { _id: { toString: () => 'bm-1' }, userId: 'u1', postId: 'p1', createdAt: new Date() }
    BookmarkModel.find = vi.fn().mockReturnValue({ skip: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ sort: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([mockDoc]) }) }) }) }) as any
    BookmarkModel.countDocuments = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(1) }) as any

    const result = await repository.findAllByUser('u1', 1, 10)
    expect(result.data).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('should find a bookmark by post and user', async () => {
    const mockDoc = { _id: { toString: () => 'bm-1' }, userId: 'u1', postId: 'p1', createdAt: new Date() }
    BookmarkModel.findOne = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(mockDoc) }) as any

    const result = await repository.findByPostAndUser('p1', 'u1')
    expect(result).not.toBeNull()
    expect(result!.userId).toBe('u1')
    expect(result!.postId).toBe('p1')
  })

  it('should return null when bookmark not found', async () => {
    BookmarkModel.findOne = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(null) }) as any

    const result = await repository.findByPostAndUser('p1', 'u1')
    expect(result).toBeNull()
  })

  it('should delete a bookmark successfully', async () => {
    BookmarkModel.deleteOne = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue({ deletedCount: 1 }) }) as any
    const result = await repository.delete('bm-1', 'u1')
    expect(result).toBe(true)
    expect(BookmarkModel.deleteOne).toHaveBeenCalledWith({ _id: 'bm-1', userId: 'u1' })
  })

  it('should return false when delete fails', async () => {
    BookmarkModel.deleteOne = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue({ deletedCount: 0 }) }) as any
    const result = await repository.delete('bm-1', 'u1')
    expect(result).toBe(false)
  })
})
