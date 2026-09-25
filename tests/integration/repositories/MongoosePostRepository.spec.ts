import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { MongoosePostRepository } from '../../../src/infrastructure/database/MongoosePostRepository';
import { Post } from '../../../src/domain/entities/Post';
import { PostModel } from '../../../src/infrastructure/database/models/PostModel';

describe('MongoosePostRepository Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let repository: MongoosePostRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    repository = new MongoosePostRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await PostModel.deleteMany({});
  });

  it('should create a post in the database', async () => {
    const post = new Post({ text: 'Integration Test Post' });
    const created = await repository.create(post);

    expect(created.id).toBeDefined();
    expect(created.text).toBe('Integration Test Post');
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
    expect(created.deletedAt).toBeNull();

    // Verify it was actually saved in the DB
    const dbPost = await PostModel.findById(created.id);
    expect(dbPost).not.toBeNull();
    expect(dbPost?.text).toBe('Integration Test Post');
  });

  it('should find all active posts', async () => {
    const post1 = await PostModel.create({ text: 'Post 1' });
    const post2 = await PostModel.create({ text: 'Post 2' });
    // Deleted post
    await PostModel.create({ text: 'Post 3', deletedAt: new Date() });

    const posts = await repository.findAll();

    expect(posts).toHaveLength(2);
    expect(posts.map((t) => t.text)).toContain('Post 1');
    expect(posts.map((t) => t.text)).toContain('Post 2');
    expect(posts.map((t) => t.text)).not.toContain('Post 3');
  });

  it('should find post by id', async () => {
    const postDoc = await PostModel.create({ text: 'Find Me' });

    const found = await repository.findById(postDoc._id.toString());

    expect(found).not.toBeNull();
    expect(found?.text).toBe('Find Me');
  });

  it('should return null if finding a deleted post or non-existing id', async () => {
    const postDoc = await PostModel.create({ text: 'Deleted', deletedAt: new Date() });

    const foundDeleted = await repository.findById(postDoc._id.toString());
    const foundNonExisting = await repository.findById(new mongoose.Types.ObjectId().toString());

    expect(foundDeleted).toBeNull();
    expect(foundNonExisting).toBeNull();
  });

  it('should update a post successfully', async () => {
    const postDoc = await PostModel.create({ text: 'Original text' });

    const updated = await repository.update(postDoc._id.toString(), 'New text');

    expect(updated).toBe(true);

    const dbPost = await PostModel.findById(postDoc._id);
    expect(dbPost?.text).toBe('New text');
  });

  it('should return false if updating non-existing or deleted post', async () => {
    const postDoc = await PostModel.create({ text: 'Deleted', deletedAt: new Date() });
    const nonExistingId = new mongoose.Types.ObjectId().toString();

    const updatedDeleted = await repository.update(postDoc._id.toString(), 'New text');
    const updatedNonExisting = await repository.update(nonExistingId, 'New text');

    expect(updatedDeleted).toBe(false);
    expect(updatedNonExisting).toBe(false);
  });

  it('should soft delete a post successfully', async () => {
    const postDoc = await PostModel.create({ text: 'To delete' });

    const deleted = await repository.delete(postDoc._id.toString());

    expect(deleted).toBe(true);

    const dbPost = await PostModel.findById(postDoc._id);
    expect(dbPost?.deletedAt).toBeInstanceOf(Date);
  });

  it('should return false if deleting non-existing or already deleted post', async () => {
    const postDoc = await PostModel.create({ text: 'Deleted', deletedAt: new Date() });
    const nonExistingId = new mongoose.Types.ObjectId().toString();

    const deletedAlready = await repository.delete(postDoc._id.toString());
    const deletedNonExisting = await repository.delete(nonExistingId);

    expect(deletedAlready).toBe(false);
    expect(deletedNonExisting).toBe(false);
  });
});
