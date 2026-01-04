// api/admin/security-questions.js
import { getAdminPool } from '../../lib/admindb.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const adminPool = getAdminPool();
    const [rows] = await adminPool.query(
      `SELECT id, question_text
         FROM security_questions
         ORDER BY id ASC`
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('[ADMIN] Error fetching security questions (serverless):', err);
    res.status(500).json({ error: 'Failed to fetch security questions' });
  }
}
