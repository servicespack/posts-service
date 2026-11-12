import { beforeEach, describe, expect, it } from 'vitest'
import { Post } from '../../../src/domain/entities/post'
import { LowdbPostRepository } from '../../../src/infrastructure/database/lowdb-post-repository'
import { initializeLowdbWithMemory } from '../../../src/infrastructure/database/lowdb/connection'

describe('lowdbPostRepository Integration Tests', () => {
  let repository: LowdbPostRepository

  beforeEach(() => {
    initializeLowdbWithMemory()
    repository = new LowdbPostRepository()
  })

  it('should create a post in the database', async () => {
    const post = new Post({ authorId: 'a1', text: 'Integration Test Post', tags: ['integration'] })
    const created = await repository.create(post)

    expect(created.id).toBeDefined()
    expect(created.authorId).toBe('a1')
    expect(created.text).toBe('Integration Test Post')
    expect(created.tags).toEqual(['integration'])
    expect(created.createdAt).toBeInstanceOf(Date)
    expect(created.updatedAt).toBeInstanceOf(Date)
    expect(created.deletedAt).toBeNull()
  })

  it('should find active posts with pagination and filters', async () => {
    const repo = repository

    await repo.create(new Post({ authorId: 'a1', text: 'Post 1', tags: ['tech'] }))
    await repo.create(new Post({ authorId: 'a1', text: 'Post 2', tags: ['news'] }))
    await repo.create(new Post({ authorId: 'a2', text: 'Post 3', tags: ['tech'] }))
    // Deleted post
    const deleted = await repo.create(new Post({ authorId: 'a1', text: 'Post 4', tags: ['tech'] }))
    await repo.delete(deleted.id!)

    const allPosts = await repo.findAll()
    expect(allPosts.total).toBe(3)

    const filteredByAuthor = await repo.findAll({ authorId: 'a1' })
    expect(filteredByAuthor.total).toBe(2)

    const filteredByMultipleAuthors = await repo.findAll({ authorId: ['a1', 'a2'] })
    expect(filteredByMultipleAuthors.total).toBe(3)

    const filteredByTags = await repo.findAll({ tags: ['tech'] })
    expect(filteredByTags.total).toBe(2)

    const paginated = await repo.findAll({ limit: 1, page: 2 })
    expect(paginated.data).toHaveLength(1)
    expect(paginated.total).toBe(3)
  })

  it('should find post by id', async () => {
    const created = await repository.create(new Post({ authorId: 'a1', text: 'Find Me' }))

    const found = await repository.findById(created.id!)

    expect(found).not.toBeNull()
    expect(found?.text).toBe('Find Me')
  })

  it('should return null if finding a deleted post or non-existing id', async () => {
    const created = await repository.create(new Post({ authorId: 'a1', text: 'Deleted' }))
    await repository.delete(created.id!)

    const foundDeleted = await repository.findById(created.id!)
    const foundNonExisting = await repository.findById('non-existing-id')

    expect(foundDeleted).toBeNull()
    expect(foundNonExisting).toBeNull()
  })

  it('should update a post successfully', async () => {
    const post = await repository.create(new Post({ authorId: 'a1', text: 'Original text' }))

    const updated = await repository.update(post.id!, { text: 'New text', tags: ['new'] })

    expect(updated).toBe(true)

    const found = await repository.findById(post.id!)
    expect(found?.text).toBe('New text')
    expect(found?.tags).toContain('new')
  })

  it('should return false if updating non-existing or deleted post', async () => {
    const post = await repository.create(new Post({ authorId: 'a1', text: 'Deleted' }))
    await repository.delete(post.id!)

    const updatedDeleted = await repository.update(post.id!, { text: 'New text' })
    const updatedNonExisting = await repository.update('non-existing-id', { text: 'New text' })

    expect(updatedDeleted).toBe(false)
    expect(updatedNonExisting).toBe(false)
  })

  it('should soft delete a post successfully', async () => {
    const post = await repository.create(new Post({ authorId: 'a1', text: 'To delete' }))

    const deleted = await repository.delete(post.id!)

    expect(deleted).toBe(true)

    const found = await repository.findById(post.id!)
    expect(found).toBeNull()

    // Verify it still exists with deletedAt set
    const all = await repository.findAll()
    expect(all.data).toHaveLength(0)
  })

  it('should return false if deleting non-existing or already deleted post', async () => {
    const post = await repository.create(new Post({ authorId: 'a1', text: 'Deleted' }))
    await repository.delete(post.id!)

    const deletedAlready = await repository.delete(post.id!)
    const deletedNonExisting = await repository.delete('non-existing-id')

    expect(deletedAlready).toBe(false)
    expect(deletedNonExisting).toBe(false)
  })

  it('should ignore empty tags array filter', async () => {
    await repository.create(new Post({ authorId: 'a1', text: 'Post 1' }))
    const result = await repository.findAll({ tags: [] })
    expect(result.data).toHaveLength(1)
  })

  it('should filter posts by search query (case-insensitive on text)', async () => {
    await repository.create(new Post({ authorId: 'a1', text: 'This is a nice post about cats' }))
    await repository.create(new Post({ authorId: 'a1', text: 'Another post about Dogs' }))
    await repository.create(new Post({ authorId: 'a1', text: 'Cats and Dogs together' }))

    const searchCats = await repository.findAll({ search: 'cats' })
    expect(searchCats.total).toBe(2)
    expect(searchCats.data.map(p => p.text)).toContain('This is a nice post about cats')
    expect(searchCats.data.map(p => p.text)).toContain('Cats and Dogs together')

    const searchDogs = await repository.findAll({ search: 'DOG' })
    expect(searchDogs.total).toBe(2)
    expect(searchDogs.data.map(p => p.text)).toContain('Another post about Dogs')
    expect(searchDogs.data.map(p => p.text)).toContain('Cats and Dogs together')
  })

  it('should handle invalid or default pagination page and limit values', async () => {
    await repository.create(new Post({ authorId: 'a1', text: 'Post 1' }))
    await repository.create(new Post({ authorId: 'a1', text: 'Post 2' }))

    const p1 = await repository.findAll({ page: -1, limit: 1 })
    expect(p1.data).toHaveLength(1)
    expect(p1.data[0].text).toBe('Post 1')

    const p2 = await repository.findAll({ limit: -5 })
    expect(p2.data).toHaveLength(2)

    const p3 = await repository.findAll({ page: 0, limit: 1 })
    expect(p3.data).toHaveLength(1)
    expect(p3.data[0].text).toBe('Post 1')
  })

  it('should default limit to 10 when limit is 0 or undefined', async () => {
    for (let i = 1; i <= 12; i++) {
      await repository.create(new Post({ authorId: 'a1', text: `Post ${i}` }))
    }

    const p = await repository.findAll({ limit: 0 })
    expect(p.data).toHaveLength(10)
    expect(p.total).toBe(12)

    const p2 = await repository.findAll({ limit: undefined })
    expect(p2.data).toHaveLength(10)
  })

  it('should calculate skip correctly when page is greater than 1', async () => {
    await repository.create(new Post({ authorId: 'a1', text: 'Post 1' }))
    await repository.create(new Post({ authorId: 'a1', text: 'Post 2' }))
    await repository.create(new Post({ authorId: 'a1', text: 'Post 3' }))

    const paginated = await repository.findAll({ limit: 2, page: 2 })
    expect(paginated.data).toHaveLength(1)
    expect(paginated.data[0].text).toBe('Post 3')
  })

  it('should map models to domain objects correctly', async () => {
    await repository.create(new Post({ authorId: 'a1', text: 'Post 1' }))
    const result = await repository.findAll()
    expect(result.data[0]).toBeInstanceOf(Post)
    expect(result.data[0].text).toBe('Post 1')
  })

  it('should update reactions successfully', async () => {
    const post = await repository.create(new Post({ authorId: 'a1', text: 'Some text', reactions: [] }))

    const updated = await repository.update(post.id!, { reactions: [{ userId: 'u1', type: 'LIKE' }] })
    expect(updated).toBe(true)

    const found = await repository.findById(post.id!)
    expect(found?.reactions[0].userId).toBe('u1')
    expect(found?.reactions[0].type).toBe('LIKE')
    expect(found?.text).toBe('Some text')
  })

  it('should atomically react to a post successfully', async () => {
    const post = await repository.create(new Post({ authorId: 'a1', text: 'Some text', reactions: [] }))
    const id = post.id!

    const reacted1 = await repository.react(id, 'u1', 'LIKE')
    expect(reacted1).toBe(true)
    let found = await repository.findById(id)
    expect(found?.reactions).toHaveLength(1)
    expect(found?.reactions[0].userId).toBe('u1')
    expect(found?.reactions[0].type).toBe('LIKE')

    const reacted2 = await repository.react(id, 'u1', 'LOVE')
    expect(reacted2).toBe(true)
    found = await repository.findById(id)
    expect(found?.reactions).toHaveLength(1)
    expect(found?.reactions[0].userId).toBe('u1')
    expect(found?.reactions[0].type).toBe('LOVE')

    const reacted3 = await repository.react(id, 'u1', 'LOVE')
    expect(reacted3).toBe(true)
    found = await repository.findById(id)
    expect(found?.reactions).toHaveLength(1)

    const reactedInvalid = await repository.react('invalid-id', 'u1', 'LIKE')
    expect(reactedInvalid).toBe(false)
  })

  it('should atomically unreact from a post successfully', async () => {
    const post = await repository.create(new Post({
      authorId: 'a1',
      text: 'Some text',
      reactions: [{ userId: 'u1', type: 'LIKE' }, { userId: 'u2', type: 'LOVE' }],
    }))
    const id = post.id!

    const unreacted1 = await repository.unreact(id, 'u1')
    expect(unreacted1).toBe(true)
    const found = await repository.findById(id)
    expect(found?.reactions).toHaveLength(1)
    expect(found?.reactions[0].userId).toBe('u2')

    const unreacted2 = await repository.unreact(id, 'u1')
    expect(unreacted2).toBe(false)

    const unreactedInvalid = await repository.unreact('invalid-id', 'u1')
    expect(unreactedInvalid).toBe(false)
  })

  it('should return false if updating with no fields provided', async () => {
    const post = await repository.create(new Post({ authorId: 'a1', text: 'Some text' }))
    const updated = await repository.update(post.id!, {})
    expect(updated).toBe(false)
  })

  it('should get trending tags correctly', async () => {
    await repository.create(new Post({ authorId: 'a1', text: 'Post 1', tags: ['nodejs', 'typescript'] }))
    await repository.create(new Post({ authorId: 'a2', text: 'Post 2', tags: ['nodejs', 'typescript', 'mongodb'] }))
    await repository.create(new Post({ authorId: 'a1', text: 'Post 3', tags: ['nodejs'] }))
    // Deleted post should be ignored
    const deleted = await repository.create(new Post({ authorId: 'a1', text: 'Post 4', tags: ['nodejs', 'deleted_tag'] }))
    await repository.delete(deleted.id!)

    const trending = await repository.getTrendingTags()
    expect(trending).toHaveLength(3)
    expect(trending[0]).toEqual({ tag: 'nodejs', count: 3 })
    expect(trending[1]).toEqual({ tag: 'typescript', count: 2 })
    expect(trending[2]).toEqual({ tag: 'mongodb', count: 1 })

    const trendingLimited = await repository.getTrendingTags(1)
    expect(trendingLimited).toHaveLength(1)
    expect(trendingLimited[0]).toEqual({ tag: 'nodejs', count: 3 })
  })

  it('should fetch and populate repliesCount correctly', async () => {
    const parent = await repository.create(new Post({ authorId: 'a1', text: 'Parent post' }))
    const parentId = parent.id!

    await repository.create(new Post({ authorId: 'a2', text: 'Reply 1', replyToId: parentId }))
    await repository.create(new Post({ authorId: 'a3', text: 'Reply 2', replyToId: parentId }))
    const deletedReply = await repository.create(new Post({ authorId: 'a4', text: 'Deleted reply', replyToId: parentId }))
    await repository.delete(deletedReply.id!)

    // Test findById on parent
    const foundParent = await repository.findById(parentId)
    expect(foundParent).not.toBeNull()
    expect(foundParent?.repliesCount).toBe(2)

    // Test findAll on parent
    const allPosts = await repository.findAll({ search: 'Parent' })
    expect(allPosts.total).toBe(1)
    expect(allPosts.data[0].repliesCount).toBe(2)

    // Test create (should be 0)
    const newPost = await repository.create(new Post({ authorId: 'a5', text: 'New post' }))
    expect(newPost.repliesCount).toBe(0)
  })

  it('should findAllReplies with depth limit', async () => {
    const parent = await repository.create(new Post({ authorId: 'a1', text: 'Root' }))
    const pid = parent.id!

    const r1 = await repository.create(new Post({ authorId: 'a2', text: 'Level 1', replyToId: pid }))
    const r1id = r1.id!
    const r2 = await repository.create(new Post({ authorId: 'a3', text: 'Level 2', replyToId: r1id }))
    const r2id = r2.id!
    await repository.create(new Post({ authorId: 'a4', text: 'Level 3', replyToId: r2id }))

    const depth1 = await repository.findAllReplies(pid, 1)
    expect(depth1).toHaveLength(1)
    expect(depth1[0].text).toBe('Level 1')

    const depth2 = await repository.findAllReplies(pid, 2)
    expect(depth2).toHaveLength(2)
    expect(depth2.map(p => p.text)).toContain('Level 1')
    expect(depth2.map(p => p.text)).toContain('Level 2')

    const depth3 = await repository.findAllReplies(pid, 3)
    expect(depth3).toHaveLength(3)
  })
})
