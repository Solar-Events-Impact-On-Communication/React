// api/events/[id]/media.js
import { getPool } from '../../../lib/db.js';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  if (method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT 
         id,
         event_id,
         url,
         caption
       FROM media_assets
       WHERE event_id = ?
       ORDER BY id ASC`,
      [id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching media assets:', err);
    res.status(500).json({ error: 'Failed to fetch media assets' });
  }
}
