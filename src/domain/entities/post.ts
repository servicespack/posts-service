export interface PostProps {
  id?: string
  authorId: string
  text: string
  tags?: string[]
  replyToId?: string
  reactions?: Array<{ type: string, userId: string }>
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export class Post {
  public id?: string
  public authorId: string
  public text: string
  public tags: string[]
  public replyToId?: string
  public reactions: Array<{ type: string, userId: string }>
  public createdAt?: Date
  public updatedAt?: Date
  public deletedAt?: Date | null

  constructor(props: PostProps) {
    this.id = props.id
    this.authorId = props.authorId
    this.text = props.text
    this.tags = props.tags ?? []
    this.replyToId = props.replyToId
    this.reactions = props.reactions ?? []
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.deletedAt = props.deletedAt
  }
}
