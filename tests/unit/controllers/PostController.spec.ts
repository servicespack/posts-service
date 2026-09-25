import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostController } from '../../../src/infrastructure/http/controllers/PostController';
import { CreatePostUseCase } from '../../../src/use-cases/CreatePostUseCase';
import { ListPostsUseCase } from '../../../src/use-cases/ListPostsUseCase';
import { GetPostUseCase } from '../../../src/use-cases/GetPostUseCase';
import { UpdatePostUseCase } from '../../../src/use-cases/UpdatePostUseCase';
import { DeletePostUseCase } from '../../../src/use-cases/DeletePostUseCase';
import { Request, Response } from 'express';

describe('PostController Unit Tests', () => {
  let controller: PostController;
  let createUseCaseMock: any;
  let listUseCaseMock: any;
  let getUseCaseMock: any;
  let updateUseCaseMock: any;
  let deleteUseCaseMock: any;

  beforeEach(() => {
    createUseCaseMock = { execute: vi.fn() };
    listUseCaseMock = { execute: vi.fn() };
    getUseCaseMock = { execute: vi.fn() };
    updateUseCaseMock = { execute: vi.fn() };
    deleteUseCaseMock = { execute: vi.fn() };

    controller = new PostController(
      createUseCaseMock as CreatePostUseCase,
      listUseCaseMock as ListPostsUseCase,
      getUseCaseMock as GetPostUseCase,
      updateUseCaseMock as UpdatePostUseCase,
      deleteUseCaseMock as DeletePostUseCase
    );
  });

  const mockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  };

  describe('create', () => {
    it('should return 400 if text is missing', async () => {
      const req = { body: {} } as Request;
      const res = mockResponse();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'text is required' });
    });

    it('should create a post successfully', async () => {
      const req = { body: { text: 'Hello' } } as Request;
      const res = mockResponse();
      createUseCaseMock.execute.mockResolvedValue({ created: true });

      await controller.create(req, res);

      expect(createUseCaseMock.execute).toHaveBeenCalledWith({ text: 'Hello' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ created: true });
    });

    it('should return 400 if use case throws', async () => {
      const req = { body: { text: 'Hello' } } as Request;
      const res = mockResponse();
      createUseCaseMock.execute.mockRejectedValue(new Error('Some error'));

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Some error' });
    });
  });

  describe('list', () => {
    it('should list all posts successfully', async () => {
      const req = {} as Request;
      const res = mockResponse();
      const expectedPosts = [{ id: '1', text: 'Hello' }];
      listUseCaseMock.execute.mockResolvedValue(expectedPosts);

      await controller.list(req, res);

      expect(listUseCaseMock.execute).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedPosts);
    });

    it('should return 500 if use case throws', async () => {
      const req = {} as Request;
      const res = mockResponse();
      listUseCaseMock.execute.mockRejectedValue(new Error('Database error'));

      await controller.list(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Database error' });
    });
  });

  describe('get', () => {
    const validId = '60c72b2f9b1d8e2a4c8b4567';

    it('should return 400 if id is invalid', async () => {
      const req = { params: { id: 'invalid-id' } } as unknown as Request;
      const res = mockResponse();

      await controller.get(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' });
    });

    it('should return 200 with post if found', async () => {
      const req = { params: { id: validId } } as unknown as Request;
      const res = mockResponse();
      const expectedPost = { id: validId, text: 'Hello' };
      getUseCaseMock.execute.mockResolvedValue(expectedPost);

      await controller.get(req, res);

      expect(getUseCaseMock.execute).toHaveBeenCalledWith({ id: validId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedPost);
    });

    it('should return 404 if post is not found', async () => {
      const req = { params: { id: validId } } as unknown as Request;
      const res = mockResponse();
      getUseCaseMock.execute.mockRejectedValue(new Error('Post not found'));

      await controller.get(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Post not found' });
    });

    it('should return 500 if other error occurs', async () => {
      const req = { params: { id: validId } } as unknown as Request;
      const res = mockResponse();
      getUseCaseMock.execute.mockRejectedValue(new Error('Other error'));

      await controller.get(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Other error' });
    });
  });

  describe('update', () => {
    const validId = '60c72b2f9b1d8e2a4c8b4567';

    it('should return 400 if id is invalid', async () => {
      const req = { params: { id: 'invalid-id' }, body: { text: 'New' } } as unknown as Request;
      const res = mockResponse();

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' });
    });

    it('should return 400 if text is missing', async () => {
      const req = { params: { id: validId }, body: {} } as unknown as Request;
      const res = mockResponse();

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'text is required' });
    });

    it('should update successfully', async () => {
      const req = { params: { id: validId }, body: { text: 'Updated' } } as unknown as Request;
      const res = mockResponse();
      updateUseCaseMock.execute.mockResolvedValue({ updated: true });

      await controller.update(req, res);

      expect(updateUseCaseMock.execute).toHaveBeenCalledWith({ id: validId, text: 'Updated' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ updated: true });
    });

    it('should return 404 if post not found', async () => {
      const req = { params: { id: validId }, body: { text: 'Updated' } } as unknown as Request;
      const res = mockResponse();
      updateUseCaseMock.execute.mockRejectedValue(new Error('Post not found'));

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Post not found' });
    });

    it('should return 500 if other error occurs during update', async () => {
      const req = { params: { id: validId }, body: { text: 'Updated' } } as unknown as Request;
      const res = mockResponse();
      updateUseCaseMock.execute.mockRejectedValue(new Error('Other error'));

      await controller.update(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Other error' });
    });
  });

  describe('delete', () => {
    const validId = '60c72b2f9b1d8e2a4c8b4567';

    it('should return 400 if id is invalid', async () => {
      const req = { params: { id: 'invalid-id' } } as unknown as Request;
      const res = mockResponse();

      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'invalid id' });
    });

    it('should delete successfully', async () => {
      const req = { params: { id: validId } } as unknown as Request;
      const res = mockResponse();
      deleteUseCaseMock.execute.mockResolvedValue({ deleted: true });

      await controller.delete(req, res);

      expect(deleteUseCaseMock.execute).toHaveBeenCalledWith({ id: validId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ deleted: true });
    });

    it('should return 404 if post not found', async () => {
      const req = { params: { id: validId } } as unknown as Request;
      const res = mockResponse();
      deleteUseCaseMock.execute.mockRejectedValue(new Error('Post not found'));

      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Post not found' });
    });

    it('should return 500 if other error occurs during delete', async () => {
      const req = { params: { id: validId } } as unknown as Request;
      const res = mockResponse();
      deleteUseCaseMock.execute.mockRejectedValue(new Error('Other error'));

      await controller.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Other error' });
    });
  });
});
