import type { Response } from 'express'
import type { CreatePostUseCase } from '../../../use-cases/create-post-use-case'
import type { DeletePostUseCase } from '../../../use-cases/delete-post-use-case'
import type { GetPostUseCase } from '../../../use-cases/get-post-use-case'
import type { ListPostsUseCase } from '../../../use-cases/list-posts-use-case'
import type { ReactPostUseCase } from '../../../use-cases/react-post-use-case'
import type { UnreactPostUseCase } from '../../../use-cases/unreact-post-use-case'
import type { UpdatePostUseCase } from '../../../use-cases/update-post-use-case'
import type { AuthenticatedRequest } from '../middlewares/auth-middleware'
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
      const { authorId, tags, replyToId, page, limit } = req.query

      const parsedTags = tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined
      const parsedPage = page ? parseInt(page as string, 10) : undefined
      const parsedLimit = limit ? parseInt(limit as string, 10) : undefined

      const result = await this.listPostsUseCase.execute({
        authorId: authorId as string | undefined,
        replyToId: replyToId as string | undefined,
        tags: parsedTags,
        page: parsedPage,
        limit: parsedLimit,
      })
      res.status(200).json(result)
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
      const result = await this.getPostUseCase.execute({ id })
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
}
