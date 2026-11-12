import type { LowdbSchema } from './schema'
import process from 'node:process'
import { Low, Memory } from 'lowdb'
import { JSONFilePreset } from 'lowdb/node'

let db: Low<LowdbSchema> | null = null

export async function initializeLowdb(): Promise<Low<LowdbSchema>> {
  const file = process.env.LOWDB_FILE || './data/db.json'
  db = await JSONFilePreset<LowdbSchema>(file, { posts: [], bookmarks: [] })
  return db
}

export function initializeLowdbWithMemory(): Low<LowdbSchema> {
  db = new Low<LowdbSchema>(new Memory(), { posts: [], bookmarks: [] })
  return db
}

export function setDb(instance: Low<LowdbSchema>): void {
  db = instance
}

export function getDb(): Low<LowdbSchema> {
  if (!db) {
    throw new Error('Lowdb not initialized. Call initializeLowdb() first.')
  }
  return db
}
