import { MongoClient } from 'mongodb'
import { config } from './config.js'

let client
export let db
let indexed = false

export async function connect(uri = config.mongoUri) {
  if (db) return db
  // Reuse one connection across warm serverless invocations instead of opening a new one each time.
  globalThis.__prbMongo ??= new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 10000 }).connect()
  client = await globalThis.__prbMongo
  db = client.db(config.dbName)
  if (!indexed) { await createIndexes(); indexed = true }
  return db
}

function createIndexes() {
  return Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex({ status: 1, createdAt: -1 }),
    db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('submissions').createIndex({ type: 1, createdAt: -1 }),
    db.collection('users').createIndex({ employeeId: 1 }, { unique: true, partialFilterExpression: { employeeId: { $type: 'string' } } }),
    db.collection('activity').createIndex({ userId: 1, at: -1 }),
    db.collection('missions').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('payStubs').createIndex({ userId: 1, payDate: -1 }),
    db.collection('taxForms').createIndex({ userId: 1, year: -1 }),
    db.collection('punches').createIndex({ userId: 1, at: -1 }),
    db.collection('punches').createIndex({ at: -1 }),
    db.collection('timesheets').createIndex({ userId: 1, weekStart: -1 }, { unique: true }),
    db.collection('timesheets').createIndex({ status: 1, submittedAt: -1 }),
    db.collection('timeOff').createIndex({ userId: 1, submittedAt: -1 }),
    db.collection('timeOff').createIndex({ status: 1, submittedAt: -1 }),
    db.collection('notifications').createIndex({ at: -1 }),
    db.collection('notifications').createIndex({ read: 1 }),
    db.collection('serviceRequests').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('serviceRequests').createIndex({ status: 1, createdAt: -1 }),
    db.collection('equipmentRequests').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('equipmentRequests').createIndex({ status: 1, createdAt: -1 }),
    db.collection('shipments').createIndex({ tracking: 1 }, { unique: true }),
    db.collection('shipments').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('detailSubmissions').createIndex({ at: -1 }),
    db.collection('identityDocs').createIndex({ userId: 1, submittedAt: -1 }),
    db.collection('documents').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('docAcks').createIndex({ docId: 1, userId: 1 }, { unique: true }),
    db.collection('helpRequests').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('loginAttempts').createIndex({ key: 1 }),
    db.collection('loginAttempts').createIndex({ at: 1 }, { expireAfterSeconds: 60 * 60 }),
  ])
}

export const close = async () => {
  try { await client?.close() } finally { client = undefined; db = undefined; globalThis.__prbMongo = undefined; indexed = false }
}
export const col = (name) => db.collection(name)
