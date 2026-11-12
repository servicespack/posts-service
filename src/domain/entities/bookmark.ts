export interface BookmarkProps {
  id?: string
  userId: string
  postId: string
  createdAt?: Date
}

export class Bookmark {
  public id?: string
  public userId: string
  public postId: string
  public createdAt?: Date

  constructor(props: BookmarkProps) {
    this.id = props.id
    this.userId = props.userId
    this.postId = props.postId
    this.createdAt = props.createdAt
  }
}
