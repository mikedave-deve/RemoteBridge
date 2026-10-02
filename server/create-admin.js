// Create or reset an admin account:  npm run create-admin
import readline from 'node:readline'
import { checkConfig } from './config.js'
import { close, col, connect } from './db.js'
import { hashPassword, isEmail, strongPassword } from './security.js'

checkConfig()
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise((r) => rl.question(q, r))
// Hide what is typed for the password.
const askHidden = (q) => new Promise((resolve) => {
  const write = rl._writeToOutput
  rl._writeToOutput = (s) => rl.output.write(s.startsWith(q) ? q : '*')
  rl.question(q, (a) => { rl._writeToOutput = write; rl.output.write('\n'); resolve(a) })
})

try {
  await connect()
  const name = (await ask('Admin full name: ')).trim() || 'Site Admin'
  const email = (await ask('Admin email: ')).trim().toLowerCase()
  if (!isEmail(email)) throw new Error('That email address is not valid.')
  const password = await askHidden('Password (8+ characters with upper and lower case, a number and a symbol): ')
  if (!strongPassword(password, [email.split('@')[0]])) throw new Error('That password is not strong enough.')
  if (password !== await askHidden('Confirm password: ')) throw new Error('Passwords do not match.')
  const [first, ...rest] = name.split(' ')
  const now = new Date()
  await col('users').updateOne(
    { email },
    { $set: { first, last: rest.join(' ') || 'Admin', passwordHash: await hashPassword(password), role: 'admin', status: 'approved', updatedAt: now },
      $setOnInsert: { email, phone: '', profile: {}, createdAt: now } },
    { upsert: true },
  )
  await col('sessions').deleteMany({ userId: (await col('users').findOne({ email }))._id })
  console.log(`\nAdmin account ready: ${email}. Log in at /login to open the admin portal.`)
} catch (e) {
  console.error(`\n${e.message}`)
  process.exitCode = 1
} finally {
  rl.close()
  await close()
}
