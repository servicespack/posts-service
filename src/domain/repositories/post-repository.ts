import type { Post } from '../entities/post'

export interface FindAllParams {
  authorId?: string | string[]
  tags?: string[]
  replyToId?: string
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
}

export interface PostRepository {
  create: (post: Post) => Promise<Post>
  findAll: (params?: FindAllParams) => Promise<PaginatedResult<Post>>
  findById: (id: string) => Promise<Post | null>
  update: (id: string, data: Partial<Post>) => Promise<boolean>
  delete: (id: string) => Promise<boolean>
  react: (postId: string, userId: string, type: string) => Promise<boolean>
  unreact: (postId: string, userId: string) => Promise<boolean>
  getTrendingTags: (limit?: number) => Promise<Array<{ tag: string, count: number }>>
  findAllReplies: (postId: string, maxDepth: number) => Promise<Post[]>
}
