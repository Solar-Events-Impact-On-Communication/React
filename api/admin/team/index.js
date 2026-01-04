// api/admin/team/index.js
import { getAdminPool } from '../../../lib/admindb.js';

export default async function handler(req, res) {
  const method = req.method;
  const adminPool = getAdminPool();

  try {
    if (method === 'GET') {
      const [rows] = await adminPool.query(
        `SELECT
           id,
           name,
           role,
           image_url,
           display_order
         FROM team_members
         ORDER BY display_order ASC, id ASC`
      );

      res.status(200).json(rows);
      return;
    }

    if (method === 'POST') {
      const { name, role } = req.body || {};

      if (!name || !role) {
        res.status(400).json({ error: 'Name and role are required.' });
        return;
      }

      const [existing] = await adminPool.query(
        'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM team_members'
      );
      const nextOrder = (existing[0]?.max_order || 0) + 1;

      const [result] = await adminPool.query(
        `INSERT INTO team_members (name, role, display_order)
         VALUES (?, ?, ?)`,
        [name.trim(), role.trim(), nextOrder]
      );

      const insertedId = result.insertId;

      const [rows] = await adminPool.query(
        `SELECT id, name, role, image_url, display_order
           FROM team_members
          WHERE id = ?`,
        [insertedId]
      );

      res.status(201).json(rows[0]);
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[ADMIN] Error in /api/admin/team:', err);
    res.status(500).json({ error: 'Failed to fetch or modify team members' });
  }
}
