import type { INotificationAdapter, NotifyBookmarkEvent, NotifyReactionEvent, NotifyReplyEvent } from '../../domain/adapters/notification-adapter'
import { logger } from '../logging/logger'

export class DummyNotificationAdapter implements INotificationAdapter {
  async notifyBookmark(event: NotifyBookmarkEvent): Promise<void> {
    logger.info({ event }, '[Dummy] Bookmark notification triggered')
  }

  async notifyReply(event: NotifyReplyEvent): Promise<void> {
    logger.info({ event }, '[Dummy] Reply notification triggered')
  }

  async notifyReaction(event: NotifyReactionEvent): Promise<void> {
    logger.info({ event }, `[Dummy] Reaction notification triggered (${event.reactionType})`)
  }
}
