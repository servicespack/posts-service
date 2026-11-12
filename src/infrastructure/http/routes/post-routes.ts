import type { PostControllerWithBookmarks } from '../controllers/post-controller'
import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth-middleware'
import { authLimiter, generalLimiter, strictLimiter } from '../middlewares/rate-limiter'

export function createPostRouter(postController: PostControllerWithBookmarks): Router {
  const router = Router()

  router.use(generalLimiter)
  router.use(authMiddleware)

  // Read-only routes - standard authenticated rate limit
  router.get('/posts', authLimiter, postController.list)
  router.get('/posts/tags/trending', authLimiter, postController.getTrendingTags)
  router.get('/posts/bookmarks', authLimiter, postController.listBookmarks)
  router.get('/posts/:id', authLimiter, postController.get)

  // Write routes - strict rate limit
  router.post('/posts', strictLimiter, postController.create)
  router.patch('/posts/:id', strictLimiter, postController.update)
  router.delete('/posts/:id', strictLimiter, postController.delete)

  router.post('/posts/:id/reactions', strictLimiter, postController.react)
  router.delete('/posts/:id/reactions', strictLimiter, postController.unreact)

  router.post('/posts/:id/bookmarks', strictLimiter, postController.bookmark)
  router.delete('/posts/bookmarks/:id', strictLimiter, postController.unbookmark)

  return router
}
