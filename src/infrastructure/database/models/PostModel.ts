import { Schema, model, Document } from 'mongoose';

export interface IPost extends Document {
  text: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const PostSchema = new Schema<IPost>(
  {
    text: { type: String, required: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const PostModel = model<IPost>('Post', PostSchema);
