import process from 'node:process'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Post } from '../../../src/domain/entities/post'
import { initializeDatabase } from '../../../src/infrastructure/database/connection'
import { PostModel } from '../../../src/infrastructure/database/models/post-model'
import { MongoosePostRepository } from '../../../src/infrastructure/database/mongoose-post-repository'

describe('mongoosePostRepository Integration Tests', () => {
  let mongoServer: MongoMemoryServer
  let repository: MongoosePostRepository

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    process.env.MONGODB_URI = uri
    await initializeDatabase()
    repository = new MongoosePostRepository()
  })

  beforeEach(async () => {
    await PostModel.deleteMany({})
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
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

    // Verify it was actually saved in the DB
    const dbPost = await PostModel.findById(created.id)
    expect(dbPost).not.toBeNull()
    expect(dbPost?.text).toBe('Integration Test Post')
  })

  it('should find active posts with pagination and filters', async () => {
    await PostModel.create({ authorId: 'a1', text: 'Post 1', tags: ['tech'] })
    await PostModel.create({ authorId: 'a1', text: 'Post 2', tags: ['news'] })
    await PostModel.create({ authorId: 'a2', text: 'Post 3', tags: ['tech'] })
    // Deleted post
    await PostModel.create({ authorId: 'a1', text: 'Post 4', tags: ['tech'], deletedAt: new Date() })

    const allPosts = await repository.findAll()
    expect(allPosts.total).toBe(3)

    const filteredByAuthor = await repository.findAll({ authorId: 'a1' })
    expect(filteredByAuthor.total).toBe(2)

    const filteredByTags = await repository.findAll({ tags: ['tech'] })
    expect(filteredByTags.total).toBe(2)

    const paginated = await repository.findAll({ limit: 1, page: 2 })
    expect(paginated.data).toHaveLength(1)
    expect(paginated.total).toBe(3)
  })

  it('should find post by id', async () => {
    const postDoc = await PostModel.create({ authorId: 'a1', text: 'Find Me' })

    const found = await repository.findById(postDoc._id.toString())

    expect(found).not.toBeNull()
    expect(found?.text).toBe('Find Me')
  })

  it('should return null if finding a deleted post or non-existing id', async () => {
    const postDoc = await PostModel.create({ authorId: 'a1', text: 'Deleted', deletedAt: new Date() })

    const foundDeleted = await repository.findById(postDoc._id.toString())
    const foundNonExisting = await repository.findById(new mongoose.Types.ObjectId().toString())
    const foundInvalid = await repository.findById('invalid-id')

    expect(foundDeleted).toBeNull()
    expect(foundNonExisting).toBeNull()
    expect(foundInvalid).toBeNull()
  })

  it('should update a post successfully', async () => {
    const postDoc = await PostModel.create({ authorId: 'a1', text: 'Original text' })

    const updated = await repository.update(postDoc._id.toString(), { text: 'New text', tags: ['new'] })

    expect(updated).toBe(true)

    const dbPost = await PostModel.findById(postDoc._id)
    expect(dbPost?.text).toBe('New text')
    expect(dbPost?.tags).toContain('new')
  })

  it('should return false if updating non-existing or deleted post', async () => {
    const postDoc = await PostModel.create({ authorId: 'a1', text: 'Deleted', deletedAt: new Date() })
    const nonExistingId = new mongoose.Types.ObjectId().toString()

    const updatedDeleted = await repository.update(postDoc._id.toString(), { text: 'New text' })
    const updatedNonExisting = await repository.update(nonExistingId, { text: 'New text' })
    const updatedInvalid = await repository.update('invalid-id', { text: 'New text' })

    expect(updatedDeleted).toBe(false)
    expect(updatedNonExisting).toBe(false)
    expect(updatedInvalid).toBe(false)
  })

  it('should soft delete a post successfully', async () => {
    const postDoc = await PostModel.create({ authorId: 'a1', text: 'To delete' })

    const deleted = await repository.delete(postDoc._id.toString())

    expect(deleted).toBe(true)

    const dbPost = await PostModel.findById(postDoc._id)
    expect(dbPost?.deletedAt).toBeInstanceOf(Date)
  })

  it('should return false if deleting non-existing or already deleted post', async () => {
    const postDoc = await PostModel.create({ authorId: 'a1', text: 'Deleted', deletedAt: new Date() })
    const nonExistingId = new mongoose.Types.ObjectId().toString()

    const deletedAlready = await repository.delete(postDoc._id.toString())
    const deletedNonExisting = await repository.delete(nonExistingId)
    const deletedInvalid = await repository.delete('invalid-id')

    expect(deletedAlready).toBe(false)
    expect(deletedNonExisting).toBe(false)
    expect(deletedInvalid).toBe(false)
  })

  it('should ignore empty tags array filter', async () => {
    await PostModel.create({ authorId: 'a1', text: 'Post 1' })
    const result = await repository.findAll({ tags: [] })
    expect(result.data).toHaveLength(1)
  })

  it('should handle invalid or default pagination page and limit values', async () => {
    await PostModel.create({ authorId: 'a1', text: 'Post 1' })
    await PostModel.create({ authorId: 'a1', text: 'Post 2' })

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
      await PostModel.create({ authorId: 'a1', text: `Post ${i}` })
    }

    const p = await repository.findAll({ limit: 0 })
    expect(p.data).toHaveLength(10)
    expect(p.total).toBe(12)

    const p2 = await repository.findAll({ limit: undefined })
    expect(p2.data).toHaveLength(10)
  })

  it('should calculate skip correctly when page is greater than 1', async () => {
    await PostModel.create({ authorId: 'a1', text: 'Post 1' })
    await PostModel.create({ authorId: 'a1', text: 'Post 2' })
    await PostModel.create({ authorId: 'a1', text: 'Post 3' })

    const paginated = await repository.findAll({ limit: 2, page: 2 })
    expect(paginated.data).toHaveLength(1)
    expect(paginated.data[0].text).toBe('Post 3')
  })

  it('should map models to domain objects correctly', async () => {
    await PostModel.create({ authorId: 'a1', text: 'Post 1' })
    const result = await repository.findAll()
    expect(result.data[0]).toBeInstanceOf(Post)
    expect(result.data[0].text).toBe('Post 1')
  })

  it('should update reactions successfully', async () => {
    const postDoc = await PostModel.create({ authorId: 'a1', text: 'Some text', reactions: [] })
    const updated = await repository.update(postDoc._id.toString(), { reactions: [{ userId: 'u1', type: 'LIKE' }] })
    expect(updated).toBe(true)

    const dbPost = await PostModel.findById(postDoc._id)
    expect(dbPost?.reactions[0].userId).toBe('u1')
    expect(dbPost?.reactions[0].type).toBe('LIKE')
    expect(dbPost?.text).toBe('Some text')
  })

  it('should atomically react to a post successfully', async () => {
    const postDoc = await PostModel.create({ authorId: 'a1', text: 'Some text', reactions: [] })
    const id = postDoc._id.toString()

    const reacted1 = await repository.react(id, 'u1', 'LIKE')
    expect(reacted1).toBe(true)
    let dbPost = await PostModel.findById(id)
    expect(dbPost?.reactions).toHaveLength(1)
    expect(dbPost?.reactions[0].userId).toBe('u1')
    expect(dbPost?.reactions[0].type).toBe('LIKE')

    const reacted2 = await repository.react(id, 'u1', 'LOVE')
    expect(reacted2).toBe(true)
    dbPost = await PostModel.findById(id)
    expect(dbPost?.reactions).toHaveLength(1)
    expect(dbPost?.reactions[0].userId).toBe('u1')
    expect(dbPost?.reactions[0].type).toBe('LOVE')

    const reacted3 = await repository.react(id, 'u1', 'LOVE')
    expect(reacted3).toBe(true)
    dbPost = await PostModel.findById(id)
    expect(dbPost?.reactions).toHaveLength(1)

    const reactedInvalid = await repository.react('invalid-id', 'u1', 'LIKE')
    expect(reactedInvalid).toBe(false)
    const nonExistingId = new mongoose.Types.ObjectId().toString()
    const reactedNonExisting = await repository.react(nonExistingId, 'u1', 'LIKE')
    expect(reactedNonExisting).toBe(false)
  })

  it('should atomically unreact from a post successfully', async () => {
    const postDoc = await PostModel.create({
      authorId: 'a1',
      text: 'Some text',
      reactions: [{ userId: 'u1', type: 'LIKE' }, { userId: 'u2', type: 'LOVE' }],
    })
    const id = postDoc._id.toString()

    const unreacted1 = await repository.unreact(id, 'u1')
    expect(unreacted1).toBe(true)
    let dbPost = await PostModel.findById(id)
    expect(dbPost?.reactions).toHaveLength(1)
    expect(dbPost?.reactions[0].userId).toBe('u2')

    const unreacted2 = await repository.unreact(id, 'u1')
    expect(unreacted2).toBe(true)
    dbPost = await PostModel.findById(id)
    expect(dbPost?.reactions).toHaveLength(1)

    const unreactedInvalid = await repository.unreact('invalid-id', 'u1')
    expect(unreactedInvalid).toBe(false)
    const nonExistingId = new mongoose.Types.ObjectId().toString()
    const unreactedNonExisting = await repository.unreact(nonExistingId, 'u1')
    expect(unreactedNonExisting).toBe(false)
  })

  it('should return false if updating with no fields provided', async () => {
    const postDoc = await PostModel.create({ authorId: 'a1', text: 'Some text' })
    const updated = await repository.update(postDoc._id.toString(), {})
    expect(updated).toBe(false)
  })

  describe('postModel Schema Validations', () => {
    it('should throw validation error if authorId is missing', async () => {
      await expect(PostModel.create({ text: 'Some text' })).rejects.toThrow()
    })

    it('should throw validation error if text is missing', async () => {
      await expect(PostModel.create({ authorId: 'a1' })).rejects.toThrow()
    })

    it('should default tags and reactions to empty arrays and deletedAt to null', async () => {
      const post = await PostModel.create({ authorId: 'a1', text: 'Some text' })
      expect(post.tags).toEqual([])
      expect(post.reactions).toEqual([])
      expect(post.deletedAt).toBeNull()
    })

    it('should automatically generate timestamps', async () => {
      const post = await PostModel.create({ authorId: 'a1', text: 'Some text' })
      expect(post.createdAt).toBeInstanceOf(Date)
      expect(post.updatedAt).toBeInstanceOf(Date)
    })

    it('should use default mongo URI if MONGODB_URI is not set', async () => {
      const originalUri = process.env.MONGODB_URI
      delete process.env.MONGODB_URI

      const connectSpy = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose)

      await initializeDatabase()

      expect(connectSpy).toHaveBeenCalledWith('mongodb://localhost:27017/posts')

      connectSpy.mockRestore()
      process.env.MONGODB_URI = originalUri
    })
  })
})
