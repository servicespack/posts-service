import type { OpenAPIObject } from 'openapi3-ts/oas30'
import { extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

const registry = new OpenAPIRegistry()

const CreatePostRequestSchema = registry.register('CreatePostRequest', z.object({
  text: z.string({ message: 'text is required' }).min(1, 'text is required'),
  authorId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  replyToId: z.string().optional(),
}))

const UpdatePostRequestSchema = registry.register('UpdatePostRequest', z.object({
  text: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
}))

const ReactRequestSchema = registry.register('ReactRequest', z.object({
  type: z.string().min(1),
}))

const PostResponseSchema = registry.register('Post', z.object({
  id: z.string(),
  authorId: z.string(),
  text: z.string(),
  tags: z.array(z.string()),
  replyToId: z.string().optional().nullable(),
  reactions: z.array(z.object({ type: z.string(), userId: z.string(), createdAt: z.string() })).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().optional().nullable(),
  repliesCount: z.number(),
  replies: z.array(z.any()).optional(),
  reactionStats: z.looseRecord(z.string(), z.number()).optional(),
  userReaction: z.string().nullable().optional(),
}))

const ListPostsResponseSchema = registry.register('ListPostsResponse', z.object({
  data: z.array(PostResponseSchema),
  total: z.number(),
}))

const ListBookmarksResponseSchema = registry.register('ListBookmarksResponse', z.object({
  data: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    postId: z.string(),
    createdAt: z.string().optional(),
  })),
  total: z.number(),
}))

const TrendingTagsResponseSchema = registry.register('TrendingTagsResponse', z.array(z.string()))

const PaginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
})

const ListPostsQuerySchema = z.object({
  authorId: z.preprocess(
    a => Array.isArray(a) ? a : a ? [a] : undefined,
    z.array(z.string().min(1)).optional(),
  ),
  tags: z.preprocess(
    a => Array.isArray(a) ? a : a ? [a] : undefined,
    z.array(z.string().min(1)).optional(),
  ),
  replyToId: z.string().min(1).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().min(1).optional(),
})

const TrendingTagsQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
})

registry.registerPath({
  method: 'post',
  path: '/posts',
  summary: 'Create a post',
  request: { body: { content: { 'application/json': { schema: CreatePostRequestSchema } }, required: true } },
  responses: {
    201: { description: 'Post created', content: { 'application/json': { schema: PostResponseSchema } } },
    400: { description: 'Bad request - Invalid request body' },
  },
})

registry.registerPath({
  method: 'get',
  path: '/posts',
  summary: 'List posts',
  request: { query: ListPostsQuerySchema },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: ListPostsResponseSchema } } },
    400: { description: 'Bad request - Invalid query parameters' },
    500: { description: 'Internal server error' },
  },
})

registry.registerPath({
  method: 'get',
  path: '/posts/{id}',
  summary: 'Get a post by ID',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: PostResponseSchema } } },
    400: { description: 'Bad request - Invalid id format' },
    404: { description: 'Not found' },
    500: { description: 'Internal server error' },
  },
})

registry.registerPath({
  method: 'patch',
  path: '/posts/{id}',
  summary: 'Update a post',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: UpdatePostRequestSchema } }, required: true },
  },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: PostResponseSchema } } },
    400: { description: 'Bad request - Invalid id or request body' },
    403: { description: 'Forbidden - Not the post author' },
    404: { description: 'Not found' },
    500: { description: 'Internal server error' },
  },
})

registry.registerPath({
  method: 'delete',
  path: '/posts/{id}',
  summary: 'Delete a post',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Deleted' },
    400: { description: 'Bad request - Invalid id' },
    403: { description: 'Forbidden - Not the post author' },
    404: { description: 'Not found' },
    500: { description: 'Internal server error' },
  },
})

registry.registerPath({
  method: 'post',
  path: '/posts/{id}/reactions',
  summary: 'React to a post',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: ReactRequestSchema } }, required: true },
  },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: PostResponseSchema } } },
    400: { description: 'Bad request - Invalid id or reaction type' },
    404: { description: 'Not found' },
    500: { description: 'Internal server error' },
  },
})

registry.registerPath({
  method: 'delete',
  path: '/posts/{id}/reactions',
  summary: 'Delete a reaction',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Reaction removed' },
    400: { description: 'Bad request - Invalid id' },
    404: { description: 'Not found' },
    500: { description: 'Internal server error' },
  },
})

registry.registerPath({
  method: 'get',
  path: '/posts/tags/trending',
  summary: 'Get trending tags',
  request: { query: TrendingTagsQuerySchema },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: TrendingTagsResponseSchema } } },
    400: { description: 'Bad request - Invalid limit parameter' },
    500: { description: 'Internal server error' },
  },
})

registry.registerPath({
  method: 'post',
  path: '/posts/{id}/bookmarks',
  summary: 'Bookmark a post',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    201: { description: 'Created' },
    400: { description: 'Bad request - Invalid id' },
    404: { description: 'Not found' },
    409: { description: 'Conflict - Bookmark already exists' },
    500: { description: 'Internal server error' },
  },
})

registry.registerPath({
  method: 'delete',
  path: '/bookmarks/{id}',
  summary: 'Unbookmark',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'OK' },
    400: { description: 'Bad request - Invalid id' },
    404: { description: 'Not found' },
    500: { description: 'Internal server error' },
  },
})

registry.registerPath({
  method: 'get',
  path: '/posts/bookmarks',
  summary: 'List bookmarks',
  request: { query: PaginationQuerySchema },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: ListBookmarksResponseSchema } } },
    400: { description: 'Bad request - Invalid query parameters' },
    500: { description: 'Internal server error' },
  },
})

export function getOpenAPISpec(): OpenAPIObject {
  const generator = new OpenApiGeneratorV3(registry.definitions)
  return generator.generateDocument({
    openapi: '3.0.3',
    info: { title: 'Posts Service API', version: '1.0.0' },
  })
}
