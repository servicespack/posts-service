import type { Response } from 'express'
import type { BookmarkPostUseCase } from '../../../use-cases/bookmark-post-use-case'
import type { CreatePostUseCase } from '../../../use-cases/create-post-use-case'
import type { DeletePostUseCase } from '../../../use-cases/delete-post-use-case'
import type { GetPostUseCase } from '../../../use-cases/get-post-use-case'
import type { GetTrendingTagsUseCase } from '../../../use-cases/get-trending-tags-use-case'
import type { ListBookmarksUseCase } from '../../../use-cases/list-bookmarks-use-case'
import type { ListPostsUseCase } from '../../../use-cases/list-posts-use-case'
import type { ReactPostUseCase } from '../../../use-cases/react-post-use-case'
import type { UnbookmarkPostUseCase } from '../../../use-cases/unbookmark-post-use-case'
import type { UnreactPostUseCase } from '../../../use-cases/unreact-post-use-case'
import type { UpdatePostUseCase } from '../../../use-cases/update-post-use-case'
import type { AuthenticatedRequest } from '../middlewares/auth-middleware'
import process from 'node:process'
import { z } from 'zod'

export class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly listPostsUseCase: ListPostsUseCase,
    private readonly getPostUseCase: GetPostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    private readonly reactPostUseCase: ReactPostUseCase,
    private readonly unreactPostUseCase: UnreactPostUseCase,
    private readonly getTrendingTagsUseCase: GetTrendingTagsUseCase,
  ) {}

  public create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schema = z.object({
        text: z.string({ message: 'text is required' }).min(1, 'text is required'),
        authorId: z.string({ message: 'authorId is required' }).min(1, 'authorId is required'),
      })

      const parsed = schema.safeParse({
        text: req.body?.text,
        authorId: req.userId,
      })

      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'Invalid request'
        res.status(400).json({ msg: firstError })
        return
      }

      const { text, tags, replyToId } = req.body
      const authorId = req.userId!
      const result = await this.createPostUseCase.execute({ text, authorId, tags, replyToId })
      res.status(201).json(result)
    }
    catch (error: any) {
      res.status(400).json({ msg: error.message })
    }
  }

  public list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = z.object({
        authorId: z.preprocess(a => Array.isArray(a) ? a : a ? [a] : undefined, z.array(z.string().min(1)).optional()),
        tags: z.preprocess(a => Array.isArray(a) ? a : a ? [a] : undefined, z.array(z.string().min(1)).optional()),
        replyToId: z.string().min(1).optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        search: z.string().min(1).optional(),
      }).safeParse({
        authorId: req.query.authorId,
        tags: req.query.tags,
        replyToId: req.query.replyToId,
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
      })

      if (!parsed.success) {
        res.status(400).json({ msg: 'Invalid query parameters' })
        return
      }

      if (parsed.data.page !== undefined && parsed.data.page < 1) {
        res.status(400).json({ msg: 'page must be >= 1' })
        return
      }
      if (parsed.data.limit !== undefined && parsed.data.limit < 1) {
        res.status(400).json({ msg: 'limit must be >= 1' })
        return
      }

      const result = await this.listPostsUseCase.execute({
        authorId: parsed.data.authorId,
        replyToId: parsed.data.replyToId,
        tags: parsed.data.tags,
        page: parsed.data.page,
        limit: parsed.data.limit,
        search: parsed.data.search,
      })

      const enrichedData = result.data.map(post => this.enrichPost(post, req.userId))
      res.status(200).json({
        data: enrichedData,
        total: result.total,
      })
    }
    catch (error: any) {
      res.status(500).json({ msg: error.message })
    }
  }

  public get = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string
      if (!id || !/^[0-9a-f]{24}$/i.test(id)) {
        res.status(400).json({ msg: 'invalid id' })
        return
      }
      const parsedQuery = z.object({
        includeReplies: z.string().optional(),
        maxDepth: z.string().regex(/^\d+$/).transform(Number).optional(),
      }).safeParse({
        includeReplies: req.query.includeReplies,
        maxDepth: req.query.maxDepth,
      })

      if (!parsedQuery.success) {
        res.status(400).json({ msg: 'Invalid query parameters' })
        return
      }

      const includeReplies = parsedQuery.data.includeReplies === 'true'
      const threadDepthEnv = parseInt(process.env.MAX_THREAD_DEPTH ?? '3', 10)
      const maxDepth = parsedQuery.data.maxDepth !== undefined
        ? Math.min(parsedQuery.data.maxDepth, Number.isNaN(threadDepthEnv) ? 3 : threadDepthEnv)
        : undefined

      const result = await this.getPostUseCase.execute({
        id,
        includeReplies,
        maxDepth,
      })
      const enrichedPost = this.enrichPost(result, req.userId)
      res.status(200).json(enrichedPost)
    }
    catch (error: any) {
      if (error.message === 'Post not found') {
        res.status(404).json({ msg: error.message })
      }
      else {
        res.status(500).json({ msg: error.message })
      }
    }
  }

  public update = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string
      const { text, tags } = req.body
      const userId = req.userId
      if (!id || !/^[0-9a-f]{24}$/i.test(id)) {
        res.status(400).json({ msg: 'invalid id' })
        return
      }
      if (!userId) {
        res.status(400).json({ msg: 'userId is required' })
        return
      }

      // Check ownership
      const post = await this.getPostUseCase.execute({ id })
      if (post.authorId !== userId) {
        res.status(403).json({ msg: 'Forbidden' })
        return
      }

      if (text === undefined && tags === undefined) {
        res.status(400).json({ msg: 'At least one field to update is required' })
        return
      }
      const result = await this.updatePostUseCase.execute({ id, text, tags })
      res.status(200).json(result)
    }
    catch (error: any) {
      if (error.message === 'Post not found') {
        res.status(404).json({ msg: error.message })
      }
      else {
        res.status(500).json({ msg: error.message })
      }
    }
  }

  public delete = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string
      const userId = req.userId
      if (!id || !/^[0-9a-f]{24}$/i.test(id)) {
        res.status(400).json({ msg: 'invalid id' })
        return
      }
      if (!userId) {
        res.status(400).json({ msg: 'userId is required' })
        return
      }

      // Check ownership
      const post = await this.getPostUseCase.execute({ id })
      if (post.authorId !== userId) {
        res.status(403).json({ msg: 'Forbidden' })
        return
      }

      const result = await this.deletePostUseCase.execute({ id })
      res.status(200).json(result)
    }
    catch (error: any) {
      if (error.message === 'Post not found') {
        res.status(404).json({ msg: error.message })
      }
      else {
        res.status(500).json({ msg: error.message })
      }
    }
  }

  public react = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const postId = req.params.id as string
      const { type } = req.body
      const userId = req.userId
      if (!postId || !/^[0-9a-f]{24}$/i.test(postId)) {
        res.status(400).json({ msg: 'invalid id' })
        return
      }
      if (!userId || !type) {
        res.status(400).json({ msg: 'userId and type are required' })
        return
      }
      const result = await this.reactPostUseCase.execute({ postId, userId, type })
      res.status(200).json(result)
    }
    catch (error: any) {
      if (error.message === 'Post not found') {
        res.status(404).json({ msg: error.message })
      }
      else {
        res.status(500).json({ msg: error.message })
      }
    }
  }

  public unreact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const postId = req.params.id as string
      const userId = req.userId
      if (!postId || !/^[0-9a-f]{24}$/i.test(postId)) {
        res.status(400).json({ msg: 'invalid id' })
        return
      }
      if (!userId) {
        res.status(400).json({ msg: 'userId is required' })
        return
      }
      const result = await this.unreactPostUseCase.execute({ postId, userId })
      res.status(200).json(result)
    }
    catch (error: any) {
      if (error.message === 'Post not found') {
        res.status(404).json({ msg: error.message })
      }
      else {
        res.status(500).json({ msg: error.message })
      }
    }
  }

  public getTrendingTags = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = z.object({
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
      }).safeParse({
        limit: req.query.limit,
      })

      if (!parsed.success) {
        res.status(400).json({ msg: 'Invalid query parameters' })
        return
      }
      if (parsed.data.limit !== undefined && parsed.data.limit < 1) {
        res.status(400).json({ msg: 'limit must be >= 1' })
        return
      }

      const result = await this.getTrendingTagsUseCase.execute({ limit: parsed.data.limit })
      res.status(200).json(result)
    }
    catch (error: any) {
      res.status(500).json({ msg: error.message })
    }
  }

  private enrichPost(post: any, currentUserId?: string) {
    const reactionStats: Record<string, number> = {}
    let userReaction: string | null = null

    if (post.reactions && Array.isArray(post.reactions)) {
      for (const rx of post.reactions) {
        reactionStats[rx.type] = (reactionStats[rx.type] || 0) + 1
        if (currentUserId && rx.userId === currentUserId) {
          userReaction = rx.type
        }
      }
    }

    return {
      id: post.id,
      authorId: post.authorId,
      text: post.text,
      tags: post.tags,
      replyToId: post.replyToId,
      reactions: post.reactions,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      deletedAt: post.deletedAt,
      repliesCount: post.repliesCount ?? 0,
      replies: post.replies ?? [],
      reactionStats,
      userReaction,
    }
  }
}

