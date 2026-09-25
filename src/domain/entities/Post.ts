export interface PostProps {
  id?: string;
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Post {
  public id?: string;
  public text: string;
  public createdAt?: Date;
  public updatedAt?: Date;
  public deletedAt?: Date | null;

  constructor(props: PostProps) {
    this.id = props.id;
    this.text = props.text;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt;
  }
}
