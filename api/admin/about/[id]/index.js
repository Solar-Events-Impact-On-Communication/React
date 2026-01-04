// api/admin/about/[id]/index.js
import { getAdminPool } from '../../../../lib/admindb.js';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const adminPool = getAdminPool();

  try {
    if (method === 'PUT') {
      const { display_order, title, text } = req.body || {};

      if (display_order == null || !title || !text) {
        res.status(400).json({
          error: 'display_order, title, and text are required.',
        });
        return;
      }

      const [result] = await adminPool.query(
        `UPDATE about_sections
           SET display_order = ?,
               title = ?,
               text = ?
         WHERE id = ?`,
        [display_order, title, text, id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'About section not found.' });
        return;
      }

      res.status(200).json({ success: true });
      return;
    }

    if (method === 'DELETE') {
      const [result] = await adminPool.query(
        `DELETE FROM about_sections WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'About section not found.' });
        return;
      }

      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[ADMIN] Error in /api/admin/about/[id] (serverless):', err);
    res.status(500).json({ error: 'Failed to update about section' });
  }
}
