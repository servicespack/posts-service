import type { Document } from 'mongoose'
import { model, Schema } from 'mongoose'

export interface IBookmark extends Document {
  userId: string
  postId: string
  createdAt: Date
  updatedAt: Date
}

const bookmarkSchema = new Schema<IBookmark>({
  userId: { type: String, required: true, index: true },
  postId: { type: String, required: true },
}, {
  timestamps: true,
})

bookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true })

export const BookmarkModel = model<IBookmark>('Bookmark', bookmarkSchema)
