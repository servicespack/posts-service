import { PostRepository } from '../../domain/repositories/PostRepository';
import { Post } from '../../domain/entities/Post';
import { PostModel, IPost } from './models/PostModel';

export class MongoosePostRepository implements PostRepository {
  public async create(post: Post): Promise<Post> {
    const createdModel = await PostModel.create({
      text: post.text,
    });
    return this.toDomain(createdModel);
  }

  public async findAll(): Promise<Post[]> {
    const models = await PostModel.find({ deletedAt: null });
    return models.map((model) => this.toDomain(model));
  }

  public async findById(id: string): Promise<Post | null> {
    const model = await PostModel.findOne({ _id: id, deletedAt: null });
    if (!model) {
      return null;
    }
    return this.toDomain(model);
  }

  public async update(id: string, text: string): Promise<boolean> {
    const result = await PostModel.updateOne(
      { _id: id, deletedAt: null },
      { text }
    );
    return result.matchedCount > 0;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await PostModel.updateOne(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() }
    );
    return result.matchedCount > 0;
  }

  private toDomain(model: IPost): Post {
    return new Post({
      id: model._id.toString(),
      text: model.text,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    });
  }
}
