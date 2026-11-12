import type { ICacheAdapter } from '../domain/adapters/cache-adapter'
import type { Post } from '../domain/entities/post'
import type { PostRepository } from '../domain/repositories/post-repository'
import process from 'node:process'
import { PostNotFoundError } from './errors'

export interface GetPostRequest {
  readonly id: string
  readonly includeReplies?: boolean
  readonly maxDepth?: number
}

export class GetPostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly cache?: ICacheAdapter,
  ) {}

  public async execute(request: GetPostRequest): Promise<Post> {
    const cacheKey = `posts:get:${request.id}:${request.includeReplies || 'none'}:${request.maxDepth ?? 'none'}`

    if (this.cache) {
      const cached = await this.cache.get<Post>(cacheKey)
      if (cached) {
        return cached
      }
    }

    const post = await this.postRepository.findById(request.id)
    if (!post) {
      throw new PostNotFoundError()
    }

    const maxDepth = request.maxDepth ?? parseInt(process.env.MAX_THREAD_DEPTH ?? '3', 10)

    if (request.includeReplies) {
      const allReplies = await this.postRepository.findAllReplies(request.id, maxDepth)

      const repliesByParent = this.groupRepliesByParent(allReplies)

      const topLevelReplies = allReplies.filter(r => r.replyToId === request.id)

      if (topLevelReplies.length > 0) {
        post.replies = await this.buildReplyTree(topLevelReplies, 0, maxDepth - 1, repliesByParent)
      }
    }

    if (this.cache) {
      await this.cache.set(cacheKey, post, 300)
    }

    return post
  }

  private groupRepliesByParent(replies: Post[]): Map<string, Post[]> {
    const grouped = new Map<string, Post[]>()
    for (const reply of replies) {
      if (reply.replyToId) {
        const existing = grouped.get(reply.replyToId) || []
        existing.push(reply)
        grouped.set(reply.replyToId, existing)
      }
    }
    return grouped
  }

  private async buildReplyTree(
    replies: Post[],
    currentDepth: number,
    maxDepth: number,
    repliesByParent: Map<string, Post[]>,
  ): Promise<Post[]> {
    for (const reply of replies) {
      const childReplies = repliesByParent.get(reply.id!) || []

      if (currentDepth < maxDepth && childReplies.length > 0) {
        reply.replies = await this.buildReplyTree(childReplies, currentDepth + 1, maxDepth, repliesByParent)
      }
    }

    return replies
  }
}
