import type { PostControllerWithBookmarks } from '../controllers/post-controller'
import { describe, expect, it, vi } from 'vitest'
import { createPostRouter } from './post-routes'

describe('postRoutes', () => {
  it('should register all post routes with express router', () => {
    const mockController = {
      list: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      react: vi.fn(),
      unreact: vi.fn(),
      getTrendingTags: vi.fn(),
      listBookmarks: vi.fn(),
      bookmark: vi.fn(),
      unbookmark: vi.fn(),
    } as unknown as PostControllerWithBookmarks

    const router = createPostRouter(mockController)

    expect(router).toBeDefined()
    expect(router.stack).toBeDefined()

    const routes = router.stack.map((layer: any) => ({
      path: layer.route?.path,
      methods: Object.keys(layer.route?.methods || {}),
    }))

    expect(routes).toContainEqual({ path: '/posts', methods: ['get'] })
    expect(routes).toContainEqual({ path: '/posts', methods: ['post'] })
    expect(routes).toContainEqual({ path: '/posts/tags/trending', methods: ['get'] })
    expect(routes).toContainEqual({ path: '/posts/:id', methods: ['get'] })
    expect(routes).toContainEqual({ path: '/posts/:id', methods: ['patch'] })
    expect(routes).toContainEqual({ path: '/posts/:id', methods: ['delete'] })
    expect(routes).toContainEqual({ path: '/posts/:id/reactions', methods: ['post'] })
    expect(routes).toContainEqual({ path: '/posts/:id/reactions', methods: ['delete'] })
    expect(routes).toContainEqual({ path: '/posts/bookmarks', methods: ['get'] })
    expect(routes).toContainEqual({ path: '/posts/:id/bookmarks', methods: ['post'] })
    expect(routes).toContainEqual({ path: '/posts/bookmarks/:id', methods: ['delete'] })

    const trendingIndex = routes.findIndex(r => r.path === '/posts/tags/trending')
    const idIndex = routes.findIndex(r => r.path === '/posts/:id')
    expect(trendingIndex).toBeGreaterThan(-1)
    expect(idIndex).toBeGreaterThan(-1)
    expect(trendingIndex).toBeLessThan(idIndex)
  })
})
