import type { Request, Response } from 'express'
import type { CreatePostUseCase } from '../../../use-cases/create-post-use-case'
import type { DeletePostUseCase } from '../../../use-cases/delete-post-use-case'
import type { GetPostUseCase } from '../../../use-cases/get-post-use-case'
import type { ListPostsUseCase } from '../../../use-cases/list-posts-use-case'
import type { ReactPostUseCase } from '../../../use-cases/react-post-use-case'
import type { UnreactPostUseCase } from '../../../use-cases/unreact-post-use-case'
import type { UpdatePostUseCase } from '../../../use-cases/update-post-use-case'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PostController } from './post-controller'

describe('postController Unit Tests', () => {
  let controller: PostController
  let createUseCaseMock: any
  let listUseCaseMock: any
  let getUseCaseMock: any
  let updateUseCaseMock: any
  let deleteUseCaseMock: any
  let reactUseCaseMock: any
  let unreactUseCaseMock: any

  beforeEach(() => {
    createUseCaseMock = { execute: vi.fn() }
    listUseCaseMock = { execute: vi.fn() }
    getUseCaseMock = { execute: vi.fn() }
    updateUseCaseMock = { execute: vi.fn() }
    deleteUseCaseMock = { execute: vi.fn() }
    reactUseCaseMock = { execute: vi.fn() }
    unreactUseCaseMock = { execute: vi.fn() }

    controller = new PostController(
      createUseCaseMock as CreatePostUseCase,
      listUseCaseMock as ListPostsUseCase,
      getUseCaseMock as GetPostUseCase,
      updateUseCaseMock as UpdatePostUseCase,
      deleteUseCaseMock as DeletePostUseCase,
      reactUseCaseMock as ReactPostUseCase,
      unreactUseCaseMock as UnreactPostUseCase,
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
      const req = { query: { authorId: 'a1', tags: ['tech'], page: '2', limit: '10' } } as unknown as Request
      const res = mockResponse()
      const expectedResult = { data: [], total: 0 }
      listUseCaseMock.execute.mockResolvedValue(expectedResult)

      await controller.list(req, res)

      expect(listUseCaseMock.execute).toHaveBeenCalledWith({ authorId: 'a1', tags: ['tech'], page: 2, limit: 10 })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expectedResult)
    })

    it('should list posts successfully passing a single tag string', async () => {
      const req = { query: { tags: 'tech' } } as unknown as Request
      const res = mockResponse()
      const expectedResult = { data: [], total: 0 }
      listUseCaseMock.execute.mockResolvedValue(expectedResult)

      await controller.list(req, res)

      expect(listUseCaseMock.execute).toHaveBeenCalledWith({ authorId: undefined, tags: ['tech'], page: undefined, limit: undefined })
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
  })

  describe('get', () => {
    const validId = '60c72b2f9b1d8e2a4c8b4567'

    it.each([
      ['invalid-id'],
      ['extra60c72b2f9b1d8e2a4c8b4567'],
      ['60c72b2f9b1d8e2a4c8b4567extra'],
    ])('should return 400 if id is invalid: %s', async (id) => {
      const req = { params: { id } } as unknown as Request
      const res = mockResponse()

      await controller.get(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' })
    })

    it('should return 200 with post if found', async () => {
      const req = { params: { id: validId } } as unknown as Request
      const res = mockResponse()
      const expectedPost = { id: validId, text: 'Hello' }
      getUseCaseMock.execute.mockResolvedValue(expectedPost)

      await controller.get(req, res)

      expect(getUseCaseMock.execute).toHaveBeenCalledWith({ id: validId })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expectedPost)
    })

    it('should return 404 if post is not found', async () => {
      const req = { params: { id: validId } } as unknown as Request
      const res = mockResponse()
      getUseCaseMock.execute.mockRejectedValue(new Error('Post not found'))

      await controller.get(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ msg: 'Post not found' })
    })

    it('should return 500 if other error occurs', async () => {
      const req = { params: { id: validId } } as unknown as Request
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
})
