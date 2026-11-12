export interface NotifyBookmarkEvent {
  userId: string
  postId: string
}

export interface NotifyReplyEvent {
  userId: string
  postId: string
  repliedByUserId: string
}

export interface NotifyReactionEvent {
  userId: string
  postId: string
  reactedByUserId: string
  reactionType: string
}

export interface INotificationAdapter {
  notifyBookmark: (event: NotifyBookmarkEvent) => Promise<void>
  notifyReply: (event: NotifyReplyEvent) => Promise<void>
  notifyReaction: (event: NotifyReactionEvent) => Promise<void>
}
