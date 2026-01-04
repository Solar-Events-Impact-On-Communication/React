// api/admin/users/[id]/index.js
import bcrypt from 'bcryptjs';
import { getAdminPool } from '../../../../lib/admindb.js';

const BCRYPT_ROUNDS = 12;

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const adminPool = getAdminPool();

  try {
    // Check if protected
    const [existingRows] = await adminPool.query(
      `SELECT is_protected FROM admin_users WHERE id = ?`,
      [id]
    );

    if (!existingRows.length) {
      res.status(404).json({ error: 'Admin user not found.' });
      return;
    }

    if (existingRows[0].is_protected === 1 && method !== 'GET') {
      res.status(403).json({
        error: 'This account is protected and cannot be edited or deleted.',
      });
      return;
    }

    if (method === 'PUT') {
      const {
        password,
        securityQuestionId,
        securityAnswer,
      } = req.body || {};

      const fields = [];
      const values = [];

      if (password && password.trim()) {
        const passwordHash = await bcrypt.hash(password.trim(), BCRYPT_ROUNDS);
        fields.push('password_hash = ?');
        values.push(passwordHash);
      }

      if (typeof securityQuestionId !== 'undefined') {
        fields.push('security_question_id = ?');
        values.push(securityQuestionId || null);
      }

      if (securityAnswer && securityAnswer.trim()) {
        const answerHash = await bcrypt.hash(securityAnswer.trim(), BCRYPT_ROUNDS);
        fields.push('security_answer_hash = ?');
        values.push(answerHash);
      }

      if (!fields.length) {
        res.status(400).json({ error: 'No changes provided to update this user.' });
        return;
      }

      values.push(id);

      const [result] = await adminPool.query(
        `UPDATE admin_users
           SET ${fields.join(', ')}
         WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Admin user not found.' });
        return;
      }

      res.status(200).json({ success: true });
      return;
    }

    if (method === 'DELETE') {
      const [result] = await adminPool.query(
        `DELETE FROM admin_users WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Admin user not found.' });
        return;
      }

      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[ADMIN] Error in /api/admin/users/[id] (serverless):', err);
    res.status(500).json({ error: 'Failed to update admin user' });
  }
}
