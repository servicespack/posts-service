import { describe, expect, it } from 'vitest'
import { AuthorIdRequiredError } from './author-id-required-error'
import { BookmarkAlreadyExistsError } from './bookmark-already-exists-error'
import { BookmarkNotFoundError } from './bookmark-not-found-error'
import { CacheError } from './cache-error'
import { ListPostsValidationError } from './list-posts-validation-error'
import { ParentPostNotFoundError } from './parent-post-not-found-error'
import { PostIdAndUserIdRequiredError } from './post-id-and-user-id-required-error'
import { PostIdUserIdAndTypeRequiredError } from './post-id-user-id-and-type-required-error'
import { PostNotFoundError } from './post-not-found-error'
import { TextRequiredError } from './text-required-error'
import { ThreadDepthExceededError } from './thread-depth-error'

describe('errors', () => {
  it('authorIdRequiredError should extend Error with correct message', () => {
    const err = new AuthorIdRequiredError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('AuthorId is required')
    expect(err.name).toBe('AuthorIdRequiredError')
  })

  it('bookmarkAlreadyExistsError should extend Error with correct message', () => {
    const err = new BookmarkAlreadyExistsError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Bookmark already exists')
    expect(err.name).toBe('BookmarkAlreadyExistsError')
  })

  it('bookmarkNotFoundError should extend Error with correct message', () => {
    const err = new BookmarkNotFoundError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Bookmark not found')
    expect(err.name).toBe('BookmarkNotFoundError')
  })

  it('cacheError should extend Error with default message', () => {
    const err = new CacheError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Cache operation failed')
    expect(err.name).toBe('CacheError')
  })

  it('cacheError should extend Error with custom message', () => {
    const err = new CacheError('Custom cache error')
    expect(err.message).toBe('Custom cache error')
    expect(err.name).toBe('CacheError')
  })

  it('listPostsValidationError should extend Error with default message', () => {
    const err = new ListPostsValidationError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Invalid query parameters')
    expect(err.name).toBe('ListPostsValidationError')
  })

  it('listPostsValidationError should extend Error with custom message', () => {
    const err = new ListPostsValidationError('Custom validation error')
    expect(err.message).toBe('Custom validation error')
    expect(err.name).toBe('ListPostsValidationError')
  })

  it('parentPostNotFoundError should extend Error with correct message', () => {
    const err = new ParentPostNotFoundError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Parent post not found')
    expect(err.name).toBe('ParentPostNotFoundError')
  })

  it('postIdAndUserIdRequiredError should extend Error with correct message', () => {
    const err = new PostIdAndUserIdRequiredError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('PostId and UserId are required')
    expect(err.name).toBe('PostIdAndUserIdRequiredError')
  })

  it('postIdUserIdAndTypeRequiredError should extend Error with correct message', () => {
    const err = new PostIdUserIdAndTypeRequiredError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('PostId, UserId and Type are required')
    expect(err.name).toBe('PostIdUserIdAndTypeRequiredError')
  })

  it('postNotFoundError should extend Error with correct message', () => {
    const err = new PostNotFoundError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Post not found')
    expect(err.name).toBe('PostNotFoundError')
  })

  it('textRequiredError should extend Error with correct message', () => {
    const err = new TextRequiredError()
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Text is required')
    expect(err.name).toBe('TextRequiredError')
  })

  it('threadDepthExceededError should extend Error with correct message', () => {
    const err = new ThreadDepthExceededError(5)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Thread depth exceeded maximum allowed depth of 5')
    expect(err.name).toBe('ThreadDepthExceededError')
  })
})
