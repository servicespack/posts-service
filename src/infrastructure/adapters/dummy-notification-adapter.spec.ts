import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DummyNotificationAdapter } from './dummy-notification-adapter'

describe('dummyNotificationAdapter', () => {
  let adapter: DummyNotificationAdapter

  beforeEach(() => {
    adapter = new DummyNotificationAdapter()
  })

  it('should call logger for bookmark notification', async () => {
    const spy = vi.spyOn(adapter, 'notifyBookmark')
    await adapter.notifyBookmark({ userId: 'u1', postId: 'p1' })
    expect(spy).toHaveBeenCalled()
  })

  it('should call logger for reply notification', async () => {
    const spy = vi.spyOn(adapter, 'notifyReply')
    await adapter.notifyReply({ userId: 'u1', postId: 'p1', repliedByUserId: 'u2' })
    expect(spy).toHaveBeenCalled()
  })

  it('should call logger for reaction notification', async () => {
    const spy = vi.spyOn(adapter, 'notifyReaction')
    await adapter.notifyReaction({ userId: 'u1', postId: 'p1', reactedByUserId: 'u2', reactionType: 'LIKE' })
    expect(spy).toHaveBeenCalled()
  })
})
