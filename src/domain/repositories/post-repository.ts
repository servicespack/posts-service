import type { Post } from '../entities/post'

export interface FindAllParams {
  authorId?: string
  tags?: string[]
  replyToId?: string
  page?: number
  limit?: number
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
}