export class PostControllerWithBookmarks extends PostController {
  private bookmarkPostUseCase?: BookmarkPostUseCase
  private unbookmarkPostUseCase?: UnbookmarkPostUseCase
  private listBookmarksUseCase?: ListBookmarksUseCase

  public setBookmarkUseCases(bookmark: BookmarkPostUseCase, unbookmark: UnbookmarkPostUseCase, list: ListBookmarksUseCase) {
    this.bookmarkPostUseCase = bookmark
    this.unbookmarkPostUseCase = unbookmark
    this.listBookmarksUseCase = list
  }

  public bookmark = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const postId = req.params.id as string
      const userId = req.userId
      if (!postId || !/^[0-9a-f]{24}$/i.test(postId)) {
        res.status(400).json({ msg: 'invalid id' })
        return
      }
      if (!userId) {
        res.status(400).json({ msg: 'userId is required' })
        return
      }
      if (!this.bookmarkPostUseCase) {
        res.status(500).json({ msg: 'Bookmark use case not initialized' })
        return
      }
      const result = await this.bookmarkPostUseCase.execute({ userId, postId })
      res.status(201).json(result)
    }
    catch (error: any) {
      if (error.message === 'Bookmark already exists') {
        res.status(409).json({ msg: error.message })
      }
      else if (error.message === 'Post not found') {
        res.status(404).json({ msg: error.message })
      }
      else {
        res.status(500).json({ msg: error.message })
      }
    }
  }

  public unbookmark = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const bookmarkId = req.params.id as string
      const userId = req.userId
      if (!bookmarkId || !/^[0-9a-f]{24}$/i.test(bookmarkId)) {
        res.status(400).json({ msg: 'invalid id' })
        return
      }
      if (!userId) {
        res.status(400).json({ msg: 'userId is required' })
        return
      }
      if (!this.unbookmarkPostUseCase) {
        res.status(500).json({ msg: 'Unbookmark use case not initialized' })
        return
      }
      const result = await this.unbookmarkPostUseCase.execute({ userId, bookmarkId })
      res.status(200).json(result)
    }
    catch (error: any) {
      if (error.message === 'Bookmark not found') {
        res.status(404).json({ msg: error.message })
      }
      else {
        res.status(500).json({ msg: error.message })
      }
    }
  }

  public listBookmarks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId
      if (!userId) {
        res.status(400).json({ msg: 'userId is required' })
        return
      }
      if (!this.listBookmarksUseCase) {
        res.status(500).json({ msg: 'List bookmarks use case not initialized' })
        return
      }
      const parsed = z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
      }).safeParse({
        page: req.query.page,
        limit: req.query.limit,
      })

      if (!parsed.success) {
        res.status(400).json({ msg: 'Invalid query parameters' })
        return
      }

      const result = await this.listBookmarksUseCase.execute({
        userId,
        page: parsed.data.page,
        limit: parsed.data.limit,
      })
      res.status(200).json(result)
    }
    catch (error: any) {
      res.status(500).json({ msg: error.message })
    }
  }
}
