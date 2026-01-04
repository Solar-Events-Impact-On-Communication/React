// api/admin/about.js
import { getAdminPool } from '../../lib/admindb.js';

export default async function handler(req, res) {
  const adminPool = getAdminPool();

  try {
    if (req.method === 'GET') {
      const [rows] = await adminPool.query(
        `SELECT 
           id,
           display_order,
           title,
           text
         FROM about_sections
         ORDER BY display_order ASC, id ASC`
      );
      res.status(200).json(rows);
      return;
    }

    if (req.method === 'POST') {
      const { display_order, title, text } = req.body || {};

      if (display_order == null || !title || !text) {
        res.status(400).json({
          error: 'display_order, title, and text are required.',
        });
        return;
      }

      const [result] = await adminPool.query(
        `INSERT INTO about_sections (display_order, title, text)
         VALUES (?, ?, ?)`,
        [display_order, title, text]
      );

      res.status(201).json({ success: true, id: result.insertId });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[ADMIN] Error in /api/admin/about (serverless):', err);
    res.status(500).json({ error: 'Failed to process about sections' });
  }
}
