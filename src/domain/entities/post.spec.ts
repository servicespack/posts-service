import { describe, expect, it } from 'vitest'
import { Post } from './post'

describe('post Entity', () => {
  it('should instantiate a Post with correct properties', () => {
    const date = new Date()
    const post = new Post({
      id: '1',
      authorId: 'author-123',
      text: 'Hello world',
      tags: ['tech', 'news'],
      replyToId: 'post-99',
      reactions: [{ type: 'LIKE', userId: 'user-1' }],
      createdAt: date,
      updatedAt: date,
      deletedAt: null,
    })

    expect(post.id).toBe('1')
    expect(post.authorId).toBe('author-123')
    expect(post.text).toBe('Hello world')
    expect(post.tags).toEqual(['tech', 'news'])
    expect(post.replyToId).toBe('post-99')
    expect(post.reactions).toEqual([{ type: 'LIKE', userId: 'user-1' }])
    expect(post.createdAt).toBe(date)
    expect(post.updatedAt).toBe(date)
    expect(post.deletedAt).toBeNull()
  })

  it('should provide default values for tags and reactions', () => {
    const post = new Post({
      authorId: 'author-123',
      text: 'Hello world',
    })

    expect(post.authorId).toBe('author-123')
    expect(post.text).toBe('Hello world')
    expect(post.tags).toEqual([])
    expect(post.reactions).toEqual([])
    expect(post.replyToId).toBeUndefined()
  })
})
