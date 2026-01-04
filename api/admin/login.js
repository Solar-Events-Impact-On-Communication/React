// api/admin/login.js
import bcrypt from 'bcryptjs';
import { getAdminPool } from '../../lib/admindb.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { username, password, securityAnswer } = req.body || {};

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const adminPool = getAdminPool();

    const [rows] = await adminPool.query(
      `SELECT 
         u.id,
         u.username,
         u.password_hash,
         u.is_protected,
         u.security_question_id,
         u.security_answer_hash,
         q.question_text
       FROM admin_users u
       LEFT JOIN security_questions q
         ON u.security_question_id = q.id
       WHERE u.username = ?
       LIMIT 1`,
      [username]
    );

    if (!rows.length) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const requiresSecurity =
      user.is_protected === 0 && user.security_question_id != null;

    if (requiresSecurity) {
      if (!securityAnswer) {
        res.status(400).json({
          error: 'Security answer required.',
          requiresSecurityAnswer: true,
          securityQuestionId: user.security_question_id,
          securityQuestionText: user.question_text,
        });
        return;
      }

      const answerOk = await bcrypt.compare(
        securityAnswer,
        user.security_answer_hash || ''
      );

      if (!answerOk) {
        res.status(401).json({ error: 'Incorrect security answer.' });
        return;
      }
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        is_protected: !!user.is_protected,
        securityQuestionId: user.security_question_id || null,
        requiresSecurityAnswer: false,
      },
    });
  } catch (err) {
    console.error('[ADMIN] Login error (serverless):', err);
    res.status(500).json({ error: 'Login failed due to a server error.' });
  }
}
