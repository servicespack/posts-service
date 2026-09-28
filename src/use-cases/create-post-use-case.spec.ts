import type { PostRepository } from '../domain/repositories/post-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Post } from '../domain/entities/post'
import { CreatePostUseCase } from './create-post-use-case'
import { AuthorIdRequiredError, ParentPostNotFoundError, TextRequiredError } from './errors'

describe('createPostUseCase', () => {
  let postRepository: PostRepository
  let useCase: CreatePostUseCase

  beforeEach(() => {
    postRepository = {
      create: vi.fn().mockImplementation(async post => post),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      react: vi.fn(),
      unreact: vi.fn(),
    }
    useCase = new CreatePostUseCase(postRepository)
  })

  it('should create a post successfully', async () => {
    const response = await useCase.execute({ authorId: 'author-1', text: 'Hello World' })

    expect(response).toStrictEqual({ created: true, post: expect.any(Post) })
    expect(response.post.authorId).toBe('author-1')
    expect(response.post.text).toBe('Hello World')
    expect(response.post.tags).toEqual([])
    expect(response.post.replyToId).toBeUndefined()
    expect(postRepository.create).toHaveBeenCalledTimes(1)
    expect(postRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Hello World', authorId: 'author-1', tags: [] }),
    )
  })

  it('should create a post with tags successfully', async () => {
    const response = await useCase.execute({ authorId: 'author-1', text: 'Hello World', tags: ['news', 'tech'] })

    expect(response).toStrictEqual({ created: true, post: expect.any(Post) })
    expect(response.post.tags).toEqual(['news', 'tech'])
  })

  it('should create a reply post successfully', async () => {
    postRepository.findById = vi.fn().mockResolvedValue(new Post({ id: 'parent-1', authorId: 'a', text: 'a' }))

    const response = await useCase.execute({ authorId: 'author-1', text: 'Hello World', replyToId: 'parent-1' })

    expect(response).toStrictEqual({ created: true, post: expect.any(Post) })
    expect(response.post.replyToId).toBe('parent-1')
    expect(postRepository.findById).toHaveBeenCalledTimes(1)
    expect(postRepository.findById).toHaveBeenCalledWith('parent-1')
    expect(postRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ replyToId: 'parent-1' }),
    )
  })

  it('should throw an error if parent post does not exist', async () => {
    postRepository.findById = vi.fn().mockResolvedValue(null)
    await expect(useCase.execute({ authorId: 'author-1', text: 'Hello', replyToId: 'parent-1' })).rejects.toThrowError(ParentPostNotFoundError)
    expect(postRepository.create).not.toHaveBeenCalled()
  })

  it('should throw an error if text is missing', async () => {
    await expect(useCase.execute({ authorId: 'author-1', text: '' })).rejects.toThrowError(TextRequiredError)
    expect(postRepository.create).not.toHaveBeenCalled()
  })

  it('should throw an error if authorId is missing', async () => {
    await expect(useCase.execute({ authorId: '', text: 'Hello' })).rejects.toThrowError(AuthorIdRequiredError)
    expect(postRepository.create).not.toHaveBeenCalled()
  })
})
