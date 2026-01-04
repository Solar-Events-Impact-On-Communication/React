// api/events.js
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
         event_date,
         event_type,
         location,
         title,
         short_description,
         summary,
         impact_on_communication
       FROM solar_events
       ORDER BY event_date ASC`
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching events from DB:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}
