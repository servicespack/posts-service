import { Post } from '../entities/Post';

export interface PostRepository {
  create(post: Post): Promise<Post>;
  findAll(): Promise<Post[]>;
  findById(id: string): Promise<Post | null>;
  update(id: string, text: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
