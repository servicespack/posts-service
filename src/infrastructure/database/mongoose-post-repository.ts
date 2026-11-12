import type { FindAllParams, PaginatedResult, PostRepository } from '../../domain/repositories/post-repository'
import type { IPost } from './models/post-model'
import { Types } from 'mongoose'
import { Post } from '../../domain/entities/post'
import { PostModel } from './models/post-model'

export class MongoosePostRepository implements PostRepository {
  public async create(post: Post): Promise<Post> {
    const createdModel = await PostModel.create({
      authorId: post.authorId,
      text: post.text,
      tags: post.tags,
      replyToId: post.replyToId,
      reactions: post.reactions,
    })
    return this.toDomain(createdModel, 0)
  }

  public async findAll(params: FindAllParams = {}): Promise<PaginatedResult<Post>> {
    const query: Record<string, any> = { deletedAt: null }

    if (params.authorId) {
      if (Array.isArray(params.authorId)) {
        query.authorId = { $in: params.authorId }
      }
      else {
        query.authorId = params.authorId
      }
    }

    if (params.replyToId !== undefined) {
      query.replyToId = params.replyToId
    }

    if (params.tags && params.tags.length > 0) {
      query.tags = { $in: params.tags }
    }

    if (params.search) {
      query.text = { $regex: escapeRegex(params.search), $options: 'i' }
    }

    const page = params.page !== undefined && params.page > 0 ? params.page : 1
    const limit = params.limit !== undefined && params.limit > 0 ? params.limit : 10
    const skip = (page - 1) * limit

    const pipeline: any[] = [{ $match: query }]

    pipeline.push({ $skip: skip }, { $limit: limit })

    pipeline.push(
      { $addFields: { _idStr: { $toString: '$_id' } } },
      {
        $lookup: {
          from: PostModel.collection.name,
          localField: '_idStr',
          foreignField: 'replyToId',
          as: 'repliesCountResult',
          pipeline: [{ $match: { deletedAt: null } }, { $count: 'count' }],
        },
      },
      {
        $addFields: {
          repliesCount: { $ifNull: [{ $arrayElemAt: ['$repliesCountResult.count', 0] }, 0] },
        },
      },
      { $project: { _idStr: 0, repliesCountResult: 0 } },
    )

    const [results, countResult] = await Promise.all([
      PostModel.aggregate(pipeline).exec(),
      PostModel.countDocuments(query).exec(),
    ])

    const data = results.map(model => this.toDomain(model, model.repliesCount))

    return {
      data,
      total: countResult,
    }
  }

  public async findById(id: string): Promise<Post | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null
    }
    const model = await PostModel.findOne({ _id: id, deletedAt: null })
    if (!model) {
      return null
    }
    const repliesCount = await PostModel.countDocuments({ replyToId: id, deletedAt: null }).exec()
    return this.toDomain(model, repliesCount)
  }

  public async update(id: string, data: Partial<Post>): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false
    }

    const updateData: Partial<IPost> = {}
    if (data.text !== undefined)
      updateData.text = data.text
    if (data.tags !== undefined)
      updateData.tags = data.tags
    if (data.replyToId !== undefined)
      updateData.replyToId = data.replyToId
    if (data.reactions !== undefined)
      updateData.reactions = data.reactions

    if (Object.keys(updateData).length === 0) {
      return false
    }

    const result = await PostModel.updateOne(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { runValidators: true },
    )
    return result.matchedCount > 0
  }

  public async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false
    }
    const result = await PostModel.updateOne(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    )
    return result.matchedCount > 0
  }

  public async react(postId: string, userId: string, type: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(postId)) {
      return false
    }

    const updateResult = await PostModel.updateOne(
      {
        '_id': postId,
        'deletedAt': null,
        'reactions.userId': userId,
        'reactions.type': { $ne: type },
      },
      {
        $set: { 'reactions.$.type': type },
      },
    )

    if (updateResult.matchedCount > 0) {
      return true
    }

    const pushResult = await PostModel.updateOne(
      {
        '_id': postId,
        'deletedAt': null,
        'reactions.userId': { $ne: userId },
      },
      {
        $push: { reactions: { userId, type } },
      },
    )

    if (pushResult.matchedCount > 0) {
      return true
    }

    const postExists = await PostModel.exists({ _id: postId, deletedAt: null })
    return !!postExists
  }

  public async unreact(postId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(postId)) {
      return false
    }
    const result = await PostModel.updateOne(
      { _id: postId, deletedAt: null },
      { $pull: { reactions: { userId } } },
    )
    return result.matchedCount > 0
  }

  public async getTrendingTags(limit: number = 10): Promise<Array<{ tag: string, count: number }>> {
    const pipeline: any[] = [
      { $match: { deletedAt: null } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]

    const result = await PostModel.aggregate(pipeline).exec()

    return result.map(item => ({
      tag: String(item._id),
      count: item.count,
    }))
  }

  public async findAllReplies(postId: string, maxDepth: number): Promise<Post[]> {
    if (maxDepth <= 0)
      return []

    const allReplies: Map<string, IPost> = new Map()
    let currentLevel = await PostModel.find({ replyToId: postId, deletedAt: null }).exec()
    for (const doc of currentLevel) {
      allReplies.set(doc._id.toString(), doc)
    }

    let depth = 1
    while (depth < maxDepth && currentLevel.length > 0) {
      const parentIds = currentLevel.map(doc => doc._id.toString())
      currentLevel = await PostModel.find({
        replyToId: { $in: parentIds },
        deletedAt: null,
      }).exec()

      for (const doc of currentLevel) {
        allReplies.set(doc._id.toString(), doc)
      }
      depth++
    }

    const counts = await this.countRepliesByParent(Array.from(allReplies.keys()))
    return Array.from(allReplies.entries()).map(([id, doc]) => this.toDomain(doc, counts.get(id) ?? 0))
  }

  private async countRepliesByParent(parentIds: string[]): Promise<Map<string, number>> {
    if (parentIds.length === 0) {
      return new Map()
    }

    const rows: Array<{ _id: string, count: number }> = await PostModel.aggregate([
      { $match: { replyToId: { $in: parentIds }, deletedAt: null } },
      { $group: { _id: '$replyToId', count: { $sum: 1 } } },
    ]).exec()

    return new Map(rows.map(row => [String(row._id), row.count]))
  }

  private toDomain(model: IPost, repliesCount?: number, replies?: Post[]): Post {
    return new Post({
      id: model._id.toString(),
      authorId: model.authorId,
      text: model.text,
      tags: model.tags,
      replyToId: model.replyToId,
      reactions: model.reactions,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
      repliesCount,
      replies,
    })
  }
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
