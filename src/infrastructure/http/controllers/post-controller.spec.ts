import type { Request, Response } from 'express'
import type { CreatePostUseCase } from '../../../use-cases/create-post-use-case'
import type { DeletePostUseCase } from '../../../use-cases/delete-post-use-case'
import type { GetPostUseCase } from '../../../use-cases/get-post-use-case'
import type { GetTrendingTagsUseCase } from '../../../use-cases/get-trending-tags-use-case'
import type { ListPostsUseCase } from '../../../use-cases/list-posts-use-case'
import type { ReactPostUseCase } from '../../../use-cases/react-post-use-case'
import type { UnreactPostUseCase } from '../../../use-cases/unreact-post-use-case'
import type { UpdatePostUseCase } from '../../../use-cases/update-post-use-case'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PostController, PostControllerWithBookmarks } from './post-controller'

describe('postController Unit Tests', () => {
  let controller: PostController
  let createUseCaseMock: any
  let listUseCaseMock: any
  let getUseCaseMock: any
  let updateUseCaseMock: any
  let deleteUseCaseMock: any
  let reactUseCaseMock: any
  let unreactUseCaseMock: any
  let getTrendingTagsUseCaseMock: any

  beforeEach(() => {
    createUseCaseMock = { execute: vi.fn() }
    listUseCaseMock = { execute: vi.fn() }
    getUseCaseMock = { execute: vi.fn() }
    updateUseCaseMock = { execute: vi.fn() }
    deleteUseCaseMock = { execute: vi.fn() }
    reactUseCaseMock = { execute: vi.fn() }
    unreactUseCaseMock = { execute: vi.fn() }
    getTrendingTagsUseCaseMock = { execute: vi.fn() }

    controller = new PostController(
      createUseCaseMock as CreatePostUseCase,
      listUseCaseMock as ListPostsUseCase,
      getUseCaseMock as GetPostUseCase,
      updateUseCaseMock as UpdatePostUseCase,
      deleteUseCaseMock as DeletePostUseCase,
      reactUseCaseMock as ReactPostUseCase,
      unreactUseCaseMock as UnreactPostUseCase,
      getTrendingTagsUseCaseMock as GetTrendingTagsUseCase,
    )
  })

  const mockResponse = () => {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res as Response
  }

  describe('create', () => {
    it('should return 400 if text is missing', async () => {
      const req = { body: {}, userId: 'a1' } as unknown as Request
      const res = mockResponse()

      await controller.create(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'text is required' })
    })

    it('should return 400 if authorId is missing', async () => {
      const req = { body: { text: 't1' } } as Request
      const res = mockResponse()

      await controller.create(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'authorId is required' })
    })

    it('should create a post successfully', async () => {
      const req = { body: { text: 'Hello', tags: ['tech'] }, userId: 'a1' } as unknown as Request
      const res = mockResponse()
      createUseCaseMock.execute.mockResolvedValue({ created: true })

      await controller.create(req, res)

      expect(createUseCaseMock.execute).toHaveBeenCalledWith({ text: 'Hello', authorId: 'a1', tags: ['tech'] })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ created: true })
    })

    it('should return 400 if use case throws', async () => {
      const req = { body: { text: 'Hello' }, userId: 'a1' } as unknown as Request
      const res = mockResponse()
      createUseCaseMock.execute.mockRejectedValue(new Error('Some error'))

      await controller.create(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Some error' })
    })
  })

  describe('list', () => {
    it('should list posts successfully passing query params', async () => {
      const req = { query: { authorId: ['a1'], tags: ['tech'], page: '2', limit: '10' } } as unknown as Request
      const res = mockResponse()
      const expectedResult = { data: [], total: 0 }
      listUseCaseMock.execute.mockResolvedValue(expectedResult)

      await controller.list(req, res)

      expect(listUseCaseMock.execute).toHaveBeenCalledWith({ authorId: ['a1'], tags: ['tech'], page: 2, limit: 10 })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expectedResult)
    })

    it('should list posts successfully passing multiple authorIds as array', async () => {
      const req = { query: { authorId: ['a1', 'a2'], tags: ['tech'], page: '2', limit: '10' } } as unknown as Request
      const res = mockResponse()
      const expectedResult = { data: [], total: 0 }
      listUseCaseMock.execute.mockResolvedValue(expectedResult)

      await controller.list(req, res)

      expect(listUseCaseMock.execute).toHaveBeenCalledWith({ authorId: ['a1', 'a2'], tags: ['tech'], page: 2, limit: 10 })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expectedResult)
    })

    it('should list posts successfully passing a single tag string', async () => {
      const req = { query: { tags: 'tech' } } as unknown as Request
      const res = mockResponse()
      const expectedResult = { data: [], total: 0 }
      listUseCaseMock.execute.mockResolvedValue(expectedResult)

      await controller.list(req, res)

      expect(listUseCaseMock.execute).toHaveBeenCalledWith({ authorId: undefined, replyToId: undefined, tags: ['tech'], page: undefined, limit: undefined, search: undefined })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expectedResult)
    })

    it('should return 500 if use case throws', async () => {
      const req = { query: {} } as Request
      const res = mockResponse()
      listUseCaseMock.execute.mockRejectedValue(new Error('Database error'))

      await controller.list(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Database error' })
    })

    it('should enrich listed posts with reactionStats and userReaction', async () => {
      const req = { query: {}, userId: 'user-1' } as unknown as Request
      const res = mockResponse()
      const mockPost = {
        id: 'post-1',
        text: 'Hello World',
        reactions: [
          { type: 'LIKE', userId: 'user-1' },
          { type: 'LIKE', userId: 'user-2' },
          { type: 'LOVE', userId: 'user-3' },
        ],
      }
      listUseCaseMock.execute.mockResolvedValue({ data: [mockPost], total: 1 })

      await controller.list(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: [
          {
            id: 'post-1',
            text: 'Hello World',
            reactions: [
              { type: 'LIKE', userId: 'user-1' },
              { type: 'LIKE', userId: 'user-2' },
              { type: 'LOVE', userId: 'user-3' },
            ],
            authorId: undefined,
            tags: undefined,
            replyToId: undefined,
            createdAt: undefined,
            updatedAt: undefined,
            deletedAt: undefined,
            repliesCount: 0,
            replies: [],
            reactionStats: { LIKE: 2, LOVE: 1 },
            userReaction: 'LIKE',
          },
        ],
        total: 1,
      })
    })
  })

  describe('get', () => {
    const validId = '60c72b2f9b1d8e2a4c8b4567'

    it.each([
      ['invalid-id'],
      ['extra60c72b2f9b1d8e2a4c8b4567'],
      ['60c72b2f9b1d8e2a4c8b4567extra'],
    ])('should return 400 if id is invalid: %s', async (id) => {
      const req = { params: { id }, query: {} } as unknown as Request
      const res = mockResponse()

      await controller.get(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' })
    })

    it('should return 200 with post if found', async () => {
      const req = { params: { id: validId }, query: {} } as unknown as Request
      const res = mockResponse()
      const expectedPost = { id: validId, text: 'Hello' }
      getUseCaseMock.execute.mockResolvedValue(expectedPost)

      await controller.get(req, res)

      expect(getUseCaseMock.execute).toHaveBeenCalledWith({ id: validId, includeReplies: false })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        id: validId,
        authorId: undefined,
        text: 'Hello',
        tags: undefined,
        replyToId: undefined,
        reactions: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        deletedAt: undefined,
        repliesCount: 0,
        replies: [],
        reactionStats: {},
        userReaction: null,
      })
    })

    it('should enrich post with reactionStats and userReaction when found', async () => {
      const req = { params: { id: validId }, userId: 'user-2', query: {} } as unknown as Request
      const res = mockResponse()
      const mockPost = {
        id: validId,
        text: 'Another post',
        reactions: [
          { type: 'LOVE', userId: 'user-1' },
          { type: 'HAHA', userId: 'user-2' },
        ],
      }
      getUseCaseMock.execute.mockResolvedValue(mockPost)

      await controller.get(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        id: validId,
        text: 'Another post',
        reactions: [
          { type: 'LOVE', userId: 'user-1' },
          { type: 'HAHA', userId: 'user-2' },
        ],
        authorId: undefined,
        tags: undefined,
        replyToId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        deletedAt: undefined,
        repliesCount: 0,
        replies: [],
        reactionStats: { LOVE: 1, HAHA: 1 },
        userReaction: 'HAHA',
      })
    })

    it('should return 404 if post is not found', async () => {
      const req = { params: { id: validId }, query: {} } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockRejectedValue(new Error('Post not found'))

      await controller.get(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Post not found' })
    })

    it('should return 500 if other error occurs', async () => {
      const req = { params: { id: validId }, query: {} } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockRejectedValue(new Error('Other error'))

      await controller.get(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Other error' })
    })
  })

  describe('update', () => {
    const validId = '60c72b2f9b1d8e2a4c8b4567'

    it.each([
      ['invalid-id'],
      ['extra60c72b2f9b1d8e2a4c8b4567'],
      ['60c72b2f9b1d8e2a4c8b4567extra'],
    ])('should return 400 if id is invalid: %s', async (id) => {
      const req = { params: { id }, body: { text: 'New' } } as unknown as Request
      const res = mockResponse()

      await controller.update(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' })
    })

    it('should return 400 if nothing to update', async () => {
      const req = { params: { id: validId }, body: {}, userId: 'a1' } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockResolvedValue({ id: validId, authorId: 'a1' })

      await controller.update(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'At least one field to update is required' })
    })

    it('should update successfully', async () => {
      const req = { params: { id: validId }, body: { text: 'Updated' }, userId: 'a1' } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockResolvedValue({ id: validId, authorId: 'a1' })
      updateUseCaseMock.execute.mockResolvedValue({ updated: true })

      await controller.update(req, res)

      expect(updateUseCaseMock.execute).toHaveBeenCalledWith({ id: validId, text: 'Updated', tags: undefined })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ updated: true })
    })

    it('should update tags successfully', async () => {
      const req = { params: { id: validId }, body: { tags: ['UpdatedTag'] }, userId: 'a1' } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockResolvedValue({ id: validId, authorId: 'a1' })
      updateUseCaseMock.execute.mockResolvedValue({ updated: true })

      await controller.update(req, res)

      expect(updateUseCaseMock.execute).toHaveBeenCalledWith({ id: validId, text: undefined, tags: ['UpdatedTag'] })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ updated: true })
    })

    it('should return 404 if post not found', async () => {
      const req = { params: { id: validId }, body: { text: 'Updated' }, userId: 'a1' } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockRejectedValue(new Error('Post not found'))

      await controller.update(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Post not found' })
    })

    it('should return 403 if post belongs to another user', async () => {
      const req = { params: { id: validId }, body: { text: 'Updated' }, userId: 'another-user' } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockResolvedValue({ id: validId, authorId: 'owner' })

      await controller.update(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Forbidden' })
    })

    it('should return 500 if other error occurs during update', async () => {
      const req = { params: { id: validId }, body: { text: 'Updated' }, userId: 'a1' } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockResolvedValue({ id: validId, authorId: 'a1' })
      updateUseCaseMock.execute.mockRejectedValue(new Error('Other error'))

      await controller.update(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Other error' })
    })
  })

  describe('delete', () => {
    const validId = '60c72b2f9b1d8e2a4c8b4567'

    it.each([
      ['invalid-id'],
      ['extra60c72b2f9b1d8e2a4c8b4567'],
      ['60c72b2f9b1d8e2a4c8b4567extra'],
    ])('should return 400 if id is invalid: %s', async (id) => {
      const req = { params: { id } } as unknown as Request
      const res = mockResponse()

      await controller.delete(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' })
    })

    it('should delete successfully', async () => {
      const req = { params: { id: validId }, userId: 'a1' } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockResolvedValue({ id: validId, authorId: 'a1' })
      deleteUseCaseMock.execute.mockResolvedValue({ deleted: true })

      await controller.delete(req, res)

      expect(deleteUseCaseMock.execute).toHaveBeenCalledWith({ id: validId })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ deleted: true })
    })

    it('should return 404 if post not found', async () => {
      const req = { params: { id: validId }, userId: 'a1' } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockRejectedValue(new Error('Post not found'))

      await controller.delete(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Post not found' })
    })

    it('should return 403 if post belongs to another user', async () => {
      const req = { params: { id: validId }, userId: 'another-user' } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockResolvedValue({ id: validId, authorId: 'owner' })

      await controller.delete(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Forbidden' })
    })

    it('should return 500 if other error occurs during delete', async () => {
      const req = { params: { id: validId }, userId: 'a1' } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockResolvedValue({ id: validId, authorId: 'a1' })
      deleteUseCaseMock.execute.mockRejectedValue(new Error('Other error'))

      await controller.delete(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Other error' })
    })
  })

  describe('react', () => {
    const validId = '60c72b2f9b1d8e2a4c8b4567'

    it.each([
      ['invalid-id'],
      ['extra60c72b2f9b1d8e2a4c8b4567'],
      ['60c72b2f9b1d8e2a4c8b4567extra'],
    ])('should return 400 if id is invalid: %s', async (id) => {
      const req = { params: { id }, body: { type: 'LIKE' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()

      await controller.react(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' })
    })

    it('should return 400 if userId is missing', async () => {
      const req = { params: { id: validId }, body: { type: 'LIKE' } } as unknown as Request
      const res = mockResponse()

      await controller.react(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'userId and type are required' })
    })

    it('should react successfully', async () => {
      const req = { params: { id: validId }, body: { type: 'LIKE' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      reactUseCaseMock.execute.mockResolvedValue({ success: true })

      await controller.react(req, res)

      expect(reactUseCaseMock.execute).toHaveBeenCalledWith({ postId: validId, userId: 'u1', type: 'LIKE' })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ success: true })
    })

    it('should return 404 if post is not found', async () => {
      const req = { params: { id: validId }, body: { type: 'LIKE' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      reactUseCaseMock.execute.mockRejectedValue(new Error('Post not found'))

      await controller.react(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Post not found' })
    })

    it('should return 500 if other error occurs', async () => {
      const req = { params: { id: validId }, body: { type: 'LIKE' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      reactUseCaseMock.execute.mockRejectedValue(new Error('Other error'))

      await controller.react(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Other error' })
    })
  })

  describe('unreact', () => {
    const validId = '60c72b2f9b1d8e2a4c8b4567'

    it.each([
      ['invalid-id'],
      ['extra60c72b2f9b1d8e2a4c8b4567'],
      ['60c72b2f9b1d8e2a4c8b4567extra'],
    ])('should return 400 if id is invalid: %s', async (id) => {
      const req = { params: { id }, userId: 'u1' } as unknown as Request
      const res = mockResponse()

      await controller.unreact(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' })
    })

    it('should return 400 if userId is missing', async () => {
      const req = { params: { id: validId } } as unknown as Request
      const res = mockResponse()

      await controller.unreact(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'userId is required' })
    })

    it('should unreact successfully', async () => {
      const req = { params: { id: validId }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      unreactUseCaseMock.execute.mockResolvedValue({ success: true })

      await controller.unreact(req, res)

      expect(unreactUseCaseMock.execute).toHaveBeenCalledWith({ postId: validId, userId: 'u1' })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ success: true })
    })

    it('should return 404 if post is not found', async () => {
      const req = { params: { id: validId }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      unreactUseCaseMock.execute.mockRejectedValue(new Error('Post not found'))

      await controller.unreact(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Post not found' })
    })

    it('should return 500 if other error occurs', async () => {
      const req = { params: { id: validId }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      unreactUseCaseMock.execute.mockRejectedValue(new Error('Other error'))

      await controller.unreact(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Other error' })
    })
  })

  describe('getTrendingTags', () => {
    it('should get trending tags successfully', async () => {
      const req = { query: { limit: '5' } } as unknown as Request
      const res = mockResponse()
      const mockResult = [{ tag: 'typescript', count: 3 }]
      getTrendingTagsUseCaseMock.execute.mockResolvedValue(mockResult)

      await controller.getTrendingTags(req, res)

      expect(getTrendingTagsUseCaseMock.execute).toHaveBeenCalledWith({ limit: 5 })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockResult)
    })

    it('should use undefined limit if not provided in query', async () => {
      const req = { query: {} } as unknown as Request
      const res = mockResponse()
      getTrendingTagsUseCaseMock.execute.mockResolvedValue([])

      await controller.getTrendingTags(req, res)

      expect(getTrendingTagsUseCaseMock.execute).toHaveBeenCalledWith({ limit: undefined })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith([])
    })

    it('should return 500 if usecase throws', async () => {
      const req = { query: {} } as unknown as Request
      const res = mockResponse()
      getTrendingTagsUseCaseMock.execute.mockRejectedValue(new Error('Internal server error'))

      await controller.getTrendingTags(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Internal server error' })
    })
  })
})

describe('postControllerWithBookmarks Unit Tests', () => {
  let controller: PostControllerWithBookmarks
  let bookmarkUseCaseMock: any
  let unbookmarkUseCaseMock: any
  let listBookmarksUseCaseMock: any

  beforeEach(() => {
    bookmarkUseCaseMock = { execute: vi.fn() }
    unbookmarkUseCaseMock = { execute: vi.fn() }
    listBookmarksUseCaseMock = { execute: vi.fn() }

    controller = new PostControllerWithBookmarks(
      { execute: vi.fn() } as any,
      { execute: vi.fn() } as any,
      { execute: vi.fn() } as any,
      { execute: vi.fn() } as any,
      { execute: vi.fn() } as any,
      { execute: vi.fn() } as any,
      { execute: vi.fn() } as any,
    )
    controller.setBookmarkUseCases(
      bookmarkUseCaseMock,
      unbookmarkUseCaseMock,
      listBookmarksUseCaseMock,
    )
  })

  const mockResponse = () => {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    return res as Response
  }

  describe('bookmark', () => {
    it.each([
      ['invalid-id'],
      ['extra60c72b2f9b1d8e2a4c8b4567'],
      ['60c72b2f9b1d8e2a4c8b4567extra'],
    ])('should return 400 if id is invalid: %s', async (id) => {
      const req = { params: { id }, userId: 'u1' } as unknown as Request
      const res = mockResponse()

      await controller.bookmark(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' })
    })

    it('should return 400 if userId is missing', async () => {
      const req = { params: { id: '60c72b2f9b1d8e2a4c8b4567' } } as unknown as Request
      const res = mockResponse()

      await controller.bookmark(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'userId is required' })
    })

    it('should return 500 if bookmark use case not initialized', async () => {
      const ctrl = new PostControllerWithBookmarks(
        { execute: vi.fn() } as any,
        { execute: vi.fn() } as any,
        { execute: vi.fn() } as any,
        { execute: vi.fn() } as any,
        { execute: vi.fn() } as any,
        { execute: vi.fn() } as any,
      )
      const req = { params: { id: '60c72b2f9b1d8e2a4c8b4567' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()

      await ctrl.bookmark(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Bookmark use case not initialized' })
    })

    it('should bookmark successfully', async () => {
      const req = { params: { id: '60c72b2f9b1d8e2a4c8b4567' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      bookmarkUseCaseMock.execute.mockResolvedValue({ message: 'Post bookmarked successfully' })

      await controller.bookmark(req, res)

      expect(bookmarkUseCaseMock.execute).toHaveBeenCalledWith({ userId: 'u1', postId: '60c72b2f9b1d8e2a4c8b4567' })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ message: 'Post bookmarked successfully' })
    })

    it('should return 404 if post does not exist', async () => {
      const req = { params: { id: '60c72b2f9b1d8e2a4c8b4567' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      bookmarkUseCaseMock.execute.mockRejectedValue(new Error('Post not found'))

      await controller.bookmark(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Post not found' })
    })

    it('should return 409 if bookmark already exists', async () => {
      const req = { params: { id: '60c72b2f9b1d8e2a4c8b4567' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      bookmarkUseCaseMock.execute.mockRejectedValue(new Error('Bookmark already exists'))

      await controller.bookmark(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Bookmark already exists' })
    })

    it('should return 500 if other error occurs', async () => {
      const req = { params: { id: '60c72b2f9b1d8e2a4c8b4567' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      bookmarkUseCaseMock.execute.mockRejectedValue(new Error('Other error'))

      await controller.bookmark(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Other error' })
    })
  })

  describe('unbookmark', () => {
    const validId = '60c72b2f9b1d8e2a4c8b4567'

    it.each([
      ['invalid-id'],
      ['extra60c72b2f9b1d8e2a4c8b4567'],
      ['60c72b2f9b1d8e2a4c8b4567extra'],
    ])('should return 400 if id is invalid: %s', async (id) => {
      const req = { params: { id }, userId: 'u1' } as unknown as Request
      const res = mockResponse()

      await controller.unbookmark(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' })
    })

    it('should return 400 if userId is missing', async () => {
      const req = { params: { id: validId } } as unknown as Request
      const res = mockResponse()

      await controller.unbookmark(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'userId is required' })
    })

    it('should unbookmark successfully', async () => {
      const req = { params: { id: validId }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      unbookmarkUseCaseMock.execute.mockResolvedValue({ message: 'Bookmark removed successfully' })

      await controller.unbookmark(req, res)

      expect(unbookmarkUseCaseMock.execute).toHaveBeenCalledWith({ userId: 'u1', bookmarkId: validId })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Bookmark removed successfully' })
    })

    it('should return 404 if bookmark not found', async () => {
      const req = { params: { id: validId }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      unbookmarkUseCaseMock.execute.mockRejectedValue(new Error('Bookmark not found'))

      await controller.unbookmark(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Bookmark not found' })
    })

    it('should return 500 if other error occurs', async () => {
      const req = { params: { id: validId }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      unbookmarkUseCaseMock.execute.mockRejectedValue(new Error('Other error'))

      await controller.unbookmark(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Other error' })
    })
  })

  describe('listBookmarks', () => {
    it('should return 400 if userId is missing', async () => {
      const req = { query: {} } as unknown as Request
      const res = mockResponse()

      await controller.listBookmarks(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'userId is required' })
    })

    it('should list bookmarks successfully', async () => {
      const req = { query: { page: '2', limit: '10' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      const mockResult = { data: [], total: 0 }
      listBookmarksUseCaseMock.execute.mockResolvedValue(mockResult)

      await controller.listBookmarks(req, res)

      expect(listBookmarksUseCaseMock.execute).toHaveBeenCalledWith({ userId: 'u1', page: 2, limit: 10 })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockResult)
    })

    it('should return 400 if query params are invalid', async () => {
      const req = { query: { page: 'abc', limit: '10' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()

      await controller.listBookmarks(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid query parameters' })
    })

    it('should return 500 if usecase throws', async () => {
      const req = { query: { page: '1', limit: '10' }, userId: 'u1' } as unknown as Request
      const res = mockResponse()
      listBookmarksUseCaseMock.execute.mockRejectedValue(new Error('Internal server error'))

      await controller.listBookmarks(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Internal server error' })
    })
  })
})
