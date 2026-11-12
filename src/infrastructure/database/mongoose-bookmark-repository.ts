import type { BookmarkRepository } from '../../domain/repositories/bookmark-repository'
import { Bookmark } from '../../domain/entities/bookmark'
import { BookmarkModel } from './models/bookmark-model'

export class MongooseBookmarkRepository implements BookmarkRepository {
  async create(bookmark: Bookmark): Promise<boolean> {
    try {
      await BookmarkModel.create({
        userId: bookmark.userId,
        postId: bookmark.postId,
      })
      return true
    }
    catch (error: any) {
      if (error?.code === 11000) {
        return false
      }
      throw error
    }
  }

  async findAllByUser(userId: string, page?: number, limit?: number): Promise<{ data: Bookmark[], total: number }> {
    const p = Math.max(page ?? 1, 1)
    const l = Math.max(limit ?? 10, 1)
    const skip = (p - 1) * l

    const [books, total] = await Promise.all([
      BookmarkModel.find({ userId }).skip(skip).limit(l).sort({ createdAt: -1 }).exec(),
      BookmarkModel.countDocuments({ userId }).exec(),
    ])

    return {
      data: books.map(doc => new Bookmark({
        id: doc._id.toString(),
        userId: doc.userId,
        postId: doc.postId,
        createdAt: doc.createdAt,
      })),
      total,
    }
  }

  async findByPostAndUser(postId: string, userId: string): Promise<Bookmark | null> {
    const bm = await BookmarkModel.findOne({ postId, userId }).exec()
    if (!bm) {
      return null
    }
    return new Bookmark({
      id: bm._id.toString(),
      userId: bm.userId,
      postId: bm.postId,
      createdAt: bm.createdAt,
    })
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await BookmarkModel.deleteOne({ _id: id, userId }).exec()
    return result.deletedCount > 0
  }
}
