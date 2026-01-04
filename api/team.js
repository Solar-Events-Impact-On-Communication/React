// api/team.js
import { getPool } from '../lib/db.js'; // adjust path if your db file lives elsewhere

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
         name,
         role,
         image_url,
         display_order
       FROM team_members
       ORDER BY display_order ASC, id ASC`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error in /api/team:', err);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
}
