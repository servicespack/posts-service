import { describe, it, expect, vi } from 'vitest';
import { createPostRouter } from '../../../src/infrastructure/http/routes/PostRoutes';
import { PostController } from '../../../src/infrastructure/http/controllers/PostController';

describe('PostRoutes', () => {
  it('should register all post routes with express router', () => {
    const mockController = {
      list: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as PostController;

    const router = createPostRouter(mockController);

    expect(router).toBeDefined();
    expect(router.stack).toBeDefined();

    const routes = router.stack.map((layer: any) => ({
      path: layer.route?.path,
      methods: Object.keys(layer.route?.methods || {}),
    }));

    expect(routes).toContainEqual({ path: '/posts', methods: ['get'] });
    expect(routes).toContainEqual({ path: '/posts', methods: ['post'] });
    expect(routes).toContainEqual({ path: '/posts/:id', methods: ['get'] });
    expect(routes).toContainEqual({ path: '/posts/:id', methods: ['patch'] });
    expect(routes).toContainEqual({ path: '/posts/:id', methods: ['delete'] });
  });
});
