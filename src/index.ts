import process from 'node:process'
import express from 'express'
import pinoHttp from 'pino-http'
import { initializeDatabase } from './infrastructure/database/connection'
import { MongoosePostRepository } from './infrastructure/database/mongoose-post-repository'
import { PostController } from './infrastructure/http/controllers/post-controller'
import { createPostRouter } from './infrastructure/http/routes/post-routes'
import { logger } from './infrastructure/logging/logger'
import { CreatePostUseCase } from './use-cases/create-post-use-case'
import { DeletePostUseCase } from './use-cases/delete-post-use-case'
import { GetPostUseCase } from './use-cases/get-post-use-case'
import { ListPostsUseCase } from './use-cases/list-posts-use-case'
import { ReactPostUseCase } from './use-cases/react-post-use-case'
import { UnreactPostUseCase } from './use-cases/unreact-post-use-case'
import { UpdatePostUseCase } from './use-cases/update-post-use-case'

async function main() {
  try {
    await initializeDatabase()
    logger.info('Database initialized successfully.')

    const postRepository = new MongoosePostRepository()

    const createPostUseCase = new CreatePostUseCase(postRepository)
    const listPostsUseCase = new ListPostsUseCase(postRepository)
    const getPostUseCase = new GetPostUseCase(postRepository)
    const updatePostUseCase = new UpdatePostUseCase(postRepository)
    const deletePostUseCase = new DeletePostUseCase(postRepository)
    const reactPostUseCase = new ReactPostUseCase(postRepository)
    const unreactPostUseCase = new UnreactPostUseCase(postRepository)

    const postController = new PostController(
      createPostUseCase,
      listPostsUseCase,
      getPostUseCase,
      updatePostUseCase,
      deletePostUseCase,
      reactPostUseCase,
      unreactPostUseCase,
    )

    const app = express()
    app.use(pinoHttp({ logger }))
    app.use(express.json())

    const postRouter = createPostRouter(postController)
    app.use(postRouter)

    const PORT = process.env.PORT || 8080
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`)
    })
  }
  catch (error: any) {
    logger.error({ error: error.message || error }, 'Error starting the application')
    process.exit(1)
  }
}

main()
