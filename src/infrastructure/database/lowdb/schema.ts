export interface LowdbPost {
  id: string
  authorId: string
  text: string
  tags: string[]
  replyToId?: string
  reactions: Array<{ type: string, userId: string }>
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface LowdbBookmark {
  id: string
  userId: string
  postId: string
  createdAt: Date
}

export interface LowdbSchema {
  posts: LowdbPost[]
  bookmarks: LowdbBookmark[]
}
