import { beforeEach, describe, expect, it } from 'vitest'
import { Bookmark } from '../../../src/domain/entities/bookmark'
import { LowdbBookmarkRepository } from '../../../src/infrastructure/database/lowdb-bookmark-repository'
import { initializeLowdbWithMemory } from '../../../src/infrastructure/database/lowdb/connection'

describe('lowdbBookmarkRepository Integration Tests', () => {
  let repository: LowdbBookmarkRepository

  beforeEach(() => {
    initializeLowdbWithMemory()
    repository = new LowdbBookmarkRepository()
  })

  it('should create a bookmark', async () => {
    const bookmark = new Bookmark({ userId: 'u1', postId: 'p1' })
    const result = await repository.create(bookmark)
    expect(result).toBe(true)
  })

  it('should return false when creating a duplicate bookmark', async () => {
    const bookmark = new Bookmark({ userId: 'u1', postId: 'p1' })
    await repository.create(bookmark)
    const result = await repository.create(bookmark)
    expect(result).toBe(false)
  })

  it('should find all bookmarks by user with pagination', async () => {
    await repository.create(new Bookmark({ userId: 'u1', postId: 'p1' }))
    await repository.create(new Bookmark({ userId: 'u1', postId: 'p2' }))
    await repository.create(new Bookmark({ userId: 'u2', postId: 'p3' }))

    const allByUser = await repository.findAllByUser('u1')
    expect(allByUser.total).toBe(2)
    expect(allByUser.data).toHaveLength(2)
  })

  it('should find bookmark by post and user', async () => {
    await repository.create(new Bookmark({ userId: 'u1', postId: 'p1' }))
    await repository.create(new Bookmark({ userId: 'u2', postId: 'p1' }))

    const found = await repository.findByPostAndUser('p1', 'u1')
    expect(found).not.toBeNull()
    expect(found?.userId).toBe('u1')
    expect(found?.postId).toBe('p1')

    const notFound = await repository.findByPostAndUser('p1', 'u3')
    expect(notFound).toBeNull()
  })

  it('should delete a bookmark by id', async () => {
    const bookmark = new Bookmark({ userId: 'u1', postId: 'p1' })
    await repository.create(bookmark)

    const all = await repository.findAllByUser('u1')
    const id = all.data[0].id!

    const deleted = await repository.delete(id, 'u1')
    expect(deleted).toBe(true)

    const again = await repository.findAllByUser('u1')
    expect(again.total).toBe(0)
  })

  it('should not delete a bookmark owned by another user', async () => {
    await repository.create(new Bookmark({ userId: 'u1', postId: 'p1' }))
    const id = (await repository.findAllByUser('u1')).data[0].id!

    const result = await repository.delete(id, 'u2')
    expect(result).toBe(false)
    expect((await repository.findAllByUser('u1')).total).toBe(1)
  })

  it('should return false when deleting non-existing bookmark', async () => {
    const result = await repository.delete('non-existing-id', 'u1')
    expect(result).toBe(false)
  })
})
