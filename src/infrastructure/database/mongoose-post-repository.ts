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
    return this.toDomain(createdModel)
  }

  public async findAll(params: FindAllParams = {}): Promise<PaginatedResult<Post>> {
    const query: Record<string, any> = { deletedAt: null }

    if (params.authorId) {
      query.authorId = params.authorId
    }

    if (params.replyToId !== undefined) {
      query.replyToId = params.replyToId
    }

    if (params.tags && params.tags.length > 0) {
      query.tags = { $in: params.tags }
    }

    const page = params.page !== undefined && params.page > 0 ? params.page : 1
    const limit = params.limit !== undefined && params.limit > 0 ? params.limit : 10
    const skip = (page - 1) * limit

    const [models, total] = await Promise.all([
      PostModel.find(query).skip(skip).limit(limit).exec(),
      PostModel.countDocuments(query).exec(),
    ])

    return {
      data: models.map(model => this.toDomain(model)),
      total,
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
    return this.toDomain(model)
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

  private toDomain(model: IPost): Post {
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
    })
  }
}
