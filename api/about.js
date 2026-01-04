// api/about.js
import { getPool } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         display_order,
         title,
         text
       FROM about_sections
       ORDER BY display_order ASC, id ASC`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching about_sections:', err);
    res.status(500).json({ error: 'Failed to fetch about page content' });
  }
}
