import type { Bookmark } from '../entities/bookmark'

export interface BookmarkRepository {
  create: (bookmark: Bookmark) => Promise<boolean>
  findAllByUser: (userId: string, page?: number, limit?: number) => Promise<{ data: Bookmark[], total: number }>
  findByPostAndUser: (postId: string, userId: string) => Promise<Bookmark | null>
  delete: (id: string, userId: string) => Promise<boolean>
}
