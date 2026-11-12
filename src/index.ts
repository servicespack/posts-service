import type { BookmarkRepository } from './domain/repositories/bookmark-repository'
import type { PostRepository } from './domain/repositories/post-repository'
import process from 'node:process'
import express from 'express'
import pinoHttp from 'pino-http'
import swaggerUi from 'swagger-ui-express'
import { DummyNotificationAdapter } from './infrastructure/adapters/dummy-notification-adapter'
import { CacheService } from './infrastructure/cache/cache-service'
import { initializeDatabase } from './infrastructure/database/connection'
import { MongooseBookmarkRepository } from './infrastructure/database/mongoose-bookmark-repository'
import { MongoosePostRepository } from './infrastructure/database/mongoose-post-repository'
import { PostControllerWithBookmarks } from './infrastructure/http/controllers/post-controller'
import { getOpenAPISpec } from './infrastructure/http/openapi.config'
import { createPostRouter } from './infrastructure/http/routes/post-routes'
import { logger } from './infrastructure/logging/logger'
import { BookmarkPostUseCase } from './use-cases/bookmark-post-use-case'
import { CreatePostUseCase } from './use-cases/create-post-use-case'
import { DeletePostUseCase } from './use-cases/delete-post-use-case'
import { GetPostUseCase } from './use-cases/get-post-use-case'
import { GetTrendingTagsUseCase } from './use-cases/get-trending-tags-use-case'
import { ListBookmarksUseCase } from './use-cases/list-bookmarks-use-case'
import { ListPostsUseCase } from './use-cases/list-posts-use-case'
import { ReactPostUseCase } from './use-cases/react-post-use-case'
import { UnbookmarkPostUseCase } from './use-cases/unbookmark-post-use-case'
import { UnreactPostUseCase } from './use-cases/unreact-post-use-case'
import { UpdatePostUseCase } from './use-cases/update-post-use-case'

async function main() {
  try {
    await initializeDatabase()
    logger.info('Database initialized successfully.')

    const cacheService = new CacheService()
    await cacheService.connect()

    if (!cacheService.isConnected()) {
      logger.warn('Redis not available - caching disabled')
    }

    const notificationAdapter = new DummyNotificationAdapter()

    const isLowdb = process.env.DATABASE_DRIVER === 'lowdb'

    const postRepository: PostRepository = isLowdb
      ? new (await import('./infrastructure/database/lowdb-post-repository')).LowdbPostRepository()
      : new MongoosePostRepository()

    const createPostUseCase = new CreatePostUseCase(postRepository, notificationAdapter, cacheService)
    const listPostsUseCase = new ListPostsUseCase(postRepository, cacheService)
    const getPostUseCase = new GetPostUseCase(postRepository, cacheService)
    const updatePostUseCase = new UpdatePostUseCase(postRepository, cacheService)
    const deletePostUseCase = new DeletePostUseCase(postRepository, cacheService)
    const reactPostUseCase = new ReactPostUseCase(postRepository, notificationAdapter, cacheService)
    const unreactPostUseCase = new UnreactPostUseCase(postRepository, cacheService)
    const getTrendingTagsUseCase = new GetTrendingTagsUseCase(postRepository, cacheService)

    const postController = new PostControllerWithBookmarks(
      createPostUseCase,
      listPostsUseCase,
      getPostUseCase,
      updatePostUseCase,
      deletePostUseCase,
      reactPostUseCase,
      unreactPostUseCase,
      getTrendingTagsUseCase,
    )

    const bookmarkRepository: BookmarkRepository = isLowdb
      ? new (await import('./infrastructure/database/lowdb-bookmark-repository')).LowdbBookmarkRepository()
      : new MongooseBookmarkRepository()
    const bookmarkPostUseCase = new BookmarkPostUseCase(bookmarkRepository, postRepository, notificationAdapter)
    const unbookmarkPostUseCase = new UnbookmarkPostUseCase(bookmarkRepository)
    const listBookmarksUseCase = new ListBookmarksUseCase(bookmarkRepository)
    postController.setBookmarkUseCases(bookmarkPostUseCase, unbookmarkPostUseCase, listBookmarksUseCase)

    const app = express()
    app.use(pinoHttp({ logger }))
    app.use(express.json())
    app.get('/openapi.json', (_req, res) => {
      res.json(getOpenAPISpec())
    })
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(getOpenAPISpec(), { customSiteTitle: 'Posts Service API' }))

    const postRouter = createPostRouter(postController)
    app.use(postRouter)

    const PORT = process.env.PORT || 8080
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`)
    })

    process.on('SIGINT', async () => {
      await cacheService.disconnect()
      process.exit(0)
    })
  }
  catch (error: any) {
    logger.error({ error: error.message || error }, 'Error starting the application')
    process.exit(1)
  }
}

main()
