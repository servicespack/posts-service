import process from 'node:process'
import mongoose from 'mongoose'

export async function initializeDatabase(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/posts'
  const connection = await mongoose.connect(mongoUri)
  return connection
}
