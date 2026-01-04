// hash-password.js
import bcrypt from 'bcrypt';           // or: const bcrypt = require('bcrypt');

const plainPassword = 'AdminPassword123!';  // <-- choose your real password
const ROUNDS = 12; // cost factor (10–12 is typical for web apps)

async function run() {
  const hash = await bcrypt.hash(plainPassword, ROUNDS);
  console.log('Password hash:');
  console.log(hash);
}

run().catch(console.error);
