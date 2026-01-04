// api/admin/team/[id]/index.js
import { getAdminPool } from '../../../../lib/admindb.js';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const adminPool = getAdminPool();

  try {
    // PUT: update name/role (and optionally image_url if you want)
    if (method === 'PUT') {
      const { name, role, image_url } = req.body || {};

      if (!name || !role) {
        res.status(400).json({ error: 'Name and role are required.' });
        return;
      }

      const [result] = await adminPool.query(
        `UPDATE team_members
           SET name = ?,
               role = ?,
               image_url = ?
         WHERE id = ?`,
        [name, role, image_url ?? null, id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Team member not found.' });
        return;
      }

      res.status(200).json({ success: true });
      return;
    }

    // DELETE: remove the team member row
    if (method === 'DELETE') {
      const [result] = await adminPool.query(
        `DELETE FROM team_members WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Team member not found.' });
        return;
      }

      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[ADMIN] Error in /api/admin/team/[id]:', err);
    res.status(500).json({ error: 'Failed to update team member' });
  }
}
