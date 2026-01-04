// api/admin/users.js
import bcrypt from 'bcryptjs';
import { getAdminPool } from '../../lib/admindb.js';

const BCRYPT_ROUNDS = 12;

export default async function handler(req, res) {
  const adminPool = getAdminPool();

  try {
    if (req.method === 'GET') {
      const [rows] = await adminPool.query(
        `SELECT 
           id,
           username,
           is_protected,
           security_question_id
         FROM admin_users
         ORDER BY username ASC`
      );
      res.status(200).json(rows);
      return;
    }

    if (req.method === 'POST') {
      const {
        username,
        password,
        securityQuestionId,
        securityAnswer,
      } = req.body || {};

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password.trim(), BCRYPT_ROUNDS);

      let answerHash = null;
      if (securityAnswer && securityAnswer.trim()) {
        answerHash = await bcrypt.hash(securityAnswer.trim(), BCRYPT_ROUNDS);
      }

      const [result] = await adminPool.query(
        `INSERT INTO admin_users
           (username, password_hash, is_protected, security_question_id, security_answer_hash)
         VALUES (?, ?, 0, ?, ?)`,
        [
          username.trim(),
          passwordHash,
          securityQuestionId || null,
          answerHash,
        ]
      );

      res.status(201).json({ success: true, id: result.insertId });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[ADMIN] Error in /api/admin/users (serverless):', err);
    res.status(500).json({ error: 'Failed to process admin users' });
  }
}
