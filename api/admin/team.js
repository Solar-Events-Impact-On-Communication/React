// api/admin/team.js
import { getAdminPool } from '../../lib/admindb.js';

export default async function handler(req, res) {
  const adminPool = getAdminPool();

  try {
    if (req.method === 'GET') {
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

    if (req.method === 'POST') {
      const { name, role, image_url } = req.body || {};

      if (!name || !role) {
        res.status(400).json({ error: 'name and role are required.' });
        return;
      }

      // append to end
      const [[{ max_order }]] = await adminPool.query(
        'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM team_members'
      );

      const [result] = await adminPool.query(
        `INSERT INTO team_members (name, role, image_url, display_order)
         VALUES (?, ?, ?, ?)`,
        [name, role, image_url || null, max_order + 1]
      );

      res.status(201).json({ success: true, id: result.insertId });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[ADMIN] Error in /api/admin/team (serverless):', err);
    res.status(500).json({ error: 'Failed to process team members' });
  }
}
