import { Router } from 'express';
import { PostController } from '../controllers/PostController';

export function createPostRouter(postController: PostController): Router {
  const router = Router();

  router.get('/posts', postController.list);
  router.post('/posts', postController.create);
  router.get('/posts/:id', postController.get);
  router.patch('/posts/:id', postController.update);
  router.delete('/posts/:id', postController.delete);

  return router;
}
