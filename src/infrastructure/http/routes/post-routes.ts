import type { PostController } from '../controllers/post-controller'
import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth-middleware'

export function createPostRouter(postController: PostController): Router {
  const router = Router()

  router.use(authMiddleware)

  router.get('/posts', postController.list)
  router.post('/posts', postController.create)
  router.get('/posts/:id', postController.get)
  router.patch('/posts/:id', postController.update)
  router.delete('/posts/:id', postController.delete)

  router.post('/posts/:id/reactions', postController.react)
  router.delete('/posts/:id/reactions', postController.unreact)

  return router
}
