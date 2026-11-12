import type { FindAllParams, PaginatedResult, PostRepository } from '../../domain/repositories/post-repository'
import type { LowdbPost } from './lowdb/schema'
import crypto from 'node:crypto'
import { Post } from '../../domain/entities/post'
import { withDb } from './lowdb/connection'

export class LowdbPostRepository implements PostRepository {
  public async create(post: Post): Promise<Post> {
    return withDb(async (db) => {
      const now = new Date()
      const doc: LowdbPost = {
        id: crypto.randomBytes(12).toString('hex'),
        authorId: post.authorId,
        text: post.text,
        tags: post.tags ?? [],
        replyToId: post.replyToId,
        reactions: post.reactions ?? [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }

      db.data.posts.push(doc)
      await db.write()

      return this.toDomain(doc, 0)
    })
  }

  public async findAll(params: FindAllParams = {}): Promise<PaginatedResult<Post>> {
    return withDb(async (db) => {
      const page = params.page !== undefined && params.page > 0 ? params.page : 1
      const limit = params.limit !== undefined && params.limit > 0 ? params.limit : 10
      const skip = (page - 1) * limit

      let filtered = db.data.posts.filter(p => p.deletedAt === null)

      if (params.authorId) {
        if (Array.isArray(params.authorId)) {
          filtered = filtered.filter(p => params.authorId!.includes(p.authorId))
        }
        else {
          filtered = filtered.filter(p => p.authorId === params.authorId)
        }
      }

      if (params.replyToId !== undefined) {
        filtered = filtered.filter(p => p.replyToId === params.replyToId)
      }

      if (params.tags && params.tags.length > 0) {
        filtered = filtered.filter(p => p.tags.some(t => params.tags!.includes(t)))
      }

      if (params.search) {
        const searchLower = params.search.toLowerCase()
        filtered = filtered.filter(p => p.text.toLowerCase().includes(searchLower))
      }

      const total = filtered.length
      const paginated = filtered.slice(skip, skip + limit)

      const data = paginated.map((doc) => {
        const repliesCount = db.data.posts.filter(
          r => r.replyToId === doc.id && r.deletedAt === null,
        ).length
        return this.toDomain(doc, repliesCount)
      })

      return { data, total }
    })
  }

  public async findById(id: string): Promise<Post | null> {
    return withDb(async (db) => {
      const doc = db.data.posts.find(p => p.id === id && p.deletedAt === null)
      if (!doc) {
        return null
      }

      const repliesCount = db.data.posts.filter(
        r => r.replyToId === id && r.deletedAt === null,
      ).length

      return this.toDomain(doc, repliesCount)
    })
  }

  public async update(id: string, data: Partial<Post>): Promise<boolean> {
    return withDb(async (db) => {
      const index = db.data.posts.findIndex(p => p.id === id && p.deletedAt === null)
      if (index === -1) {
        return false
      }

      const doc = db.data.posts[index]

      if (data.text !== undefined) {
        doc.text = data.text
      }
      if (data.tags !== undefined) {
        doc.tags = data.tags
      }
      if (data.replyToId !== undefined) {
        doc.replyToId = data.replyToId
      }
      if (data.reactions !== undefined) {
        doc.reactions = data.reactions
      }

      if (data.text === undefined && data.tags === undefined && data.replyToId === undefined && data.reactions === undefined) {
        return false
      }

      doc.updatedAt = new Date()
      await db.write()

      return true
    })
  }

  public async delete(id: string): Promise<boolean> {
    return withDb(async (db) => {
      const index = db.data.posts.findIndex(p => p.id === id && p.deletedAt === null)
      if (index === -1) {
        return false
      }

      db.data.posts[index].deletedAt = new Date()
      await db.write()

      return true
    })
  }

  public async react(postId: string, userId: string, type: string): Promise<boolean> {
    return withDb(async (db) => {
      const post = db.data.posts.find(p => p.id === postId && p.deletedAt === null)
      if (!post) {
        return false
      }

      const existingReactionIndex = post.reactions.findIndex(r => r.userId === userId)

      if (existingReactionIndex !== -1) {
        if (post.reactions[existingReactionIndex].type === type) {
          return true
        }
        post.reactions[existingReactionIndex].type = type
      }
      else {
        post.reactions.push({ userId, type })
      }

      await db.write()
      return true
    })
  }

  public async unreact(postId: string, userId: string): Promise<boolean> {
    return withDb(async (db) => {
      const post = db.data.posts.find(p => p.id === postId && p.deletedAt === null)
      if (!post) {
        return false
      }

      const initialLength = post.reactions.length
      post.reactions = post.reactions.filter(r => r.userId !== userId)

      if (post.reactions.length === initialLength) {
        return false
      }

      await db.write()
      return true
    })
  }

  public async getTrendingTags(limit: number = 10): Promise<Array<{ tag: string, count: number }>> {
    return withDb(async (db) => {
      const tagCount = new Map<string, number>()

      for (const post of db.data.posts) {
        if (post.deletedAt !== null) {
          continue
        }
        for (const tag of post.tags) {
          tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1)
        }
      }

      const sorted = Array.from(tagCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }))

      return sorted
    })
  }

  public async findAllReplies(postId: string, maxDepth: number): Promise<Post[]> {
    if (maxDepth <= 0) {
      return []
    }

    return withDb(async (db) => {
      const posts = db.data.posts

      const getReplies = (parentId: string): LowdbPost[] => {
        return posts.filter(p => p.replyToId === parentId && p.deletedAt === null)
      }

      const allRepliesMap = new Map<string, LowdbPost>()
      let currentLevel = getReplies(postId)

      for (const doc of currentLevel) {
        allRepliesMap.set(doc.id, doc)
      }

      let depth = 1
      while (depth < maxDepth && currentLevel.length > 0) {
        const nextLevel: LowdbPost[] = []
        for (const parent of currentLevel) {
          const children = getReplies(parent.id)
          for (const child of children) {
            allRepliesMap.set(child.id, child)
            nextLevel.push(child)
          }
        }
        currentLevel = nextLevel
        depth++
      }

      const replyToCount = new Map<string, number>()
      for (const post of posts) {
        if (post.replyToId && post.deletedAt === null) {
          replyToCount.set(post.replyToId, (replyToCount.get(post.replyToId) ?? 0) + 1)
        }
      }

      return Array.from(allRepliesMap.values()).map(doc =>
        this.toDomain(doc, replyToCount.get(doc.id) ?? 0),
      )
    })
  }

  private toDomain(doc: LowdbPost, repliesCount?: number): Post {
    return new Post({
      id: doc.id,
      authorId: doc.authorId,
      text: doc.text,
      tags: doc.tags,
      replyToId: doc.replyToId,
      reactions: doc.reactions,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      deletedAt: doc.deletedAt,
      repliesCount,
    })
  }
}
