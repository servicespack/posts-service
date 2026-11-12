import type { BookmarkRepository } from '../../domain/repositories/bookmark-repository'
import crypto from 'node:crypto'
import { Bookmark } from '../../domain/entities/bookmark'
import { getDb } from './lowdb/connection'

export class LowdbBookmarkRepository implements BookmarkRepository {
  public async create(bookmark: Bookmark): Promise<boolean> {
    const db = getDb()
    await db.read()

    const exists = db.data.bookmarks.some(
      b => b.userId === bookmark.userId && b.postId === bookmark.postId,
    )
    if (exists) {
      return false
    }

    db.data.bookmarks.push({
      id: crypto.randomUUID(),
      userId: bookmark.userId,
      postId: bookmark.postId,
      createdAt: new Date(),
    })
    await db.write()
    return true
  }

  public async findAllByUser(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Bookmark[], total: number }> {
    const db = getDb()
    await db.read()

    const p = Math.max(page ?? 1, 1)
    const l = Math.max(limit ?? 10, 1)
    const skip = (p - 1) * l

    const userBookmarks = db.data.bookmarks
      .filter(b => b.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const total = userBookmarks.length
    const paginated = userBookmarks.slice(skip, skip + l)

    return {
      data: paginated.map(doc => new Bookmark({
        id: doc.id,
        userId: doc.userId,
        postId: doc.postId,
        createdAt: doc.createdAt,
      })),
      total,
    }
  }

  public async findByPostAndUser(postId: string, userId: string): Promise<Bookmark | null> {
    const db = getDb()
    await db.read()

    const doc = db.data.bookmarks.find(b => b.postId === postId && b.userId === userId)
    if (!doc) {
      return null
    }

    return new Bookmark({
      id: doc.id,
      userId: doc.userId,
      postId: doc.postId,
      createdAt: doc.createdAt,
    })
  }

  public async delete(id: string, userId: string): Promise<boolean> {
    const db = getDb()
    await db.read()

    const index = db.data.bookmarks.findIndex(b => b.id === id && b.userId === userId)
    if (index === -1) {
      return false
    }

    db.data.bookmarks.splice(index, 1)
    await db.write()
    return true
  }
}
