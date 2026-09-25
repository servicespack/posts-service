import { describe, it, expect } from 'vitest';
import { Post } from '../../../src/domain/entities/Post';

describe('Post Entity', () => {
  it('should instantiate a Post with correct properties', () => {
    const date = new Date();
    const post = new Post({
      id: '1',
      text: 'Hello world',
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    });

    expect(post.id).toBe('1');
    expect(post.text).toBe('Hello world');
    expect(post.createdAt).toBe(date);
    expect(post.updatedAt).toBe(date);
    expect(post.deletedAt).toBeNull();
  });
});
