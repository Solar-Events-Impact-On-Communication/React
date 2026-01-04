// api/admin/events.js
import { getAdminPool } from '../../lib/admindb.js';

export default async function handler(req, res) {
  const adminPool = getAdminPool();

  try {
    if (req.method === 'GET') {
      const [rows] = await adminPool.query(
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
      return;
    }

    if (req.method === 'POST') {
      const {
        event_date,
        event_type,
        location,
        title,
        short_description,
        summary,
        impact_on_communication,
      } = req.body || {};

      if (!event_date || !title || !event_type || !summary) {
        return res.status(400).json({ error: 'event_date, title, event_type, and summary are required.' });
      }

      const [result] = await adminPool.query(
        `INSERT INTO solar_events
           (event_date, event_type, location, title, short_description, summary, impact_on_communication)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          event_date,
          event_type || null,
          location || null,
          title,
          short_description || null,
          summary || null,
          impact_on_communication || null,
        ]
      );

      res.status(201).json({ success: true, id: result.insertId });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[ADMIN] Error in /api/admin/events:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
