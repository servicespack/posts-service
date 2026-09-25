import express from 'express';
import { initializeDatabase } from './infrastructure/database/connection';
import { MongoosePostRepository } from './infrastructure/database/MongoosePostRepository';
import { CreatePostUseCase } from './use-cases/CreatePostUseCase';
import { ListPostsUseCase } from './use-cases/ListPostsUseCase';
import { GetPostUseCase } from './use-cases/GetPostUseCase';
import { UpdatePostUseCase } from './use-cases/UpdatePostUseCase';
import { DeletePostUseCase } from './use-cases/DeletePostUseCase';
import { PostController } from './infrastructure/http/controllers/PostController';
import { createPostRouter } from './infrastructure/http/routes/PostRoutes';

async function bootstrap() {
  try {
    // 1. Database Initialization
    await initializeDatabase();
    console.log('Database initialized successfully.');

    // 2. Repository Instantiation
    const postRepository = new MongoosePostRepository();

    // 3. Use Case Instantiation
    const createPostUseCase = new CreatePostUseCase(postRepository);
    const listPostsUseCase = new ListPostsUseCase(postRepository);
    const getPostUseCase = new GetPostUseCase(postRepository);
    const updatePostUseCase = new UpdatePostUseCase(postRepository);
    const deletePostUseCase = new DeletePostUseCase(postRepository);

    // 4. Controller Instantiation
    const postController = new PostController(
      createPostUseCase,
      listPostsUseCase,
      getPostUseCase,
      updatePostUseCase,
      deletePostUseCase
    );

    // 5. Express Application Setup
    const app = express();
    app.use(express.json());

    // 6. Router Setup
    const postRouter = createPostRouter(postController);
    app.use(postRouter);

    // 7. Start Server
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting the application:', error);
    process.exit(1);
  }
}

bootstrap();
