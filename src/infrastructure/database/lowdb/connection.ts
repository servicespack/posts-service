import type { LowdbSchema } from './schema'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { Low, Memory } from 'lowdb'
import { DataFile } from 'lowdb/node'

const DATE_FIELDS = new Set(['createdAt', 'updatedAt', 'deletedAt'])

let db: Low<LowdbSchema> | null = null
let queue: Promise<unknown> = Promise.resolve()

function parseWithDates(text: string): LowdbSchema {
  return JSON.parse(text, (key, value) => (DATE_FIELDS.has(key) && typeof value === 'string' ? new Date(value) : value))
}

export async function initializeLowdb(): Promise<Low<LowdbSchema>> {
  const file = process.env.LOWDB_FILE || './data/db.json'
  await mkdir(path.dirname(file), { recursive: true })
  const adapter = new DataFile<LowdbSchema>(file, {
    parse: parseWithDates,
    stringify: data => JSON.stringify(data, null, 2),
  })
  db = new Low<LowdbSchema>(adapter, { posts: [], bookmarks: [] })
  await db.read()
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

export function withDb<T>(operation: (instance: Low<LowdbSchema>) => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const instance = getDb()
    await instance.read()
    return operation(instance)
  })
  queue = run.catch(() => {})
  return run
}
