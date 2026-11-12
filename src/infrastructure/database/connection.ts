import process from 'node:process'

export async function initializeDatabase(): Promise<void> {
  const driver = process.env.DATABASE_DRIVER || 'mongodb'

  if (driver === 'lowdb') {
    const { initializeLowdb } = await import('./lowdb/connection')
    await initializeLowdb()
    return
  }

  const mongoose = await import('mongoose')
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/posts'
  await mongoose.default.connect(mongoUri)
}
