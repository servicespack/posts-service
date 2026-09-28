import type { Document } from 'mongoose'
import { model, Schema } from 'mongoose'

export interface IPost extends Document {
  authorId: string
  text: string
  tags: string[]
  replyToId?: string
  reactions: Array<{ type: string, userId: string }>
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

const ReactionSchema = new Schema(
  {
    type: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { _id: false },
)

const PostSchema = new Schema<IPost>(
  {
    authorId: { type: String, required: true },
    text: { type: String, required: true },
    tags: { type: [String], default: [] },
    replyToId: { type: String, required: false },
    reactions: {
      type: [ReactionSchema],
      default: [],
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
)

export const PostModel = model<IPost>('Post', PostSchema)
