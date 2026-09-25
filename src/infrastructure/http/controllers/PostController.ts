import { Request, Response } from 'express';
import { CreatePostUseCase } from '../../../use-cases/CreatePostUseCase';
import { ListPostsUseCase } from '../../../use-cases/ListPostsUseCase';
import { GetPostUseCase } from '../../../use-cases/GetPostUseCase';
import { UpdatePostUseCase } from '../../../use-cases/UpdatePostUseCase';
import { DeletePostUseCase } from '../../../use-cases/DeletePostUseCase';

export class PostController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly listPostsUseCase: ListPostsUseCase,
    private readonly getPostUseCase: GetPostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase
  ) {}

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body;
      if (!text) {
        res.status(400).json({ msg: 'text is required' });
        return;
      }
      const result = await this.createPostUseCase.execute({ text });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ msg: error.message });
    }
  };

  public list = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.listPostsUseCase.execute();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ msg: error.message });
    }
  };

  public get = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        res.status(400).json({ msg: 'invalid id' });
        return;
      }
      const result = await this.getPostUseCase.execute({ id });
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Post not found') {
        res.status(404).json({ msg: error.message });
      } else {
        res.status(500).json({ msg: error.message });
      }
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { text } = req.body;
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        res.status(400).json({ msg: 'invalid id' });
        return;
      }
      if (!text) {
        res.status(400).json({ msg: 'text is required' });
        return;
      }
      const result = await this.updatePostUseCase.execute({ id, text });
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Post not found') {
        res.status(404).json({ msg: error.message });
      } else {
        res.status(500).json({ msg: error.message });
      }
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        res.status(400).json({ msg: 'invalid id' });
        return;
      }
      const result = await this.deletePostUseCase.execute({ id });
      res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Post not found') {
        res.status(404).json({ msg: error.message });
      } else {
        res.status(500).json({ msg: error.message });
      }
    }
  };
}
