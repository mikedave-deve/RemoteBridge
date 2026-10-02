import { MongoClient } from 'mongodb'
import { config } from './config.js'

let client
export let db

export async function connect(uri = config.mongoUri) {
  client = new MongoClient(uri)
  await client.connect()
  db = client.db(config.dbName)
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex({ status: 1, createdAt: -1 }),
    db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('submissions').createIndex({ type: 1, createdAt: -1 }),
    db.collection('loginAttempts').createIndex({ key: 1 }),
    db.collection('loginAttempts').createIndex({ at: 1 }, { expireAfterSeconds: 60 * 60 }),
  ])
  return db
}

export const close = () => client?.close()
export const col = (name) => db.collection(name)
